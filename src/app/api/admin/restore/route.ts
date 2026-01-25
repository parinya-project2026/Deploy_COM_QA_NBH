import { NextRequest, NextResponse } from "next/server";
import { saveRecord } from "@/lib/storage";

export const dynamic = 'force-dynamic';

interface BackupRecord {
  id?: string;
  departmentId: string;
  departmentName: string;
  fiscalYear: string | number;
  month: string;
  data: Record<string, string>;
  updatedAt?: string;
}

interface BackupData {
  exportedAt?: string;
  totalRecords?: number;
  records: BackupRecord[];
}

/**
 * POST /api/admin/restore
 * Restore QA records from JSON backup file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as BackupData;

    // Validate backup structure
    if (!body.records || !Array.isArray(body.records)) {
      return NextResponse.json(
        { success: false, message: "รูปแบบไฟล์ Backup ไม่ถูกต้อง - ไม่พบ records array" },
        { status: 400 }
      );
    }

    if (body.records.length === 0) {
      return NextResponse.json(
        { success: false, message: "ไฟล์ Backup ไม่มีข้อมูล" },
        { status: 400 }
      );
    }

    // Process each record
    const results = {
      total: body.records.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const record of body.records) {
      try {
        // Validate required fields
        if (!record.departmentId || !record.departmentName || !record.fiscalYear || !record.month) {
          results.failed++;
          results.errors.push(`ข้อมูลไม่ครบ: ${record.departmentName || 'Unknown'} - ${record.month || 'Unknown'}`);
          continue;
        }

        // Convert fiscalYear to string if needed
        const fiscalYear = typeof record.fiscalYear === 'number' 
          ? record.fiscalYear.toString() 
          : record.fiscalYear;

        // Save record using upsert (will update if exists, create if not)
        await saveRecord(
          record.departmentId,
          record.departmentName,
          fiscalYear,
          record.month,
          record.data || {}
        );

        results.success++;
      } catch (recordError) {
        results.failed++;
        results.errors.push(`${record.departmentName} - ${record.month}: ${recordError instanceof Error ? recordError.message : 'Unknown error'}`);
      }
    }

    // Return results
    if (results.failed === 0) {
      return NextResponse.json({
        success: true,
        message: `นำเข้าข้อมูลสำเร็จทั้งหมด ${results.success} รายการ`,
        results
      });
    } else if (results.success > 0) {
      return NextResponse.json({
        success: true,
        message: `นำเข้าข้อมูลสำเร็จ ${results.success} รายการ, ล้มเหลว ${results.failed} รายการ`,
        results
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: `นำเข้าข้อมูลล้มเหลวทั้งหมด ${results.failed} รายการ`,
          results 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error restoring backup:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการนำเข้าข้อมูล" 
      },
      { status: 500 }
    );
  }
}

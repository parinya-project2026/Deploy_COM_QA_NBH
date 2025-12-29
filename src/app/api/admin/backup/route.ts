import { NextResponse } from "next/server";
import { getAllRecords } from "@/lib/storage";

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/backup
 * Export all QA records as JSON backup file
 */
export async function GET() {
    try {
        const records = await getAllRecords();

        const backupData = {
            exportedAt: new Date().toISOString(),
            totalRecords: records.length,
            records: records
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const encoder = new TextEncoder();
        const bytes = encoder.encode(jsonString);

        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `qa-backup-${timestamp}.json`;

        return new NextResponse(bytes, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": bytes.length.toString(),
            },
        });
    } catch (error) {
        console.error("Error creating backup:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการสร้างไฟล์ Backup" },
            { status: 500 }
        );
    }
}

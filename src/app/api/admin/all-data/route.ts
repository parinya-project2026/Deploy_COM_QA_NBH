import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type QARecord = {
  id: string;
  departmentId: string;
  departmentName: string;
  fiscalYear: string;
  month: string;
  data: Record<string, string>;
  updatedAt: string;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fiscalYear = searchParams.get("fiscalYear");

    // Read data directly from file system
    const dataPath = path.join(process.cwd(), "data", "qa-data.json");
    
    if (!fs.existsSync(dataPath)) {
      // Create empty data file if it doesn't exist
      fs.mkdirSync(path.dirname(dataPath), { recursive: true });
      fs.writeFileSync(dataPath, JSON.stringify({ records: [] }, null, 2));
      return NextResponse.json({
        success: true,
        data: [],
        totalRecords: 0
      });
    }

    const fileContent = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(fileContent) as { records: QARecord[] };

    // Filter by fiscal year if provided
    let filteredRecords = data.records || [];
    if (fiscalYear) {
      filteredRecords = filteredRecords.filter(r => r.fiscalYear === fiscalYear);
    }

    // Sort by department and month
    filteredRecords.sort((a, b) => {
      if (a.departmentId !== b.departmentId) {
        return a.departmentId.localeCompare(b.departmentId);
      }
      // Sort months in fiscal year order
      const monthOrder = [
        "ตุลาคม", "พฤศจิกายน", "ธันวาคม", 
        "มกราคม", "กุมภาพันธ์", "มีนาคม",
        "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน"
      ];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    return NextResponse.json({
      success: true,
      data: filteredRecords,
      totalRecords: filteredRecords.length
    });
  } catch (error) {
    console.error("Error fetching all departments data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
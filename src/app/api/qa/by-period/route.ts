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

function readData(): { records: QARecord[] } {
  const dataPath = path.join(process.cwd(), "data", "qa-data.json");
  
  if (!fs.existsSync(dataPath)) {
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataPath, JSON.stringify({ records: [] }, null, 2));
    return { records: [] };
  }

  try {
    const content = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading data:", error);
    return { records: [] };
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const departmentId = searchParams.get("departmentId");
    const fiscalYear = searchParams.get("fiscalYear");
    const month = searchParams.get("month");

    if (!departmentId || !fiscalYear || !month) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    const storage = readData();
    const recordId = `${departmentId}-${fiscalYear}-${month}`;
    const record = storage.records.find(r => r.id === recordId) || null;

    return NextResponse.json({
      success: true,
      record
    });
  } catch (error) {
    console.error("Error fetching record by period:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการโหลดข้อมูล" },
      { status: 500 }
    );
  }
}
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

function writeData(data: { records: QARecord[] }): void {
  const dataPath = path.join(process.cwd(), "data", "qa-data.json");
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { departmentId, fiscalYear, month } = body;

    if (!departmentId || !fiscalYear || !month) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    const storage = readData();
    const recordId = `${departmentId}-${fiscalYear}-${month}`;
    
    const initialLength = storage.records.length;
    storage.records = storage.records.filter(r => r.id !== recordId);
    
    if (storage.records.length < initialLength) {
      writeData(storage);
      return NextResponse.json({
        success: true,
        message: "ลบข้อมูลสำเร็จ"
      });
    }

    return NextResponse.json(
      { success: false, message: "ไม่พบข้อมูลที่ต้องการลบ" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error deleting record:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 }
    );
  }
}
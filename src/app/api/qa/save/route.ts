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

function getDaysInMonthThai(month: string, fiscalYearStr: string): number {
  const year = Number(fiscalYearStr) - 543;
  const isLeap = year % 4 === 0;
  const map: Record<string, number> = {
    "ตุลาคม": 31,
    "พฤศจิกายน": 30,
    "ธันวาคม": 31,
    "มกราคม": 31,
    "กุมภาพันธ์": isLeap ? 29 : 28,
    "มีนาคม": 31,
    "เมษายน": 30,
    "พฤษภาคม": 31,
    "มิถุนายน": 30,
    "กรกฎาคม": 31,
    "สิงหาคม": 31,
    "กันยายน": 30
  };
  return map[month] ?? 30;
}

function toNum(v: string | undefined): number {
  const n = parseFloat(v ?? "");
  return isNaN(n) ? 0 : n;
}

function computeFields(fields: Record<string, string>, fiscalYear: string, month: string): Record<string, string> {
  const next: Record<string, string> = { ...fields };

  // Days in month
  const dim = getDaysInMonthThai(month, fiscalYear);
  next.daysInMonth = dim.toString();

  // Pressure ulcer rate: (1.6.1 / 1.6.4) × 1000
  const s16_1 = toNum(next.s1_6_1);
  const s16_4 = toNum(next.s1_6_4);
  next.pressureUlcerRate = s16_4 > 0 ? ((s16_1 / s16_4) * 1000).toFixed(2) : "0.00";

  // Readmission rate: (2.1 / 2.2) × 100
  const s21 = toNum(next.s2_1);
  const s22 = toNum(next.s2_2);
  next.readmissionRate = s22 > 0 ? ((s21 / s22) * 100).toFixed(2) + "%" : "0.00%";

  // Average LOS: 3.1 / days in month
  const s31 = toNum(next.s3_1);
  next.averageLOS = dim > 0 ? (s31 / dim).toFixed(2) : "0.00";

  // Productivity calculations
  const a = toNum(next.s4_1);
  const b = toNum(next.s4_2);
  const c = toNum(next.s4_3);
  const rnHr = a * 7;
  const auxHr = (a + c) * 7;

  next.rnHr = rnHr.toFixed(2);
  next.auxHr = auxHr.toFixed(2);
  next.ratioRnAux = auxHr > 0 ? (rnHr / auxHr).toFixed(2) : "0.00";

  if (b > 0) {
    const hppd = (a * 7) / b;
    next.actualHPPD = hppd.toFixed(2);
    next.productivityValue = rnHr > 0 ? ((b * hppd * 100) / rnHr).toFixed(2) + "%" : "0.00%";
  } else {
    next.actualHPPD = "0.00";
    next.productivityValue = "0.00%";
  }

  // Pain management calculations
  const p1 = toNum(next.s11_1_1);
  const p2 = toNum(next.s11_1_2);
  next.s11_1_total = (p1 + p2).toFixed(2);

  const r1 = toNum(next.s11_3_1);
  const r2 = toNum(next.s11_3_2);
  next.s11_3_rate = r2 > 0 ? ((r1 / r2) * 100).toFixed(2) + "%" : "0.00%";

  return next;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { departmentId, departmentName, fiscalYear, month, fields } = body;

    if (!departmentId || !departmentName || !fiscalYear || !month) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    // Compute all fields before saving
    const computedFields = computeFields(fields || {}, fiscalYear, month);

    const storage = readData();
    const recordId = `${departmentId}-${fiscalYear}-${month}`;
    
    // Find existing record
    const existingIndex = storage.records.findIndex(r => r.id === recordId);
    
    const record: QARecord = {
      id: recordId,
      departmentId,
      departmentName,
      fiscalYear,
      month,
      data: computedFields,
      updatedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      // Update existing record
      storage.records[existingIndex] = record;
    } else {
      // Add new record
      storage.records.push(record);
    }
    
    writeData(storage);

    return NextResponse.json({
      success: true,
      record
    });
  } catch (error) {
    console.error("Error saving record:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  }
}
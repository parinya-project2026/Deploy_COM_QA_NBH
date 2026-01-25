/**
 * Shared Constants for QA System
 * ค่าคงที่ที่ใช้ร่วมกันทั้งระบบ
 */

// เดือนภาษาไทย (ตามปีงบประมาณ)
export const MONTHS_TH = [
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน"
] as const;

// ปีงบประมาณ
export const FISCAL_YEARS = ["2568", "2569", "2570", "2571", "2572"] as const;

// ลำดับเดือน (สำหรับ sorting)
export const MONTH_ORDER: Record<string, number> = MONTHS_TH.reduce((acc, month, idx) => {
  acc[month] = idx;
  return acc;
}, {} as Record<string, number>);

// ประเภทแผนก
export type DepartmentType = "IPD" | "OPD" | "SPECIAL" | "ICU";

// ICU Types
export type IcuType = "ICU-MED_1" | "ICU-MED_2" | "NICU" | "ICU_รวม";

// Department Interface
export interface Department {
  id: string;
  name: string;
  type?: DepartmentType;
  isIcu?: boolean;
  icuType?: IcuType;
}

// รายชื่อแผนก
export const DEPARTMENTS: Department[] = [
  // หอผู้ป่วยใน (IPD)
  { id: "DEPT001", name: "หอผู้ป่วยอายุรกรรมชาย", type: "IPD" },
  { id: "DEPT002", name: "หอผู้ป่วยอายุรกรรมหญิง", type: "IPD" },
  { id: "DEPT003", name: "หอผู้ป่วยจิตเวช", type: "IPD" },
  { id: "DEPT004", name: "หอผู้ป่วยพิเศษรวมน้ำใจ", type: "IPD" },
  { id: "DEPT005", name: "หอผู้ป่วยศัลยกรรมชาย", type: "IPD" },
  { id: "DEPT006", name: "หอผู้ป่วยศัลยกรรมหญิง", type: "IPD" },
  { id: "DEPT007", name: "หอผู้ป่วยหนักอายุรกรรมชั้น 1 (ICU-MED_1)", type: "ICU", isIcu: true, icuType: "ICU-MED_1" },
  { id: "DEPT008", name: "หอผู้ป่วยหนักอายุรกรรมชั้น 2 (ICU-MED_2)", type: "ICU", isIcu: true, icuType: "ICU-MED_2" },
  { id: "DEPT009", name: "หอผู้ป่วยกระดูกและข้อ", type: "IPD" },
  { id: "DEPT010", name: "หอผู้ป่วยพิเศษอายุรกรรมชั้น 4", type: "IPD" },
  { id: "DEPT011", name: "หอผู้ป่วยพิเศษศัลยกรรมชั้น 4", type: "IPD" },
  { id: "DEPT012", name: "หอผู้ป่วยกุมารเวช", type: "IPD" },
  { id: "DEPT013", name: "หอผู้ป่วยอภิบาลสงฆ์", type: "IPD" },
  { id: "DEPT014", name: "หอผู้ป่วยโสต ศอ นาสิก", type: "IPD" },
  { id: "DEPT015", name: "หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น 5", type: "IPD" },
  { id: "DEPT016", name: "หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น 4", type: "IPD" },
  { id: "DEPT017", name: "หอผู้ป่วยพิเศษกุมารเวช", type: "IPD" },
  { id: "DEPT018", name: "หอผู้ป่วยศัลยกรรมระบบประสาทและสมอง", type: "IPD" },
  { id: "DEPT019", name: "หอผู้ป่วยหนักกุมารเวช (NICU)", type: "ICU", isIcu: true, icuType: "NICU" },
  { id: "DEPT020", name: "หอผู้ป่วยสูติ-นรีเวช (PP)", type: "IPD" },
  { id: "DEPT021", name: "หอผู้ป่วยหนักรวม (ICU_รวม)", type: "ICU", isIcu: true, icuType: "ICU_รวม" },

  // หน่วยงานพิเศษ (Special Units)
  { id: "SPECIAL001", name: "ห้องผ่าตัด (OR)", type: "SPECIAL" },
  { id: "SPECIAL002", name: "ห้องอุบัติเหตุ ฉุกเฉิน (ER)", type: "SPECIAL" },
  { id: "SPECIAL003", name: "วิสัญญีพยาบาล (Anesth)", type: "SPECIAL" },
  { id: "SPECIAL004", name: "ห้องคลอด (LR)", type: "SPECIAL" },

  // แผนกผู้ป่วยนอก (OPD)
  { id: "OPD001", name: "OPD ศัลยกรรม", type: "OPD" },
  { id: "OPD002", name: "OPD กุมารเวช", type: "OPD" },
  { id: "OPD003", name: "OPD (Med+GP+Ortho+หัวใจ+พิเศษ)", type: "OPD" },
  { id: "OPD004", name: "OPD ANC", type: "OPD" },
  { id: "OPD005", name: "OPD Uro", type: "OPD" },
  { id: "OPD006", name: "OPD Neuro", type: "OPD" },
  { id: "OPD007", name: "OPD จักษุ", type: "OPD" },
  { id: "OPD008", name: "OPD ENT", type: "OPD" },
  { id: "OPD009", name: "OPD DM/HT", type: "OPD" },
  { id: "OPD010", name: "OPD CAPD", type: "OPD" },

  // Admin
  { id: "ADMIN", name: "ผู้ดูแลระบบ" }
];

// Department Name Mapping (สำหรับ lookup เร็ว)
export const DEPARTMENT_NAMES: Record<string, string> = DEPARTMENTS.reduce((acc, dept) => {
  acc[dept.id] = dept.name;
  return acc;
}, {} as Record<string, string>);

// Department IDs by Group
export const DEPARTMENT_GROUPS = {
  ipd: DEPARTMENTS.filter(d => d.type === "IPD" || d.type === "ICU").map(d => d.id),
  special: DEPARTMENTS.filter(d => d.type === "SPECIAL").map(d => d.id),
  opd: DEPARTMENTS.filter(d => d.type === "OPD").map(d => d.id),
  icu: DEPARTMENTS.filter(d => d.isIcu).map(d => d.id),
} as const;

// Helper function: หาข้อมูลแผนกจาก ID
export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find(d => d.id === id);
}

// Helper function: หาจำนวนวันในเดือน
export function getDaysInMonthThai(month: string, fiscalYearStr: string): number {
  const year = Number(fiscalYearStr) - 543;
  const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  
  const daysMap: Record<string, number> = {
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
  
  return daysMap[month] ?? 30;
}

// Type helpers
export type MonthTH = typeof MONTHS_TH[number];
export type FiscalYear = typeof FISCAL_YEARS[number];

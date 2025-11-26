'use client';

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Shield,
  Clock,
  Heart,
  Activity,
  Users,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Override Swal for consistent behavior
const SwalCustom = {
  ...Swal,
  fire: async (...args: Parameters<typeof Swal.fire>) => {
    const result = await Swal.fire(...args);
    return result || { isConfirmed: false, isDismissed: true, isDenied: false };
  },
  showLoading: Swal.showLoading,
  close: Swal.close
};

/* ----------------------------- CONFIG พื้นฐาน ----------------------------- */

type Role = "user" | "admin";

type Department = {
  id: string;
  name: string;
  password: string;
  isIcu?: boolean;
  icuType?: "ICU-MED_1" | "ICU-MED_2" | "NICU" | "ICU_รวม";
};

const DEPARTMENTS: Department[] = [
  { id: "DEPT001", name: "หอผู้ป่วยอายุรกรรมชาย", password: "MED_M2568" },
  { id: "DEPT002", name: "หอผู้ป่วยอายุรกรรมหญิง", password: "MED_F2568" },
  { id: "DEPT003", name: "หอผู้ป่วยจิตเวช", password: "PSY2568" },
  { id: "DEPT004", name: "หอผู้ป่วยพิเศษรวมน้ำใจ", password: "SPEC_NJ2568" },
  { id: "DEPT005", name: "หอผู้ป่วยศัลยกรรมชาย", password: "SURG_M2568" },
  { id: "DEPT006", name: "หอผู้ป่วยศัลยกรรมหญิง", password: "SURG_F2568" },
  { id: "DEPT007", name: "หอผู้ป่วยหนักอายุรกรรมชั้น 1(ICU-MED_1)", password: "ICUMED12568", isIcu: true, icuType: "ICU-MED_1" },
  { id: "DEPT008", name: "หอผู้ป่วยหนักอายุรกรรมชั้น 2(ICU-MED_2)", password: "ICUMED22568", isIcu: true, icuType: "ICU-MED_2" },
  { id: "DEPT009", name: "หอผู้ป่วยกระดูกและข้อ", password: "ORTHO2568" },
  { id: "DEPT010", name: "หอผู้ป่วยพิเศษอายุรกรรมชั้น4", password: "SPECMED42568" },
  { id: "DEPT011", name: "หอผู้ป่วยพิเศษศัลยกรรมชั้น4", password: "SPECSURG42568" },
  { id: "DEPT012", name: "หอผู้ป่วยกุมารเวช", password: "PEDS2568" },
  { id: "DEPT013", name: "หอผู้ป่วยอภิบาลสงฆ์", password: "MONK2568" },
  { id: "DEPT014", name: "หอผู้ป่วยโสต ศอ นาสิก", password: "ENT2568" },
  { id: "DEPT015", name: "หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น5", password: "SPECOBGYN52568" },
  { id: "DEPT016", name: "หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น4", password: "SPECOBGYN42568" },
  { id: "DEPT017", name: "หอผู้ป่วยพิเศษกุมารเวช", password: "SPECPEDS2568" },
  { id: "DEPT018", name: "หอผู้ป่วยศัลยกรรมระบบประสาทและสมอง", password: "NEURO2568" },
  { id: "DEPT019", name: "หอผู้ป่วยหนักกุมารเวช(NICU)", password: "NICU2568", isIcu: true, icuType: "NICU" },
  { id: "DEPT020", name: "หอผู้ป่วยสูติ-นรีเวช (PP)", password: "PP2568" },
  { id: "DEPT021", name: "หอผู้ป่วยหนักรวม(ICU_รวม)", password: "ICU2568", isIcu: true, icuType: "ICU_รวม" },
  { id: "ADMIN", name: "ผู้ดูแลระบบ", password: "admin@nbl2568" }
];

const MONTHS_TH = [
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
];

const FISCAL_YEARS = ["2568", "2569", "2570", "2571", "2572"];

type QAFields = Record<string, string>;

type QARecordView = {
  id: string;
  departmentId: string;
  departmentName: string;
  fiscalYear: string;
  month: string;
  data: QAFields;
  updatedAt: string;
};

interface DashboardData {
  monthlyTrends: Array<{
    month: string;
    productivity: number;
    pressureUlcerRate: number;
    readmissionRate: number;
    avgLOS: number;
    incidents: number;
  }>;
  safetyMetrics: Array<{
    type: string;
    count: number;
    color: string;
  }>;
  departmentPerformance: Array<{
    department: string;
    productivity: number;
    incidents: number;
    dataCompleteness: number;
  }>;
  cprData: {
    success: number;
    failed: number;
  };
  painManagementData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const COMPUTED_FIELDS = new Set([
  "pressureUlcerRate",
  "readmissionRate",
  "daysInMonth",
  "averageLOS",
  "rnHr",
  "auxHr",
  "ratioRnAux",
  "actualHPPD",
  "productivityValue",
  "s11_1_total",
  "s11_3_rate"
]);

const FIELD_LABELS: Record<string, string> = {
  // Section 1: ความปลอดภัยของผู้ใช้บริการ
  s1_1: "1.1 จำนวนอุบัติการณ์การระบุตัว ผป.ผิดคน",
  s1_2: "1.2 จำนวนอุบัติการณ์ให้การรักษาพยาบาลผิดคน",
  s1_3: "1.3 จำนวนอุบัติการณ์ความผิดพลาดในการบริหารยา (Drug Admin Error) ตั้งแต่ระดับ C ขึ้นไป",
  s1_4: "1.4 จำนวนอุบัติการณ์ความผิดพลาดในการให้เลือดและ/หรือส่วนประกอบของเลือด",
  s1_5: "1.5 จำนวนอุบัติการณ์การตายอย่างไม่คาดคิด",
  
  // Section 1.6: ตัวชี้วัดแผลกดทับ
  s1_6_1: "1.6.1 จำนวนผู้ป่วยเกิดแผลกดทับรายใหม่ stage 2",
  s1_6_2: "1.6.2 จำนวนผู้ป่วยเสี่ยงในเวรบ่าย",
  s1_6_3: "1.6.3 จำนวนผู้ป่วยเกิดแผลกดทับรายใหม่",
  s1_6_4: "1.6.4 จำนวนวันนอนรวมของผู้ป่วยกลุ่มเสี่ยงต่อการเป็นแผลกดทับ (คลอดทั้งเดือน)",
  pressureUlcerRate: "อัตราการเกิดแผลกดทับ (Auto-calculated)",
  
  // Section 1.7-1.10
  s1_7: "1.7 จำนวนอุบัติการณ์การพลัดตกหกล้ม",
  s1_8: "1.8 จำนวน ผป.บาดเจ็บจากการจัดท่า การผูกยึด การใช้อุปกรณ์และเครื่องมือ",
  s1_9: "1.9 จำนวนการเกิดอุบัติเหตุจากการปฏิบัติงานของบุคลากรฯ",
  s1_10: "1.10 จำนวนยา/เวชภัณฑ์/อุปกรณ์ทางการแพทย์หมดอายุเหลือค้าง",
  
  // Section 2: อัตราการกลับเข้ารับการรักษาซ้ำ
  s2_1: "2.1 จำนวน ผป. ที่กลับเข้ารับการรักษาซ้ำด้วยโรค/อาการเดิมภายใน 28 วัน",
  s2_2: "2.2 จำนวน ผป. ทั้งหมดในเดือนก่อนหน้านี้",
  readmissionRate: "อัตราการกลับเข้ารับการรักษาซ้ำ (%) (Auto-calculated)",
  
  // Section 3: ระยะวันนอนเฉลี่ย
  s3_1: "3.1 จำนวนวันนอนรวม",
  daysInMonth: "จำนวนวันในเดือน (Auto-detected)",
  averageLOS: "ระยะวันนอนเฉลี่ย (Auto-calculated)",
  
  // Section 4: ผลิตภาพและอัตรากำลัง
  s4_1: "4. A [Staff/Day] - จำนวน จนท. ขึ้นเวร (ไม่รวมหัวหน้าและ NA)",
  s4_2: "5. B [Patient Days] - ผลรวมผู้ป่วย / Day",
  s4_3: "7. TN, PN, AID - จำนวนรวม TN, PN และ AID",
  rnHr: "RN hr (A × 7)",
  auxHr: "Auxiliary hr ((A+C) × 7)",
  ratioRnAux: "Ratio RN/Aux",
  actualHPPD: "Actual HPPD",
  productivityValue: "Productivity (%)",
  
  // Section 7: CPR
  s7_1: "จำนวน pt. CPR",
  s7_2: "จำนวนครั้งที่ CPR ทั้งหมด",
  s7_3: "จำนวนครั้ง CPR สำเร็จ",
  
  // Section 8: SOS Scores
  s8_1: "8.1 จำนวนผู้ป่วยที่ได้รับการเฝ้าระวังอาการฯ ทั้งหมด",
  s8_2: "8.2 จำนวนผู้ป่วยที่ได้รับการประเมินล่าช้า",
  s8_3: "8.3 จำนวนครั้งที่ผู้ป่วยที่ได้รับการประเมินล่าช้า",
  s8_4: "8.4 จำนวนผู้ป่วยที่ได้รับการเฝ้าระวังอาการไม่สอดคล้องกับความรุนแรง",
  s8_5: "8.5 จำนวนครั้งที่เฝ้าระวังอาการผู้ป่วยไม่สอดคล้องกับความรุนแรง",
  
  // Section 9: เฉพาะ ICU - ย้าย ผป.กลับเข้า ICU
  s9_return: "9. ย้าย ผป.กลับเข้า ICU อย่างไม่คาดคิดภายใน 3 วัน (ราย)",
  
  // Section 10: เฉพาะ ICU - Unplan ICU
  // For ICU-MED_1 & ICU-MED_2
  s10_1_med_male: "10.1 อายุรกรรมชาย (ราย)",
  s10_2_med_female: "10.2 อายุรกรรมหญิง (ราย)",
  
  // For ICU_รวม (ตาม PDF)
  s10_1_med_male_icu: "10.1 อายุรกรรมชาย (Med ชาย) - ราย",
  s10_2_med_female_icu: "10.2 อายุรกรรมหญิง (Med หญิง) - ราย",
  s10_3_sur_male: "10.3 ศัลยกรรมชาย SUR - ราย",
  s10_4_sur_female: "10.4 ศัลยกรรมหญิง SUR - ราย",
  s10_5_ortho: "10.5 กระดูกและข้อ ทั้งชายและหญิง ORTHO - ราย",
  s10_6_obgyn: "10.6 สูติกรรม-นรีเวช OBGYNE - ราย",
  s10_7_ped: "10.7 หอผู้ป่วยหนักกุมารเวช PED - ราย",
  s10_8_ent: "10.8 หอผู้ป่วยโสต ศอ นาสิก ENT - ราย",
  s10_9_uro: "10.9 ศัลยกรรมระบบทางเดินปัสสาวะ URO - ราย",
  s10_10_neuro: "10.10 ศัลยกรรมระบบประสาทและสมอง NEURO - ราย",
  
  // Section 11: การจัดการความปวด (Pain Management)
  s11_1_1: "11.1.1 จำนวนครั้งของผู้ป่วยที่มีการบันทึกการจัดการความปวด (โดยการใช้ยา)",
  s11_1_2: "11.1.2 จำนวนครั้งของผู้ป่วยที่ได้รับการจัดการความปวด (โดยการไม่ใช้ยา)",
  s11_1_total: "Total (Auto-sum)",
  s11_2_1: "11.2.1 Acute Pain",
  s11_2_2: "11.2.2 Chronic Pain",
  s11_2_3: "11.2.3 Palliative Care Pain Management",
  s11_3_1: "11.3.1 จำนวนครั้งของผู้ป่วยที่มีการบันทึกการจัดการความปวดในเวชระเบียน",
  s11_3_2: "11.3.2 จำนวนครั้งของผู้ป่วยที่ได้รับการจัดการความปวดทั้งหมด",
  s11_3_rate: "ร้อยละความครบถ้วน (%) (Auto-calculated)",
  
  note: "หมายเหตุ"
};

// Helper function to get section configuration based on department
function getSectionConfig(dept: Department | null) {
  const baseConfig = [
    {
      key: "s1",
      title: "1. ความปลอดภัยของผู้ใช้บริการ",
      icon: "🛡️",
      fields: ["s1_1", "s1_2", "s1_3", "s1_4", "s1_5"]
    },
    {
      key: "s1_6",
      title: "1.6 ตัวชี้วัดแผลกดทับ",
      icon: "📑",
      fields: ["s1_6_1", "s1_6_2", "s1_6_3", "s1_6_4", "pressureUlcerRate"]
    },
    {
      key: "s1_other",
      title: "1.7 – 1.10 อุบัติการณ์อื่น ๆ",
      icon: "⚠️",
      fields: ["s1_7", "s1_8", "s1_9", "s1_10"]
    },
    {
      key: "s2",
      title: "2. อัตราการกลับเข้ารับการรักษาซ้ำ",
      icon: "🔄",
      fields: ["s2_1", "s2_2", "readmissionRate"]
    },
    {
      key: "s3",
      title: "3. ระยะวันนอนเฉลี่ย",
      icon: "🛏️",
      fields: ["s3_1", "daysInMonth", "averageLOS"]
    },
    {
      key: "s4",
      title: "4. ผลิตภาพและอัตรากำลัง (Productivity & Staffing)",
      icon: "📊",
      fields: ["s4_1", "s4_2", "s4_3", "rnHr", "auxHr", "ratioRnAux", "actualHPPD", "productivityValue"],
      highlight: true
    },
    {
      key: "s7",
      title: "7. CPR",
      icon: "❤️",
      fields: ["s7_1", "s7_2", "s7_3"]
    },
    {
      key: "s8",
      title: "8. SOS Scores",
      icon: "⚠️",
      fields: ["s8_1", "s8_2", "s8_3", "s8_4", "s8_5"]
    }
  ];

  // Add ICU-specific sections
  if (dept?.isIcu) {
    // Section 9: ย้าย ผป.กลับเข้า ICU
    baseConfig.push({
      key: "s9",
      title: "9. ข้อมูลเฉพาะ ICU",
      icon: "🏥",
      fields: ["s9_return"]
    });

    // Section 10: Unplan ICU - different for each ICU type
    if (dept.icuType === "ICU-MED_1" || dept.icuType === "ICU-MED_2") {
      baseConfig.push({
        key: "s10",
        title: "10. Unplan ICU",
        icon: "🚨",
        fields: ["s10_1_med_male", "s10_2_med_female"]
      });
    } else if (dept.icuType === "ICU_รวม") {
      baseConfig.push({
        key: "s10",
        title: "10. Unplan ICU",
        icon: "🚨",
        fields: [
          "s10_1_med_male_icu",
          "s10_2_med_female_icu",
          "s10_3_sur_male",
          "s10_4_sur_female",
          "s10_5_ortho",
          "s10_6_obgyn",
          "s10_7_ped",
          "s10_8_ent",
          "s10_9_uro",
          "s10_10_neuro"
        ]
      });
    }
    // NICU doesn't have section 10
  }

  // Section 11: Pain Management (for all departments)
  baseConfig.push({
    key: "s11",
    title: "11. การจัดการความปวด (Pain Management)",
    icon: "💊",
    fields: [
      "s11_1_1",
      "s11_1_2",
      "s11_1_total",
      "s11_2_1",
      "s11_2_2",
      "s11_2_3",
      "s11_3_1",
      "s11_3_2",
      "s11_3_rate"
    ]
  });

  return baseConfig;
}

/* ----------------------------- ฟังก์ชันคำนวณ ----------------------------- */

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

function computeFields(fields: QAFields, fiscalYear: string, month: string): QAFields {
  const next: QAFields = { ...fields };

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

/* ----------------------------- Dashboard Functions ----------------------------- */

function generateDashboardData(records: QARecordView[], selectedMonth?: string): DashboardData {
  const filteredRecords = selectedMonth && selectedMonth !== "ทั้งปี" 
    ? records.filter(r => r.month === selectedMonth)
    : records;

  // Monthly trends
  const monthlyTrends = MONTHS_TH.map(month => {
    const monthRecords = records.filter(r => r.month === month);
    const avgProductivity = monthRecords.length > 0
      ? monthRecords.reduce((sum, r) => sum + parseFloat(r.data.productivityValue?.replace("%", "") || "0"), 0) / monthRecords.length
      : 0;
    const avgPressureUlcer = monthRecords.length > 0
      ? monthRecords.reduce((sum, r) => sum + parseFloat(r.data.pressureUlcerRate || "0"), 0) / monthRecords.length
      : 0;
    const avgReadmission = monthRecords.length > 0
      ? monthRecords.reduce((sum, r) => sum + parseFloat(r.data.readmissionRate?.replace("%", "") || "0"), 0) / monthRecords.length
      : 0;
    const avgLOS = monthRecords.length > 0
      ? monthRecords.reduce((sum, r) => sum + parseFloat(r.data.averageLOS || "0"), 0) / monthRecords.length
      : 0;
    
    const totalIncidents = monthRecords.reduce((sum, r) => {
      return sum + 
        (parseInt(r.data.s1_1 || "0")) +
        (parseInt(r.data.s1_2 || "0")) +
        (parseInt(r.data.s1_3 || "0")) +
        (parseInt(r.data.s1_4 || "0")) +
        (parseInt(r.data.s1_5 || "0")) +
        (parseInt(r.data.s1_7 || "0")) +
        (parseInt(r.data.s1_8 || "0"));
    }, 0);

    return {
      month: month.slice(0, 3),
      productivity: parseFloat(avgProductivity.toFixed(1)),
      pressureUlcerRate: parseFloat(avgPressureUlcer.toFixed(2)),
      readmissionRate: parseFloat(avgReadmission.toFixed(1)),
      avgLOS: parseFloat(avgLOS.toFixed(1)),
      incidents: totalIncidents
    };
  });

  // Safety metrics
  const safetyMetrics = [
    { type: "ระบุตัวผิด", count: 0, color: "#ef4444" },
    { type: "รักษาผิดคน", count: 0, color: "#f97316" },
    { type: "ให้ยาผิด", count: 0, color: "#eab308" },
    { type: "ให้เลือดผิด", count: 0, color: "#84cc16" },
    { type: "พลัดตกหล้ม", count: 0, color: "#06b6d4" },
    { type: "แผลกดทับ", count: 0, color: "#8b5cf6" },
  ];

  filteredRecords.forEach(r => {
    safetyMetrics[0].count += parseInt(r.data.s1_1 || "0");
    safetyMetrics[1].count += parseInt(r.data.s1_2 || "0");
    safetyMetrics[2].count += parseInt(r.data.s1_3 || "0");
    safetyMetrics[3].count += parseInt(r.data.s1_4 || "0");
    safetyMetrics[4].count += parseInt(r.data.s1_7 || "0");
    safetyMetrics[5].count += parseInt(r.data.s1_6_3 || "0");
  });

  // CPR data
  const cprData = {
    success: filteredRecords.reduce((sum, r) => sum + parseInt(r.data.s7_3 || "0"), 0),
    failed: filteredRecords.reduce((sum, r) => sum + (parseInt(r.data.s7_2 || "0") - parseInt(r.data.s7_3 || "0")), 0)
  };

  // Pain management data
  const painManagementData = [
    { 
      name: "ใช้ยา", 
      value: filteredRecords.reduce((sum, r) => sum + parseInt(r.data.s11_1_1 || "0"), 0),
      color: "#10b981"
    },
    { 
      name: "ไม่ใช้ยา", 
      value: filteredRecords.reduce((sum, r) => sum + parseInt(r.data.s11_1_2 || "0"), 0),
      color: "#3b82f6"
    }
  ];

  // Department performance (for admin)
  const departmentMap = new Map<string, { productivity: number[], incidents: number, completeness: number }>();
  
  records.forEach(r => {
    if (!departmentMap.has(r.departmentName)) {
      departmentMap.set(r.departmentName, { productivity: [], incidents: 0, completeness: 0 });
    }
    const dept = departmentMap.get(r.departmentName)!;
    dept.productivity.push(parseFloat(r.data.productivityValue?.replace("%", "") || "0"));
    dept.incidents += parseInt(r.data.s1_1 || "0") + parseInt(r.data.s1_2 || "0") + parseInt(r.data.s1_3 || "0");
    dept.completeness = (dept.productivity.length / 12) * 100;
  });

  const departmentPerformance = Array.from(departmentMap.entries()).map(([name, data]) => ({
    department: name.length > 15 ? name.slice(0, 15) + "..." : name,
    productivity: data.productivity.length > 0 ? data.productivity.reduce((a, b) => a + b, 0) / data.productivity.length : 0,
    incidents: data.incidents,
    dataCompleteness: data.completeness
  })).slice(0, 10); // Top 10 departments

  return {
    monthlyTrends,
    safetyMetrics,
    departmentPerformance,
    cprData,
    painManagementData
  };
}

// Dashboard Component
function DashboardAnalytics({ 
  data, 
  isAdmin = false,
  selectedMonth = "ทั้งปี"
}: { 
  data: DashboardData; 
  isAdmin?: boolean;
  selectedMonth?: string;
}) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Productivity เฉลี่ย</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {(data.monthlyTrends.reduce((sum, m) => sum + m.productivity, 0) / data.monthlyTrends.filter(m => m.productivity > 0).length || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">เป้าหมาย ≥80%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">อัตราแผลกดทับ</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {(data.monthlyTrends.reduce((sum, m) => sum + m.pressureUlcerRate, 0) / data.monthlyTrends.filter(m => m.pressureUlcerRate > 0).length || 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1">ต่อ 1,000 วันนอน</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">LOS เฉลี่ย</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {(data.monthlyTrends.reduce((sum, m) => sum + m.avgLOS, 0) / data.monthlyTrends.filter(m => m.avgLOS > 0).length || 0).toFixed(1)} วัน
              </p>
              <p className="text-xs text-slate-500 mt-1">ระยะวันนอน</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">CPR สำเร็จ</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {data.cprData.success} ครั้ง
              </p>
              <p className="text-xs text-slate-500 mt-1">
                จากทั้งหมด {data.cprData.success + data.cprData.failed} ครั้ง
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">แนวโน้ม Productivity รายเดือน</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value: any) => `${value}%`}
              />
              <Area 
                type="monotone" 
                dataKey="productivity" 
                stroke="#3b82f6" 
                fill="#93bbfc" 
                strokeWidth={2}
              />
              <Line type="monotone" dataKey="productivity" stroke="#3b82f6" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Safety Metrics Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">อุบัติการณ์ความปลอดภัย</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.safetyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {data.safetyMetrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Multi-Line Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">เปรียบเทียบตัวชี้วัดหลัก</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line 
                type="monotone" 
                dataKey="pressureUlcerRate" 
                stroke="#10b981" 
                strokeWidth={2}
                name="อัตราแผลกดทับ"
              />
              <Line 
                type="monotone" 
                dataKey="readmissionRate" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Re-admission (%)"
              />
              <Line 
                type="monotone" 
                dataKey="avgLOS" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="LOS เฉลี่ย"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pain Management Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">การจัดการความปวด</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.painManagementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.painManagementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Performance (Admin Only) */}
      {isAdmin && data.departmentPerformance.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">ประสิทธิภาพรายแผนก (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.departmentPerformance} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="department" type="category" tick={{ fontSize: 10 }} width={150} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="productivity" fill="#3b82f6" name="Productivity (%)" radius={[0, 8, 8, 0]} />
              <Bar dataKey="dataCompleteness" fill="#10b981" name="ความครบถ้วน (%)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Incidents Heatmap */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">อุบัติการณ์รายเดือน (Heatmap)</h3>
        <div className="grid grid-cols-12 gap-1">
          {data.monthlyTrends.map((month, idx) => {
            const bgColor = month.incidents === 0 
              ? "bg-slate-100" 
              : month.incidents < 5 
              ? "bg-green-200" 
              : month.incidents < 10 
              ? "bg-amber-200" 
              : "bg-red-200";
            
            return (
              <div key={idx} className="text-center">
                <div className="text-[10px] text-slate-600 mb-1">{month.month}</div>
                <div 
                  className={`w-full h-10 rounded ${bgColor} flex items-center justify-center text-xs font-semibold`}
                  title={`${month.incidents} อุบัติการณ์`}
                >
                  {month.incidents}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-200 rounded" /> ต่ำ (0-4)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-200 rounded" /> ปานกลาง (5-9)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 rounded" /> สูง (10+)</span>
        </div>
      </div>
    </div>
  );
}

// Admin Edit Modal Component
function AdminEditModal({
  isOpen,
  onClose,
  record,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  record: QARecordView | null;
  onSave: (updatedRecord: QARecordView) => void;
}) {
  const [editedFields, setEditedFields] = useState<QAFields>({});
  
  useEffect(() => {
    if (record) {
      setEditedFields(record.data);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSave = async () => {
    const computed = computeFields(editedFields, record.fiscalYear, record.month);
    const updatedRecord = { ...record, data: computed };
    
    // Call API to save
    try {
      const res = await fetch("/api/qa/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: record.departmentId,
          departmentName: record.departmentName,
          fiscalYear: record.fiscalYear,
          month: record.month,
          fields: computed
        })
      });
      
      const json = await res.json();
      if (json.success) {
        onSave(updatedRecord);
        onClose();
        Swal.fire({
          icon: "success",
          title: "บันทึกข้อมูลสำเร็จ",
          timer: 1500
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถบันทึกข้อมูลได้"
      });
    }
  };

  const dept = DEPARTMENTS.find(d => d.id === record.departmentId);
  const sectionConfig = getSectionConfig(dept || null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">แก้ไขข้อมูล</h2>
            <p className="text-sm text-slate-500">
              {record.departmentName} - {record.month} {record.fiscalYear}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {sectionConfig.map(section => (
              <div key={section.key} className="border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <span>{section.icon}</span>
                  {section.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.fields.map(fieldId => {
                    const label = FIELD_LABELS[fieldId] || fieldId;
                    const isComputed = COMPUTED_FIELDS.has(fieldId);
                    const value = editedFields[fieldId] ?? "";
                    
                    return (
                      <div key={fieldId} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-700">
                          {label}
                          {isComputed && <span className="ml-1 text-[10px] text-indigo-500">(คำนวณอัตโนมัติ)</span>}
                        </label>
                        <input
                          type="text"
                          value={value}
                          readOnly={isComputed}
                          onChange={e => !isComputed && setEditedFields(prev => 
                            computeFields({ ...prev, [fieldId]: e.target.value }, record.fiscalYear, record.month)
                          )}
                          className={`w-full rounded-lg border px-3 py-2 text-sm ${
                            isComputed
                              ? "bg-blue-50 border-blue-200 text-blue-900"
                              : "border-slate-200 bg-white"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            บันทึกการเปลี่ยนแปลง
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- หน้า Home -------------------------------- */

export default function HomePage() {
  const [role, setRole] = useState<Role>("user");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [password, setPassword] = useState("");
  const [currentDept, setCurrentDept] = useState<Department | null>(null);

  const [fiscalYear, setFiscalYear] = useState("2568");
  const [month, setMonth] = useState<string>("ตุลาคม");

  const [fields, setFields] = useState<QAFields>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const [yearData, setYearData] = useState<{
    [month: string]: { id: string; updatedAt: string } | undefined;
  }>({});

  const [yearRecords, setYearRecords] = useState<QARecordView[]>([]);
  const [tableRecord, setTableRecord] = useState<QARecordView | null>(null);

  const [activeTab, setActiveTab] = useState<"form" | "table" | "admin">("form");

  // Admin state
  const [allDepartmentsData, setAllDepartmentsData] = useState<any[]>([]);
  const [adminSelectedYear, setAdminSelectedYear] = useState("2568");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all");
  const [editingRecord, setEditingRecord] = useState<QARecordView | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Dashboard state
  const [dashboardMonth, setDashboardMonth] = useState<string>("ทั้งปี");

  const isLoggedIn = (role === "user" && !!currentDept) || (role === "admin" && currentDept?.id === "ADMIN");

  const selectedDept = useMemo(
    () => DEPARTMENTS.find(d => d.id === selectedDeptId) || null,
    [selectedDeptId]
  );

  const sectionConfig = useMemo(
    () => getSectionConfig(currentDept),
    [currentDept]
  );

  const analytics = useMemo(() => {
    if (!yearRecords.length) {
      return {
        monthsFilled: 0,
        averageProductivity: "0.00%",
        averageLOS: "0.00",
        totalCPRSuccess: 0,
        pressureUlcerRateAvg: "0.00",
      };
    }

    const parsePercent = (value?: string) => {
      if (!value) return 0;
      return parseFloat(value.replace("%", "")) || 0;
    };

    const avg = (values: number[]) => (values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : "0.00");

    const productivityVals = yearRecords.map(r => parsePercent(r.data.productivityValue));
    const losVals = yearRecords.map(r => parseFloat(r.data.averageLOS || "0"));
    const ulcerVals = yearRecords.map(r => parseFloat(r.data.pressureUlcerRate || "0"));
    const totalCPR = yearRecords.reduce((sum, r) => sum + (parseFloat(r.data.s7_3 || "0") || 0), 0);

    return {
      monthsFilled: yearRecords.length,
      averageProductivity: `${avg(productivityVals)}%`,
      averageLOS: avg(losVals),
      totalCPRSuccess: totalCPR,
      pressureUlcerRateAvg: avg(ulcerVals),
    };
  }, [yearRecords]);

  const missingMonths = useMemo(() => MONTHS_TH.filter(m => !yearData[m]), [yearData]);

  useEffect(() => {
    if (isLoggedIn && role === "user") {
      handleLoadPeriod();
      handleLoadYear();
    } else if (isLoggedIn && role === "admin") {
      loadAllDepartmentsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, role]);

  useEffect(() => {
    setFields(prev => computeFields(prev, fiscalYear, month));
  }, [fiscalYear, month]);

  function showAlert(type: "success" | "error" | "warning", message: string) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  function showSweetLoading(message: string) {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: "#f8fafc",
      customClass: {
        popup: "rounded-2xl shadow-2xl",
      },
    });
  }

  function showSweetSuccess(message: string) {
    Swal.fire({
      icon: "success",
      title: message,
      timer: 1800,
      showConfirmButton: false,
      background: "#f8fafc",
      customClass: {
        popup: "rounded-2xl shadow-2xl",
      },
    });
  }

  /* ----------------------------- ฟังก์ชัน Login ---------------------------- */

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (role === "user") {
      if (!selectedDept || !password) {
        showAlert("error", "กรุณาเลือกแผนกและกรอกรหัสผ่าน");
        return;
      }
      if (password !== selectedDept.password) {
        showAlert("error", "รหัสผ่านไม่ถูกต้อง");
        return;
      }
      setCurrentDept(selectedDept);
      setPassword("");
      showAlert("success", `เข้าสู่ระบบแผนก: ${selectedDept.name}`);
    } else {
      if (password !== "admin@nbl2568") {
        showAlert("error", "รหัสผ่าน Admin ไม่ถูกต้อง");
        return;
      }
      setCurrentDept(DEPARTMENTS.find(d => d.id === "ADMIN") || null);
      showAlert("success", "เข้าสู่ระบบ Admin สำเร็จ");
    }
  }

  function handleLogout() {
    setCurrentDept(null);
    setSelectedDeptId("");
    setFields({});
    setYearData({});
    setAllDepartmentsData([]);
    setActiveTab("form");
  }

  /* ---------------------- เรียก API โหลด/บันทึกข้อมูล --------------------- */

  async function handleLoadPeriod() {
    if (!currentDept) return;
    setLoading(true);
    showSweetLoading("กำลังโหลดข้อมูลเดือนนี้...");
    try {
      const params = new URLSearchParams({
        departmentId: currentDept.id,
        fiscalYear,
        month
      }).toString();

      const res = await fetch(`/api/qa/by-period?${params}`);
      const json = await res.json();

      if (!json.success) {
        Swal.close();
        showAlert("error", json.message || "โหลดข้อมูลไม่สำเร็จ");
        return;
      }

      Swal.close();

      if (!json.record) {
        setFields(prev => computeFields(prev, fiscalYear, month));
        showAlert("warning", "ยังไม่มีข้อมูลเดือนนี้");
      } else {
        const data = (json.record.data || {}) as QAFields;
        setFields(computeFields(data, fiscalYear, json.record.month));
        showAlert("success", "โหลดข้อมูลสำเร็จ");
        showSweetSuccess("โหลดข้อมูลสำเร็จ");
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      showAlert("error", "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadTableRecord() {
    if (!currentDept) return;
    setLoading(true);
    showSweetLoading("กำลังโหลดข้อมูลแสดงผล...");
    try {
      const params = new URLSearchParams({
        departmentId: currentDept.id,
        fiscalYear,
        month
      }).toString();

      const res = await fetch(`/api/qa/by-period?${params}`);
      const json = await res.json();

      Swal.close();

      if (!json.success || !json.record) {
        setTableRecord(null);
        showAlert("warning", json.message || "ไม่พบข้อมูลเดือนนี้");
        return;
      }

      const computed = computeFields(json.record.data || {}, fiscalYear, json.record.month) as QAFields;
      setTableRecord({ ...json.record, data: computed });
      showAlert("success", "โหลดข้อมูลแสดงผลสำเร็จ");
      showSweetSuccess("โหลดข้อมูลแสดงผลสำเร็จ");
    } catch (error) {
      console.error(error);
      Swal.close();
      showAlert("error", "เกิดข้อผิดพลาดในการโหลดข้อมูลแสดงผล");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadYear() {
    if (!currentDept) return;
    showSweetLoading("กำลังอัปเดตสถานะรายปี...");
    try {
      const params = new URLSearchParams({
        departmentId: currentDept.id,
        fiscalYear
      }).toString();

      const res = await fetch(`/api/qa/by-year?${params}`);
      const json = await res.json();

      if (!json.success) {
        Swal.close();
        showAlert("error", json.message || "โหลดข้อมูลรายปีไม่สำเร็จ");
        return;
      }

      const data = json.data as Record<string, any>;
      const map: { [m: string]: { id: string; updatedAt: string } | undefined } = {};
      for (const m of MONTHS_TH) {
        const rec = data[m];
        if (rec) {
          map[m] = { id: rec.id, updatedAt: rec.updatedAt };
        }
      }
      setYearData(map);
      const records = (json.records as QARecordView[] | undefined) ?? [];
      setYearRecords(records.map(rec => ({ ...rec, data: computeFields(rec.data, rec.fiscalYear, rec.month) })));
      Swal.close();
      showAlert("success", "อัปเดตสถานะรายปีสำเร็จ");
      showSweetSuccess("โหลดข้อมูลรายปีสำเร็จ");
    } catch (err) {
      console.error(err);
      Swal.close();
      showAlert("error", "เกิดข้อผิดพลาดในการโหลดข้อมูลรายปี");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentDept || role !== "user") {
      showAlert("error", "ยังไม่เข้าสู่ระบบแผนก");
      return;
    }

    const computed = computeFields(fields, fiscalYear, month);
    setFields(computed);

    setLoading(true);
    showSweetLoading("กำลังบันทึกข้อมูล...");
    try {
      const res = await fetch("/api/qa/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: currentDept.id,
          departmentName: currentDept.name,
          fiscalYear,
          month,
          fields: computed
        })
      });

      const json = await res.json();

      if (!json.success) {
        Swal.close();
        showAlert("error", json.message || "บันทึกข้อมูลไม่สำเร็จ");
        return;
      }

      Swal.close();
      showAlert("success", "บันทึกข้อมูลสำเร็จ");
      showSweetSuccess("บันทึกข้อมูลสำเร็จ");
      handleLoadYear();
    } catch (err) {
      console.error(err);
      Swal.close();
      showAlert("error", "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  function handleEditFromTable() {
    if (!tableRecord) return;
    setMonth(tableRecord.month);
    setFiscalYear(tableRecord.fiscalYear);
    setFields(computeFields(tableRecord.data, tableRecord.fiscalYear, tableRecord.month));
    setActiveTab("form");
    showAlert("success", "โหลดข้อมูลเข้าสู่โหมดแก้ไขแล้ว");
  }

  async function handleDeleteRecord() {
    if (!currentDept || !tableRecord || role !== "user") return;

    const confirm = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบข้อมูล",
      text: `ต้องการลบข้อมูลเดือน ${tableRecord.month} ปี ${tableRecord.fiscalYear} หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });

    if (!confirm?.isConfirmed) return;

    setLoading(true);
    showSweetLoading("กำลังลบข้อมูล...");
    try {
      const res = await fetch("/api/qa/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: currentDept.id,
          fiscalYear: tableRecord.fiscalYear,
          month: tableRecord.month,
        })
      });

      const json = await res.json();
      Swal.close();

      if (!json.success) {
        showAlert("error", json.message || "ลบข้อมูลไม่สำเร็จ");
        return;
      }

      showSweetSuccess("ลบข้อมูลสำเร็จ");
      setTableRecord(null);
      setYearRecords(prev => prev.filter(r => !(r.month === tableRecord.month && r.fiscalYear === tableRecord.fiscalYear)));
      setYearData(prev => {
        const next = { ...prev };
        delete next[tableRecord.month];
        return next;
      });
    } catch (error) {
      console.error(error);
      Swal.close();
      showAlert("error", "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  function handleFieldChange(id: string, value: string) {
    setFields(prev => computeFields({ ...prev, [id]: value }, fiscalYear, month));
  }

  /* ----------------------------- Admin Functions ----------------------------- */

  async function loadAllDepartmentsData() {
    if (role !== "admin") return;
    
    setLoading(true);
    showSweetLoading("กำลังโหลดข้อมูลทั้งหมด...");
    
    try {
      const res = await fetch(`/api/admin/all-data?fiscalYear=${adminSelectedYear}`);
      const json = await res.json();
      
      Swal.close();
      
      if (!json.success) {
        showAlert("error", json.message || "โหลดข้อมูลไม่สำเร็จ");
        return;
      }
      
      setAllDepartmentsData(json.data || []);
      showSweetSuccess("โหลดข้อมูลสำเร็จ");
    } catch (error) {
      console.error(error);
      Swal.close();
      showAlert("error", "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------- Render Functions ----------------------------- */

  function renderComputedHint(id: string) {
    const hints: Record<string, string> = {
      pressureUlcerRate: "สูตร: (1.6.1 / 1.6.4) × 1000",
      readmissionRate: "สูตร: (2.1 / 2.2) × 100",
      averageLOS: "สูตร: 3.1 / จำนวนวันในเดือน",
      productivityValue: "สูตร: (B × HPPD × 100) / RN hrs",
      actualHPPD: "สูตร: (A × 7) / B",
      rnHr: "สูตร: A × 7",
      auxHr: "สูตร: (A + C) × 7",
      ratioRnAux: "สูตร: RN hr / Auxiliary hr",
      s11_1_total: "สูตร: 11.1.1 + 11.1.2",
      s11_3_rate: "สูตร: (11.3.1 / 11.3.2) × 100",
    };

    const hint = hints[id];
    return (
      <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-dashed border-amber-200 rounded-lg px-3 py-2">
        {hint || "คำนวณอัตโนมัติจากข้อมูลในหัวข้อเดียวกัน"}
      </p>
    );
  }

  function renderFieldInput(fieldId: string) {
    const label = FIELD_LABELS[fieldId] || fieldId;
    const isComputed = COMPUTED_FIELDS.has(fieldId);
    const value = fields[fieldId] ?? "";

    return (
      <div key={fieldId} className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-700">
          {label}
          {isComputed && <span className="ml-1 text-[10px] text-indigo-500">(คำนวณอัตโนมัติ)</span>}
        </label>
        <input
          type="text"
          value={value}
          readOnly={isComputed}
          onChange={e => !isComputed && handleFieldChange(fieldId, e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${
            isComputed
              ? "bg-blue-50 border-blue-200 text-blue-900 focus:ring-blue-300"
              : "border-slate-200 bg-white focus:ring-indigo-500"
          }`}
        />
        {isComputed && renderComputedHint(fieldId)}
      </div>
    );
  }

  function renderRecordTable(record: QARecordView) {
    const dept = DEPARTMENTS.find(d => d.id === record.departmentId);
    const config = getSectionConfig(dept || null);

    return (
      <div className="space-y-4">
        {config.map(section => (
          <div key={section.key} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span>{section.icon}</span>
              <span>{section.title}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200">
              {section.fields.map(fid => (
                <div key={fid} className="bg-white px-4 py-3">
                  <div className="text-xs font-semibold text-slate-800">{FIELD_LABELS[fid]}</div>
                  <div className="text-sm text-indigo-700 font-mono mt-1">
                    {record.data[fid] ?? "-"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderAdminDashboard() {
    // เปลี่ยนจาก useMemo เป็นการคำนวณธรรมดา
    const summaryData = (() => {
      const totalDepts = DEPARTMENTS.filter(d => d.id !== "ADMIN").length;
      const deptsWithData = new Set(allDepartmentsData.map(d => d.departmentId)).size;
      const totalRecords = allDepartmentsData.length;
      
      // Calculate averages
      let avgProductivity = 0;
      let avgLOS = 0;
      let totalCPR = 0;
      let avgPressureUlcer = 0;
      let recordCount = 0;

      allDepartmentsData.forEach(record => {
        if (record.data) {
          const data = computeFields(record.data, record.fiscalYear, record.month);
          const productivity = parseFloat(data.productivityValue?.replace("%", "") || "0");
          const los = parseFloat(data.averageLOS || "0");
          const cpr = parseFloat(data.s7_3 || "0");
          const ulcer = parseFloat(data.pressureUlcerRate || "0");
          
          if (productivity > 0) avgProductivity += productivity;
          if (los > 0) avgLOS += los;
          totalCPR += cpr;
          if (ulcer > 0) avgPressureUlcer += ulcer;
          recordCount++;
        }
      });

      if (recordCount > 0) {
        avgProductivity = avgProductivity / recordCount;
        avgLOS = avgLOS / recordCount;
        avgPressureUlcer = avgPressureUlcer / recordCount;
      }

      return {
        totalDepts,
        deptsWithData,
        totalRecords,
        avgProductivity: avgProductivity.toFixed(2) + "%",
        avgLOS: avgLOS.toFixed(2),
        totalCPR,
        avgPressureUlcer: avgPressureUlcer.toFixed(2)
      };
    })(); // เรียกใช้ function ทันที

    // Generate dashboard data for admin
    const adminDashboardData = generateDashboardData(
      allDepartmentsData.map(d => ({
        ...d,
        data: computeFields(d.data || {}, d.fiscalYear, d.month)
      })),
      dashboardMonth
    );

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">แผนกที่มีข้อมูล</p>
                <p className="text-3xl font-bold mt-1">
                  {summaryData.deptsWithData} / {summaryData.totalDepts}
                </p>
                <p className="text-xs opacity-75 mt-1">จำนวนบันทึกทั้งหมด: {summaryData.totalRecords}</p>
              </div>
              <div className="text-4xl opacity-50">🏥</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Productivity เฉลี่ย</p>
                <p className="text-3xl font-bold mt-1">{summaryData.avgProductivity}</p>
                <p className="text-xs opacity-75 mt-1">เป้าหมาย ≥80%</p>
              </div>
              <div className="text-4xl opacity-50">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">LOS เฉลี่ย</p>
                <p className="text-3xl font-bold mt-1">{summaryData.avgLOS} วัน</p>
                <p className="text-xs opacity-75 mt-1">ระยะวันนอนเฉลี่ย</p>
              </div>
              <div className="text-4xl opacity-50">🛏️</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">อัตราแผลกดทับเฉลี่ย</p>
                <p className="text-3xl font-bold mt-1">{summaryData.avgPressureUlcer}</p>
                <p className="text-xs opacity-75 mt-1">ต่อ 1,000 วันนอน</p>
              </div>
              <div className="text-4xl opacity-50">📈</div>
            </div>
          </div>
        </div>

        {/* Dashboard Analytics */}
        <section className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                📊
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Dashboard Analytics (Admin)</h3>
                <p className="text-xs text-slate-500">
                  วิเคราะห์ข้อมูลเชิงลึกทุกแผนก
                </p>
              </div>
            </div>
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={dashboardMonth}
              onChange={(e) => setDashboardMonth(e.target.value)}
            >
              <option value="ทั้งปี">ดูภาพรวมทั้งปี</option>
              {MONTHS_TH.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          
          {allDepartmentsData.length > 0 ? (
            <DashboardAnalytics 
              data={adminDashboardData} 
              isAdmin={true}
              selectedMonth={dashboardMonth}
            />
          ) : (
            <div className="text-center py-10 text-sm text-slate-500">
              ยังไม่มีข้อมูลสำหรับแสดง Dashboard
            </div>
          )}
        </section>

        {/* Department Data Table with Edit */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">ข้อมูลรายแผนก (คลิกเพื่อแก้ไข)</h3>
              <p className="text-sm text-slate-500">ปีงบประมาณ {adminSelectedYear}</p>
            </div>
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
            >
              <option value="all">ทุกแผนก</option>
              {DEPARTMENTS.filter(d => d.id !== "ADMIN").map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">แผนก</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">เดือน</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Productivity</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">LOS</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">แผลกดทับ</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allDepartmentsData
                  .filter(r => selectedDeptFilter === "all" || r.departmentId === selectedDeptFilter)
                  .map((record, idx) => {
                    const computed = computeFields(record.data || {}, record.fiscalYear, record.month);
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {record.departmentName}
                          {DEPARTMENTS.find(d => d.id === record.departmentId)?.isIcu && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              ICU
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">{record.month}</td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span className={`font-medium ${
                            parseFloat(computed.productivityValue?.replace("%", "") || "0") >= 80
                              ? "text-green-600"
                              : "text-red-600"
                          }`}>
                            {computed.productivityValue || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">{computed.averageLOS || "-"}</td>
                        <td className="px-4 py-3 text-center text-sm">{computed.pressureUlcerRate || "-"}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setEditingRecord({ ...record, data: computed });
                              setShowEditModal(true);
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-medium hover:bg-indigo-200"
                          >
                            แก้ไข
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Month Completion Matrix */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">ความครบถ้วนรายเดือน</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 text-sm">แผนก</th>
                  {MONTHS_TH.map(month => (
                    <th key={month} className="text-center px-1 py-2 text-xs">
                      {month.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEPARTMENTS.filter(d => d.id !== "ADMIN").map(dept => {
                  const deptRecords = allDepartmentsData.filter(r => r.departmentId === dept.id);
                  const monthsWithData = new Set(deptRecords.map(r => r.month));
                  
                  return (
                    <tr key={dept.id} className="border-t border-slate-100">
                      <td
                        className="py-2 px-2 text-sm font-medium text-slate-700 whitespace-normal break-words"
                        title={dept.name}
                      >
                        {dept.name}
                      </td>
                      {MONTHS_TH.map(month => (
                        <td key={month} className="text-center p-1">
                          <div className={`w-6 h-6 mx-auto rounded ${
                            monthsWithData.has(month)
                              ? "bg-green-500"
                              : "bg-gray-200"
                          }`} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Edit Modal */}
        <AdminEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingRecord(null);
          }}
          record={editingRecord}
          onSave={(updatedRecord) => {
            // Update local state
            setAllDepartmentsData(prev => 
              prev.map(r => 
                r.departmentId === updatedRecord.departmentId && 
                r.month === updatedRecord.month && 
                r.fiscalYear === updatedRecord.fiscalYear
                  ? updatedRecord
                  : r
              )
            );
            // Refresh data
            loadAllDepartmentsData();
          }}
        />
      </div>
    );
  }

  /* ------------------------------- UI: Login ------------------------------- */

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-800 via-purple-600 to-indigo-400 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="relative bg-white/90 backdrop-blur rounded-3xl shadow-2xl overflow-visible">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-3xl shadow-lg">
              🏥
            </div>
            <div className="pt-14 px-8 pb-8 space-y-6">
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold text-slate-800">ระบบบันทึกข้อมูล QA</h1>
                <p className="text-sm text-slate-500">โรงพยาบาลหนองบัวลำภู</p>
              </div>

              <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1 text-sm font-medium">
                <button
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                    role === "user"
                      ? "bg-purple-600 text-white shadow"
                      : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setRole("user");
                    setPassword("");
                  }}
                >
                  <span>👤</span>
                  ผู้ใช้งาน
                </button>
                <button
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                    role === "admin"
                      ? "bg-purple-600 text-white shadow"
                      : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setRole("admin");
                    setSelectedDeptId("");
                    setPassword("");
                  }}
                >
                  <span>🛡️</span>
                  ผู้ดูแลระบบ
                </button>
              </div>

              {alert && (
                <div
                  className={`border-l-4 p-3 rounded text-xs ${
                    alert.type === "success"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : alert.type === "warning"
                      ? "bg-amber-50 border-amber-500 text-amber-800"
                      : "bg-rose-50 border-rose-500 text-rose-800"
                  }`}
                >
                  {alert.message}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleLogin}>
                {role === "user" && (
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <span>🏥</span>
                      เลือกแผนก
                    </label>
                    <select
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={selectedDeptId}
                      onChange={e => setSelectedDeptId(e.target.value)}
                    >
                      <option value="">-- เลือกแผนก --</option>
                      {DEPARTMENTS.filter(d => d.id !== "ADMIN").map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <span>🔒</span>
                    รหัสผ่าน {role === "admin" ? "(Admin)" : ""}
                  </label>
                  <input
                    type="password"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={role === "admin" ? "admin@nbl2568" : "รหัสผ่านแผนก"}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition flex items-center justify-center gap-2"
                >
                  <span>➜</span>
                  เข้าสู่ระบบ
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ UI: Main Page ----------------------------- */

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-500 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              📊
            </div>
            <div>
              <h1 className="text-base md:text-lg font-semibold leading-tight">ระบบบันทึกข้อมูล QA</h1>
              <p className="text-[11px] md:text-xs text-indigo-100">โรงพยาบาลหนองบัวลำภู</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <div className="opacity-80">{role === "admin" ? "ผู้ดูแลระบบ" : "แผนก"}</div>
              <div className="font-semibold">
                {role === "admin" ? "Admin" : currentDept?.name}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-[11px] font-medium"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
        <nav className="bg-white text-slate-700 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 flex gap-6 text-sm font-semibold">
            {role === "user" ? (
              <>
                <button
                  className={`relative py-3 transition ${
                    activeTab === "form"
                      ? "text-purple-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  onClick={() => setActiveTab("form")}
                >
                  บันทึกข้อมูล
                  {activeTab === "form" && <span className="absolute inset-x-0 -bottom-px h-1 bg-purple-500 rounded-full" />}
                </button>
                <button
                  className={`relative py-3 transition ${
                    activeTab === "table"
                      ? "text-purple-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  onClick={() => setActiveTab("table")}
                >
                  ตารางแสดงข้อมูล
                  {activeTab === "table" && <span className="absolute inset-x-0 -bottom-px h-1 bg-purple-500 rounded-full" />}
                </button>
              </>
            ) : (
              <button
                className="relative py-3 text-purple-600"
                onClick={() => setActiveTab("admin")}
              >
                Dashboard
                <span className="absolute inset-x-0 -bottom-px h-1 bg-purple-500 rounded-full" />
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 space-y-5 w-full">
        {role === "admin" ? (
          <div className="space-y-4">
            <section className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Admin Dashboard</h2>
                  <p className="text-sm text-slate-500">ภาพรวมข้อมูล QA ทั้งหมด</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={adminSelectedYear}
                    onChange={e => {
                      setAdminSelectedYear(e.target.value);
                      loadAllDepartmentsData();
                    }}
                  >
                    {FISCAL_YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <button
                    onClick={loadAllDepartmentsData}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                  >
                    🔄 รีเฟรช
                  </button>
                </div>
              </div>
            </section>

            {renderAdminDashboard()}
          </div>
        ) : activeTab === "table" ? (
          <div className="space-y-4">
            <section className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">ตารางแสดงข้อมูลรายเดือน</h2>
                  <p className="text-xs text-slate-500">เลือกปีงบประมาณและเดือนเพื่อดูข้อมูลที่บันทึกไว้</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  ข้อมูลจะโหลดจากการบันทึกจริง
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">ปีงบประมาณ (พ.ศ.)</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={fiscalYear}
                    onChange={e => setFiscalYear(e.target.value)}
                  >
                    {FISCAL_YEARS.map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">เดือน</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                  >
                    {MONTHS_TH.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2">
                  <button
                    type="button"
                    onClick={handleLoadTableRecord}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 text-white text-sm font-semibold shadow hover:shadow-md"
                  >
                    📄 โหลดข้อมูลแสดงผล
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadYear}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                  >
                    🔄 อัปเดต
                  </button>
                </div>
              </div>
              {loading && <p className="text-[11px] text-slate-500">กำลังดำเนินการ...</p>}
            </section>

            {/* Dashboard Analytics Section */}
            <section className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    📊
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">Dashboard Analytics</h3>
                    <p className="text-xs text-slate-500">
                      วิเคราะห์ข้อมูลเชิงลึกด้วยกราฟและแผนภูมิ
                    </p>
                  </div>
                </div>
                <select
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={dashboardMonth}
                  onChange={(e) => setDashboardMonth(e.target.value)}
                >
                  <option value="ทั้งปี">ดูภาพรวมทั้งปี</option>
                  {MONTHS_TH.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              
              {yearRecords.length > 0 ? (
                <DashboardAnalytics 
                  data={generateDashboardData(yearRecords, dashboardMonth)} 
                  isAdmin={false}
                  selectedMonth={dashboardMonth}
                />
              ) : (
                <div className="text-center py-10 text-sm text-slate-500">
                  ยังไม่มีข้อมูลสำหรับแสดง Dashboard
                </div>
              )}
            </section>

            {/* Year Status Section */}
            <section className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">ตรวจสอบความครบถ้วนของข้อมูล</h3>
                  <p className="text-[11px] text-slate-500">ปีงบประมาณ {fiscalYear}</p>
                </div>
                <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                  บันทึกแล้ว {yearRecords.length} / 12 เดือน
                </div>
              </div>

              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
                  style={{ width: `${(yearRecords.length / 12) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                  <p className="font-semibold text-emerald-800">เดือนที่มีข้อมูลครบ</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {MONTHS_TH.filter(m => yearData[m]).map(m => (
                      <span key={m} className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[12px]">{m}</span>
                    ))}
                    {!MONTHS_TH.some(m => yearData[m]) && (
                      <span className="text-[12px] text-emerald-800">ยังไม่มีข้อมูล</span>
                    )}
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="font-semibold text-amber-800">เดือนที่ยังไม่ได้บันทึก</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {missingMonths.length ? (
                      missingMonths.map(m => (
                        <span key={m} className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-[12px]">{m}</span>
                      ))
                    ) : (
                      <span className="text-[12px] text-emerald-700">ครบถ้วนทุกเดือนแล้ว</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Table Record Display */}
            {tableRecord ? (
              <section className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">
                      ข้อมูลเดือน {tableRecord.month} ปีงบประมาณ {tableRecord.fiscalYear}
                    </h3>
                    <p className="text-xs text-slate-500">
                      อัปเดตล่าสุด: {new Date(tableRecord.updatedAt).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleEditFromTable}
                      className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 text-sm font-semibold border border-amber-200 hover:bg-amber-200"
                    >
                      ✏️ แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteRecord}
                      className="px-4 py-2 rounded-lg bg-rose-50 text-rose-700 text-sm font-semibold border border-rose-200 hover:bg-rose-100"
                    >
                      🗑️ ลบข้อมูล
                    </button>
                  </div>
                </div>
                {renderRecordTable(tableRecord)}
              </section>
            ) : (
              <section className="bg-white rounded-2xl shadow-sm p-6 border border-dashed border-slate-200 text-center text-sm text-slate-500">
                ยังไม่มีข้อมูลให้แสดง กรุณาเลือกปี/เดือน แล้วกด "โหลดข้อมูลแสดงผล"
              </section>
            )}

            {/* Analytics Dashboard */}
            <section className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">📊</div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">สรุปตัวชี้วัด</h3>
                  <p className="text-xs text-slate-500">สรุปตัวชี้วัดสำคัญจากข้อมูลที่บันทึกในปีงบประมาณ {fiscalYear}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-indigo-50 text-indigo-700 rounded-xl p-4 border border-indigo-100">
                  <p className="text-xs font-semibold">จำนวนเดือนที่มีข้อมูล</p>
                  <div className="text-2xl font-bold">{analytics.monthsFilled} / 12</div>
                  <p className="text-[11px] text-indigo-600">อัปเดตจากการบันทึก</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs font-semibold">Average Productivity</p>
                  <div className="text-2xl font-bold">{analytics.averageProductivity}</div>
                  <p className="text-[11px] text-emerald-600">เป้าหมาย ≥ 80%</p>
                </div>
                <div className="bg-sky-50 text-sky-700 rounded-xl p-4 border border-sky-100">
                  <p className="text-xs font-semibold">LOS เฉลี่ย (วัน)</p>
                  <div className="text-2xl font-bold">{analytics.averageLOS}</div>
                  <p className="text-[11px] text-sky-600">ระยะวันนอนเฉลี่ย</p>
                </div>
                <div className="bg-amber-50 text-amber-700 rounded-xl p-4 border border-amber-100">
                  <p className="text-xs font-semibold">ความสำเร็จ CPR (ครั้ง)</p>
                  <div className="text-2xl font-bold">{analytics.totalCPRSuccess}</div>
                  <p className="text-[11px] text-amber-600">รวมทุกเดือนที่มีข้อมูล</p>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <>
            <section className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">📅</div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">เลือกปีงบประมาณและเดือน</h2>
                  <p className="text-xs text-slate-500">ปรับช่วงเวลาที่ต้องการบันทึกข้อมูลแล้วกด "โหลดข้อมูล"</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">ปีงบประมาณ (พ.ศ.)</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={fiscalYear}
                    onChange={e => setFiscalYear(e.target.value)}
                  >
                    {FISCAL_YEARS.map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">เดือน</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                  >
                    {MONTHS_TH.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2">
                  <button
                    type="button"
                    onClick={handleLoadPeriod}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 text-white text-sm font-semibold shadow hover:shadow-md"
                  >
                    <span>🔍</span> โหลดข้อมูล
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadYear}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                  >
                    🔄 อัปเดต
                  </button>
                </div>
              </div>
              {loading && <p className="text-[11px] text-slate-500 mt-2">กำลังดำเนินการ...</p>}
            </section>

            {alert && (
              <div
                className={`border-l-4 p-3 rounded text-xs md:text-sm ${
                  alert.type === "success"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                    : alert.type === "warning"
                    ? "bg-amber-50 border-amber-500 text-amber-800"
                    : "bg-rose-50 border-rose-500 text-rose-800"
                }`}
              >
                {alert.message}
              </div>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <form
                onSubmit={handleSave}
                className="lg:col-span-3 space-y-4"
              >
                {sectionConfig.map(section => (
                  <div
                    key={section.key}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                          {section.icon}
                        </span>
                        <h3 className="text-sm md:text-base font-semibold text-slate-800">{section.title}</h3>
                      </div>
                    </div>

                    {section.highlight && (
                      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white rounded-xl p-4 shadow-inner">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide opacity-90">Productivity</p>
                            <div className="text-2xl font-bold">{fields.productivityValue || "0.00%"}</div>
                            <p className="text-sm text-emerald-50">เกณฑ์คือ ≥80%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wide opacity-90">Actual HPPD</p>
                            <div className="text-2xl font-bold">{fields.actualHPPD || "0.00"}</div>
                            <p className="text-sm text-emerald-50">ชั่วโมงต่อวัน</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.fields.map(fid => renderFieldInput(fid))}
                    </div>
                  </div>
                ))}

                {/* Note Field */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      📝
                    </span>
                    <h3 className="text-sm md:text-base font-semibold text-slate-800">หมายเหตุเพิ่มเติม</h3>
                  </div>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    value={fields.note ?? ""}
                    onChange={e => handleFieldChange("note", e.target.value)}
                    placeholder="บันทึกหมายเหตุเพิ่มเติม (ถ้ามี)"
                  />
                </div>

                <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <p className="text-xs text-slate-600">💡 ข้อมูลที่คำนวณอัตโนมัติจะอัปเดตทันทีเมื่อกรอกข้อมูลต้นทาง</p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition disabled:opacity-50"
                  >
                    💾 บันทึกข้อมูล
                  </button>
                </div>
              </form>

              {/* Sidebar */}
              <div className="space-y-3">
                {/* Year Status Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <h4 className="text-sm font-semibold text-slate-800">สถานะรายปี</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {MONTHS_TH.map(m => {
                      const hasData = yearData[m] !== undefined;
                      return (
                        <div
                          key={m}
                          className={`text-center p-2 rounded-lg text-[10px] font-medium transition-all ${
                            hasData
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-50 text-slate-400"
                          }`}
                          title={hasData ? `บันทึกแล้ว: ${m}` : `ยังไม่บันทึก: ${m}`}
                        >
                          {m.slice(0, 3)}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-[11px] text-slate-500">
                    ครบ {yearRecords.length} / 12 เดือน
                  </div>
                </div>

                {/* Missing Months Alert */}
                {missingMonths.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      <h4 className="text-[11px] font-semibold text-amber-800">เดือนที่รอบันทึก</h4>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {missingMonths.map(m => (
                        <span key={m} className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Analytics */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    <h4 className="text-sm font-semibold text-slate-800">สรุปตัวชี้วัด</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600">Avg. Productivity</span>
                      <span className="font-semibold text-indigo-700">{analytics.averageProductivity}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600">Avg. LOS</span>
                      <span className="font-semibold text-emerald-700">{analytics.averageLOS} วัน</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600">CPR Success</span>
                      <span className="font-semibold text-amber-700">{analytics.totalCPRSuccess} ครั้ง</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600">Avg. Pressure Ulcer</span>
                      <span className="font-semibold text-rose-700">{analytics.pressureUlcerRateAvg}</span>
                    </div>
                  </div>
                </div>

                {/* ICU Special Note */}
                {currentDept?.isIcu && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏥</span>
                      <h4 className="text-[11px] font-semibold text-blue-800">ข้อมูลเฉพาะ ICU</h4>
                    </div>
                    <div className="text-[10px] text-blue-700 space-y-1">
                      {currentDept.icuType === "NICU" ? (
                        <>
                          <p>• มีข้อ 9: ย้าย ผป.กลับเข้า ICU</p>
                          <p>• ไม่มีข้อ 10: Unplan ICU</p>
                        </>
                      ) : currentDept.icuType === "ICU_รวม" ? (
                        <>
                          <p>• มีข้อ 9: ย้าย ผป.กลับเข้า ICU</p>
                          <p>• มีข้อ 10: Unplan ICU (10 ฟิลด์)</p>
                        </>
                      ) : (
                        <>
                          <p>• มีข้อ 9: ย้าย ผป.กลับเข้า ICU</p>
                          <p>• มีข้อ 10: Unplan ICU (ชาย/หญิง)</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Help */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    <h4 className="text-sm font-semibold text-slate-800">คำแนะนำ</h4>
                  </div>
                  <ul className="text-[10px] text-slate-600 space-y-1">
                    <li>• ข้อมูลจะบันทึกอัตโนมัติในระบบ</li>
                    <li>• ฟิลด์สีน้ำเงินคำนวณอัตโนมัติ</li>
                    <li>• ตรวจสอบข้อมูลก่อนบันทึก</li>
                    <li>• สามารถแก้ไขได้ทุกเมื่อ</li>
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-3 text-center text-xs text-slate-500">
          <p>© 2568 ระบบบันทึกข้อมูล QA โรงพยาบาลหนองบัวลำภู - Developed by ปริญญา แก้วสุโพธิ์ พยาบาลวิชาชีพชำนาญการ Next.js</p>
        </div>
      </footer>
    </div>
  );
}

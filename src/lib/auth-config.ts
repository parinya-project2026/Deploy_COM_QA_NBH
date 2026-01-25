
export const CREDENTIALS: Record<string, string> = {
    // --- โซนผู้ป่วยใน (IPD) ---
    "DEPT001": "medmen",     // หอผู้ป่วยอายุรกรรมชาย
    "DEPT002": "medfem",     // หอผู้ป่วยอายุรกรรมหญิง
    "DEPT003": "psyche",     // หอผู้ป่วยจิตเวช
    "DEPT004": "vipone",     // หอผู้ป่วยพิเศษรวมน้ำใจ
    "DEPT005": "surgmn",     // หอผู้ป่วยศัลยกรรมชาย
    "DEPT006": "surgfm",     // หอผู้ป่วยศัลยกรรมหญิง

    // --- โซนวิกฤต (ICU) ---
    "DEPT007": "icum22",     // ICU-MED_1
    "DEPT008": "icum33",     // ICU-MED_2

    // --- โซนเฉพาะทาง ---
    "DEPT009": "ortho2",     // กระดูกและข้อ
    "DEPT010": "vipmed",     // พิเศษอายุรกรรมชั้น4
    "DEPT011": "vipsur",     // พิเศษศัลยกรรมชั้น4
    "DEPT012": "peds22",     // กุมารเวช
    "DEPT013": "monk22",     // อภิบาลสงฆ์
    "DEPT014": "ent222",     // โสต ศอ นาสิก
    "DEPT015": "vipob5",     // พิเศษสูติ-นรีเวช ชั้น5
    "DEPT016": "vipob4",     // พิเศษสูติ-นรีเวช ชั้น4
    "DEPT017": "vipped",     // พิเศษกุมารเวช
    "DEPT018": "neur22",     // ศัลยกรรมระบบประสาทและสมอง

    // --- ICU เด็กและรวม ---
    "DEPT019": "nicu22",     // NICU
    "DEPT020": "ppro22",     // สูติ-นรีเวช (PP)
    "DEPT021": "icual2",     // ICU_รวม

    // --- หน่วยงานพิเศษ (Special Units) ---
    "SPECIAL001": "orrom2",  // ห้องผ่าตัด (OR)
    "SPECIAL002": "eroom2",  // ห้องอุบัติเหตุ ฉุกเฉิน (ER)
    "SPECIAL003": "anest2",  // วิสัญญีพยาบาล (Anesth)
    "SPECIAL004": "lrrom2",  // ห้องคลอด (LR)

    // --- แผนกผู้ป่วยนอก (OPD) - รหัสผ่าน 6 ตัวอักษร ---
    "OPD_GP": "opdgp2",      // OPD GP - ตรวจโรคทั่วไป
    "OPD_PED": "opdped",     // OPD Pediatrics - กุมารเวช (เด็ก)
    "OPD_ANC": "opdanc",     // OPD ANC - ฝากครรภ์
    "OPD_DMHT": "opddm2",    // OPD DM/HT - เบาหวาน/ความดัน
    "OPD_HEART": "opdhr2",   // OPD Heart - หัวใจและหลอดเลือด
    "OPD_ASTHMA": "opdas2",  // OPD Asthma - หอบหืด/ปอด
    "OPD_CKD": "opdck2",     // OPD CKD/CAPD - โรคไต/ล้างไต
    "OPD_NEURO": "opdne2",   // OPD Neuro - อายุรกรรมประสาท
    "OPD_HIV": "opdhv2",     // OPD HIV - คลินิกพิเศษ (NAP)
    "OPD_TB": "opdtb2",      // OPD TB/COC - วัณโรค/ต่อเนื่อง
    "OPD_SURG": "opdsu2",    // OPD Surgery - ศัลยกรรมทั่วไป
    "OPD_ORTHO": "opdor2",   // OPD Orthopedic - กระดูกและข้อ
    "OPD_URO": "opdur2",     // OPD Uro - ศัลยกรรมทางเดินปัสสาวะ
    "OPD_EYE": "opdey2",     // OPD Eye - จักษุ (ตา)
    "OPD_ENT": "opden2",     // OPD ENT - หู คอ จมูก
    "OPD_AFTERHOUR": "opdah2",  // OPD คลินิกรักษาทั่วไป (นอกเวลา)
    "OPD_ELDER": "opdel2",   // OPD คลินิกผู้สูงอายุ

    // --- Admin ---
    "ADMIN": "admin2"
};


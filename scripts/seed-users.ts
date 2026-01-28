/**
 * Seed Users Script
 * สร้าง users พร้อม hashed passwords จาก CREDENTIALS เดิม
 * 
 * วิธีใช้: npx ts-node scripts/seed-users.ts
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Configuration for password hashing (same as password-utils.ts)
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const ITERATIONS = 100000;
const DIGEST = 'sha512';

// Hash password function (inline to avoid import issues)
function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
        crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
            if (err) reject(err);
            else resolve(`${ITERATIONS}:${salt}:${derivedKey.toString('hex')}`);
        });
    });
}

// User data with default passwords (CHANGE THESE IN PRODUCTION!)
const USERS_DATA = [
    // --- โซนผู้ป่วยใน (IPD) ---
    { departmentId: "DEPT001", departmentName: "หอผู้ป่วยอายุรกรรมชาย", password: "MedMen@2024", role: "user" },
    { departmentId: "DEPT002", departmentName: "หอผู้ป่วยอายุรกรรมหญิง", password: "MedFem@2024", role: "user" },
    { departmentId: "DEPT003", departmentName: "หอผู้ป่วยจิตเวช", password: "Psyche@2024", role: "user" },
    { departmentId: "DEPT004", departmentName: "หอผู้ป่วยพิเศษรวมน้ำใจ", password: "VipOne@2024", role: "user" },
    { departmentId: "DEPT005", departmentName: "หอผู้ป่วยศัลยกรรมชาย", password: "SurgMn@2024", role: "user" },
    { departmentId: "DEPT006", departmentName: "หอผู้ป่วยศัลยกรรมหญิง", password: "SurgFm@2024", role: "user" },
    
    // --- โซนวิกฤต (ICU) ---
    { departmentId: "DEPT007", departmentName: "หอผู้ป่วยหนักอายุรกรรมชั้น 1(ICU-MED_1)", password: "IcuM1@2024", role: "user" },
    { departmentId: "DEPT008", departmentName: "หอผู้ป่วยหนักอายุรกรรมชั้น 2(ICU-MED_2)", password: "IcuM2@2024", role: "user" },
    
    // --- โซนเฉพาะทาง ---
    { departmentId: "DEPT009", departmentName: "หอผู้ป่วยกระดูกและข้อ", password: "Ortho@2024", role: "user" },
    { departmentId: "DEPT010", departmentName: "หอผู้ป่วยพิเศษอายุรกรรมชั้น4", password: "VipMed@2024", role: "user" },
    { departmentId: "DEPT011", departmentName: "หอผู้ป่วยพิเศษศัลยกรรมชั้น4", password: "VipSur@2024", role: "user" },
    { departmentId: "DEPT012", departmentName: "หอผู้ป่วยกุมารเวช", password: "Peds22@2024", role: "user" },
    { departmentId: "DEPT013", departmentName: "หอผู้ป่วยอภิบาลสงฆ์", password: "Monk22@2024", role: "user" },
    { departmentId: "DEPT014", departmentName: "หอผู้ป่วยโสต ศอ นาสิก", password: "Ent222@2024", role: "user" },
    { departmentId: "DEPT015", departmentName: "หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น5", password: "VipOb5@2024", role: "user" },
    { departmentId: "DEPT016", departmentName: "หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น4", password: "VipOb4@2024", role: "user" },
    { departmentId: "DEPT017", departmentName: "หอผู้ป่วยพิเศษกุมารเวช", password: "VipPed@2024", role: "user" },
    { departmentId: "DEPT018", departmentName: "หอผู้ป่วยศัลยกรรมระบบประสาทและสมอง", password: "Neur22@2024", role: "user" },
    
    // --- ICU เด็กและรวม ---
    { departmentId: "DEPT019", departmentName: "หอผู้ป่วยหนักกุมารเวช(NICU)", password: "Nicu22@2024", role: "user" },
    { departmentId: "DEPT020", departmentName: "หอผู้ป่วยสูติ-นรีเวช (PP)", password: "Ppro22@2024", role: "user" },
    { departmentId: "DEPT021", departmentName: "หอผู้ป่วยหนักรวม(ICU_รวม)", password: "IcuAll@2024", role: "user" },
    
    // --- หน่วยงานพิเศษ (Special Units) ---
    { departmentId: "SPECIAL001", departmentName: "ห้องผ่าตัด (OR)", password: "OrRoom@2024", role: "special_unit" },
    { departmentId: "SPECIAL002", departmentName: "ห้องอุบัติเหตุ ฉุกเฉิน (ER)", password: "ErRoom@2024", role: "special_unit" },
    { departmentId: "SPECIAL003", departmentName: "วิสัญญีพยาบาล (Anesth)", password: "Anest2@2024", role: "special_unit" },
    { departmentId: "SPECIAL004", departmentName: "ห้องคลอด (LR)", password: "LrRoom@2024", role: "special_unit" },
    
    // --- แผนกผู้ป่วยนอก (OPD) ---
    { departmentId: "OPD_GP", departmentName: "OPD GP - ตรวจโรคทั่วไป", password: "OpdGp2@2024", role: "opd" },
    { departmentId: "OPD_PED", departmentName: "OPD Pediatrics - กุมารเวช (เด็ก)", password: "OpdPed@2024", role: "opd" },
    { departmentId: "OPD_ANC", departmentName: "OPD ANC - ฝากครรภ์", password: "OpdAnc@2024", role: "opd" },
    { departmentId: "OPD_DMHT", departmentName: "OPD DM/HT - เบาหวาน/ความดัน", password: "OpdDm2@2024", role: "opd" },
    { departmentId: "OPD_HEART", departmentName: "OPD Heart - หัวใจและหลอดเลือด", password: "OpdHr2@2024", role: "opd" },
    { departmentId: "OPD_ASTHMA", departmentName: "OPD Asthma - หอบหืด/ปอด", password: "OpdAs2@2024", role: "opd" },
    { departmentId: "OPD_CKD", departmentName: "OPD CKD/CAPD - โรคไต/ล้างไต", password: "OpdCk2@2024", role: "opd" },
    { departmentId: "OPD_NEURO", departmentName: "OPD Neuro - อายุรกรรมประสาท", password: "OpdNe2@2024", role: "opd" },
    { departmentId: "OPD_HIV", departmentName: "OPD HIV - คลินิกพิเศษ (NAP)", password: "OpdHv2@2024", role: "opd" },
    { departmentId: "OPD_TB", departmentName: "OPD TB/COC - วัณโรค/ต่อเนื่อง", password: "OpdTb2@2024", role: "opd" },
    { departmentId: "OPD_SURG", departmentName: "OPD Surgery - ศัลยกรรมทั่วไป", password: "OpdSu2@2024", role: "opd" },
    { departmentId: "OPD_ORTHO", departmentName: "OPD Orthopedic - กระดูกและข้อ", password: "OpdOr2@2024", role: "opd" },
    { departmentId: "OPD_URO", departmentName: "OPD Uro - ศัลยกรรมทางเดินปัสสาวะ", password: "OpdUr2@2024", role: "opd" },
    { departmentId: "OPD_EYE", departmentName: "OPD Eye - จักษุ (ตา)", password: "OpdEy2@2024", role: "opd" },
    { departmentId: "OPD_ENT", departmentName: "OPD ENT - หู คอ จมูก", password: "OpdEn2@2024", role: "opd" },
    { departmentId: "OPD_AFTERHOUR", departmentName: "OPD คลินิกรักษาทั่วไป (นอกเวลา)", password: "OpdAh2@2024", role: "opd" },
    { departmentId: "OPD_ELDER", departmentName: "OPD คลินิกผู้สูงอายุ", password: "OpdEl2@2024", role: "opd" },
    
    // --- Admin ---
    { departmentId: "ADMIN", departmentName: "ผู้ดูแลระบบ", password: "Admin@NBH2024!", role: "admin" }
];

async function seedUsers() {
    console.log('🔐 Starting user seed...\n');
    
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    for (const userData of USERS_DATA) {
        try {
            const hashedPassword = await hashPassword(userData.password);
            
            const existingUser = await prisma.user.findUnique({
                where: { departmentId: userData.departmentId }
            });
            
            if (existingUser) {
                await prisma.user.update({
                    where: { departmentId: userData.departmentId },
                    data: {
                        departmentName: userData.departmentName,
                        passwordHash: hashedPassword,
                        role: userData.role
                    }
                });
                updated++;
                console.log(`✅ Updated: ${userData.departmentId} - ${userData.departmentName}`);
            } else {
                await prisma.user.create({
                    data: {
                        departmentId: userData.departmentId,
                        departmentName: userData.departmentName,
                        passwordHash: hashedPassword,
                        role: userData.role,
                        isActive: true
                    }
                });
                created++;
                console.log(`✅ Created: ${userData.departmentId} - ${userData.departmentName}`);
            }
        } catch (error) {
            errors++;
            console.error(`❌ Error for ${userData.departmentId}:`, error);
        }
    }
    
    console.log('\n========================================');
    console.log(`📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors:  ${errors}`);
    console.log('========================================\n');
    
    // Print password list for distribution
    console.log('📋 รายการรหัสผ่านใหม่ (เก็บไว้แจกจ่ายให้แผนก):\n');
    console.log('| รหัสแผนก | ชื่อแผนก | รหัสผ่านใหม่ |');
    console.log('|----------|----------|-------------|');
    for (const userData of USERS_DATA) {
        console.log(`| ${userData.departmentId} | ${userData.departmentName} | ${userData.password} |`);
    }
}

seedUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

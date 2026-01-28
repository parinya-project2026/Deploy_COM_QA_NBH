/**
 * Reset Passwords Script
 * รหัสผ่าน 6 ตัว ที่ไม่สับสน (หลีกเลี่ยง 0/O, 1/l/I, 5/S, 8/B)
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const ITERATIONS = 100000;
const DIGEST = 'sha512';

function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
        crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
            if (err) reject(err);
            else resolve(`${ITERATIONS}:${salt}:${derivedKey.toString('hex')}`);
        });
    });
}

// รหัสผ่าน 6 ตัว - ง่ายจำ ไม่สับสน
const SIMPLE_PASSWORDS: Record<string, string> = {
    // IPD
    "DEPT001": "med123",
    "DEPT002": "med234",
    "DEPT003": "psy345",
    "DEPT004": "vip456",
    "DEPT005": "sur567",
    "DEPT006": "sur678",
    "DEPT007": "icu789",
    "DEPT008": "icu234",
    "DEPT009": "ort345",
    "DEPT010": "vpm456",
    "DEPT011": "vps567",
    "DEPT012": "ped678",
    "DEPT013": "mnk789",
    "DEPT014": "ent234",
    "DEPT015": "vob345",
    "DEPT016": "vob456",
    "DEPT017": "vpd567",
    "DEPT018": "neu678",
    "DEPT019": "nic789",
    "DEPT020": "ppr234",
    "DEPT021": "ica345",
    
    // Special Units
    "SPECIAL001": "or1234",
    "SPECIAL002": "er2345",
    "SPECIAL003": "an3456",
    "SPECIAL004": "lr4567",
    
    // OPD
    "OPD_GP": "gp1234",
    "OPD_PED": "pd2345",
    "OPD_ANC": "an3456",
    "OPD_DMHT": "dm4567",
    "OPD_HEART": "hr5678",
    "OPD_ASTHMA": "as6789",
    "OPD_CKD": "ck7234",
    "OPD_NEURO": "ne2345",
    "OPD_HIV": "hv3456",
    "OPD_TB": "tb4567",
    "OPD_SURG": "sg5678",
    "OPD_ORTHO": "ot6789",
    "OPD_URO": "ur7234",
    "OPD_EYE": "ey2345",
    "OPD_ENT": "et3456",
    "OPD_AFTERHOUR": "ah4567",
    "OPD_ELDER": "ed5678",
    
    // Admin
    "ADMIN": "adm999"
};

async function resetPasswords() {
    console.log('🔐 Resetting passwords to simple 6-char format...\n');
    
    let updated = 0;
    let errors = 0;
    
    for (const [deptId, password] of Object.entries(SIMPLE_PASSWORDS)) {
        try {
            const hashedPassword = await hashPassword(password);
            
            await prisma.user.update({
                where: { departmentId: deptId },
                data: { passwordHash: hashedPassword }
            });
            
            updated++;
            console.log(`✅ ${deptId}: ${password}`);
        } catch (error) {
            errors++;
            console.error(`❌ ${deptId}: Error - ${error}`);
        }
    }
    
    console.log('\n========================================');
    console.log(`📊 Summary: Updated ${updated}, Errors ${errors}`);
    console.log('========================================\n');
    
    console.log('📋 รายการรหัสผ่านใหม่ (6 ตัว):\n');
    console.log('| รหัสแผนก | รหัสผ่าน |');
    console.log('|----------|----------|');
    for (const [deptId, password] of Object.entries(SIMPLE_PASSWORDS)) {
        console.log(`| ${deptId} | ${password} |`);
    }
}

resetPasswords()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

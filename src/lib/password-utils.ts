/**
 * Password Security Utilities
 * ใช้ bcrypt-like hashing ด้วย Node.js crypto (ไม่ต้องติดตั้ง dependency เพิ่ม)
 */

import crypto from 'crypto';

// Configuration
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const ITERATIONS = 100000; // Higher = more secure but slower
const DIGEST = 'sha512';

/**
 * Hash password ด้วย PBKDF2
 * @param password รหัสผ่านที่ต้องการ hash
 * @returns Promise<string> - hashed password ในรูปแบบ iterations:salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
        
        crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(`${ITERATIONS}:${salt}:${derivedKey.toString('hex')}`);
        });
    });
}

/**
 * ตรวจสอบ password กับ hash
 * @param password รหัสผ่านที่ต้องการตรวจสอบ
 * @param storedHash hash ที่เก็บไว้ใน database
 * @returns Promise<boolean> - true ถ้า password ถูกต้อง
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            const [iterations, salt, hash] = storedHash.split(':');
            const iterCount = parseInt(iterations, 10);
            
            if (!iterCount || !salt || !hash) {
                resolve(false);
                return;
            }
            
            crypto.pbkdf2(password, salt, iterCount, KEY_LENGTH, DIGEST, (err, derivedKey) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Timing-safe comparison to prevent timing attacks
                const hashBuffer = Buffer.from(hash, 'hex');
                const derivedBuffer = derivedKey;
                
                if (hashBuffer.length !== derivedBuffer.length) {
                    resolve(false);
                    return;
                }
                
                resolve(crypto.timingSafeEqual(hashBuffer, derivedBuffer));
            });
        } catch (error) {
            resolve(false);
        }
    });
}

/**
 * ตรวจสอบความแข็งแรงของ password
 * @param password รหัสผ่านที่ต้องการตรวจสอบ
 * @returns object - { isStrong: boolean, errors: string[] }
 */
export function validatePasswordStrength(password: string): { isStrong: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
        errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('ต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('ต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('ต้องมีตัวเลขอย่างน้อย 1 ตัว');
    }
    
    return {
        isStrong: errors.length === 0,
        errors
    };
}

/**
 * สร้างรหัสผ่านแบบสุ่มที่แข็งแรง
 * @param length ความยาวรหัสผ่าน (default: 12)
 * @returns string - รหัสผ่านที่สร้างขึ้น
 */
export function generateSecurePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    
    const allChars = uppercase + lowercase + numbers + special;
    
    // Ensure at least one of each type
    let password = '';
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += special[crypto.randomInt(special.length)];
    
    // Fill the rest
    for (let i = password.length; i < length; i++) {
        password += allChars[crypto.randomInt(allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

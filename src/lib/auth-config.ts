/**
 * @deprecated This file is for backward compatibility only.
 * Use database authentication instead.
 * รหัสผ่านนี้จะถูกลบในเวอร์ชันถัดไป
 * 
 * ⚠️ WARNING: Do not commit real passwords to version control!
 * Run 'npx ts-node scripts/seed-users.ts' to migrate to secure database auth.
 */

// Legacy credentials - WILL BE REMOVED
// These are kept temporarily for backward compatibility during migration
export const CREDENTIALS: Record<string, string> = {
    // ไฟล์นี้เก็บไว้เพื่อ backward compatibility เท่านั้น
    // รหัสผ่านจริงถูกย้ายไป database แล้ว (hashed)
    // หลังจาก migrate เสร็จ ให้ลบไฟล์นี้ออก
    
    // Placeholder - ไม่ใช่รหัสผ่านจริง
    "_PLACEHOLDER": "do_not_use"
};


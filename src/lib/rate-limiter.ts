/**
 * Rate Limiter for Login Protection
 * ป้องกัน Brute Force Attack
 */

import { prisma } from './prisma';

// Configuration
const MAX_ATTEMPTS = 5;           // จำนวนครั้งที่อนุญาตให้ผิดพลาด
const LOCKOUT_DURATION = 15;      // ล็อค 15 นาที
const ATTEMPT_WINDOW = 15;        // นับ attempts ใน 15 นาที

interface RateLimitResult {
    allowed: boolean;
    remainingAttempts: number;
    lockoutMinutes?: number;
    message?: string;
}

/**
 * ตรวจสอบว่า IP หรือ departmentId ถูกล็อคหรือไม่
 */
export async function checkRateLimit(
    departmentId: string,
    ipAddress: string
): Promise<RateLimitResult> {
    const windowStart = new Date(Date.now() - ATTEMPT_WINDOW * 60 * 1000);
    
    try {
        // นับจำนวน failed attempts ใน window
        const failedAttempts = await prisma.loginAttempt.count({
            where: {
                OR: [
                    { departmentId },
                    { ipAddress }
                ],
                success: false,
                createdAt: { gte: windowStart }
            }
        });
        
        if (failedAttempts >= MAX_ATTEMPTS) {
            // หา attempt ล่าสุดเพื่อคำนวณเวลาที่เหลือ
            const lastAttempt = await prisma.loginAttempt.findFirst({
                where: {
                    OR: [
                        { departmentId },
                        { ipAddress }
                    ],
                    success: false,
                    createdAt: { gte: windowStart }
                },
                orderBy: { createdAt: 'desc' }
            });
            
            if (lastAttempt) {
                const lockoutEnd = new Date(lastAttempt.createdAt.getTime() + LOCKOUT_DURATION * 60 * 1000);
                const now = new Date();
                
                if (now < lockoutEnd) {
                    const remainingMinutes = Math.ceil((lockoutEnd.getTime() - now.getTime()) / 60000);
                    return {
                        allowed: false,
                        remainingAttempts: 0,
                        lockoutMinutes: remainingMinutes,
                        message: `บัญชีถูกล็อคชั่วคราว กรุณารอ ${remainingMinutes} นาที`
                    };
                }
            }
        }
        
        return {
            allowed: true,
            remainingAttempts: MAX_ATTEMPTS - failedAttempts
        };
    } catch (error) {
        console.error('Rate limit check error:', error);
        // ถ้าเกิด error ให้อนุญาตเข้าสู่ระบบ (fail open)
        return {
            allowed: true,
            remainingAttempts: MAX_ATTEMPTS
        };
    }
}

/**
 * บันทึก login attempt (สำหรับ Audit Log)
 */
export async function recordLoginAttempt(
    departmentId: string,
    ipAddress: string,
    userAgent: string | null,
    success: boolean,
    failReason?: string,
    userId?: string
): Promise<void> {
    try {
        await prisma.loginAttempt.create({
            data: {
                userId: userId || null,
                departmentId,
                ipAddress,
                userAgent: userAgent?.substring(0, 500) || null,
                success,
                failReason: failReason || null
            }
        });
    } catch (error) {
        console.error('Failed to record login attempt:', error);
        // ไม่ throw error เพื่อไม่ให้กระทบ login flow
    }
}

/**
 * ล้าง failed attempts หลัง login สำเร็จ (optional)
 */
export async function clearFailedAttempts(
    departmentId: string,
    ipAddress: string
): Promise<void> {
    const windowStart = new Date(Date.now() - ATTEMPT_WINDOW * 60 * 1000);
    
    try {
        await prisma.loginAttempt.deleteMany({
            where: {
                OR: [
                    { departmentId },
                    { ipAddress }
                ],
                success: false,
                createdAt: { gte: windowStart }
            }
        });
    } catch (error) {
        console.error('Failed to clear attempts:', error);
    }
}

/**
 * ดึงประวัติ login attempts (สำหรับ Admin)
 */
export async function getLoginHistory(
    departmentId?: string,
    limit: number = 50
): Promise<any[]> {
    try {
        return await prisma.loginAttempt.findMany({
            where: departmentId ? { departmentId } : undefined,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        departmentName: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to get login history:', error);
        return [];
    }
}

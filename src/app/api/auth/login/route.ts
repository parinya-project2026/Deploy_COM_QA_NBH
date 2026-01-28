/**
 * Secure Login API
 * - ใช้ hashed password จาก database
 * - Rate limiting ป้องกัน brute force
 * - Audit log บันทึกทุก login attempt
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password-utils";
import { checkRateLimit, recordLoginAttempt } from "@/lib/rate-limiter";

// Fallback to old auth for migration period
import { CREDENTIALS } from "@/lib/auth-config";

// #region agent log helper
const debugLog = (location: string, message: string, data: any, hypothesisId: string) => {
    fetch('http://127.0.0.1:7244/ingest/476b1d69-5728-4e51-890d-1a624a85813b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data,timestamp:Date.now(),sessionId:'debug-session',hypothesisId})}).catch(()=>{});
};
// #endregion

export async function POST(request: Request) {
    // #region agent log
    debugLog('login/route.ts:entry','Login API called',{method:'POST'},'H5');
    // #endregion
    
    try {
        const { departmentId, password } = await request.json();
        
        // #region agent log
        debugLog('login/route.ts:input','Request body parsed',{departmentId,passwordLength:password?.length,passwordPreview:password?.substring(0,3)+'...'},'H5');
        // #endregion
        
        // Validate input
        if (!departmentId || !password) {
            return NextResponse.json(
                { success: false, error: "กรุณาระบุรหัสแผนกและรหัสผ่าน" },
                { status: 400 }
            );
        }
        
        // Get client info for rate limiting and audit
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() 
            || headersList.get('x-real-ip') 
            || 'unknown';
        const userAgent = headersList.get('user-agent') || null;
        
        // Check rate limit
        const rateLimitResult = await checkRateLimit(departmentId, ipAddress);
        
        // #region agent log
        debugLog('login/route.ts:rateLimit','Rate limit check',{allowed:rateLimitResult.allowed,remaining:rateLimitResult.remainingAttempts},'H3');
        // #endregion
        
        if (!rateLimitResult.allowed) {
            await recordLoginAttempt(departmentId, ipAddress, userAgent, false, 'rate_limited');
            return NextResponse.json(
                { 
                    success: false, 
                    error: rateLimitResult.message,
                    lockoutMinutes: rateLimitResult.lockoutMinutes
                },
                { status: 429 }
            );
        }
        
        // Try to find user in database first (new secure method)
        let user = null;
        let isAuthenticated = false;
        let authMethod = 'database';
        
        try {
            user = await prisma.user.findUnique({
                where: { departmentId }
            });
            
            // #region agent log
            debugLog('login/route.ts:userFound','Database user lookup',{found:!!user,isActive:user?.isActive,deptId:user?.departmentId},'H2,H4');
            // #endregion
            
            if (user && user.isActive) {
                // Verify hashed password
                // #region agent log
                debugLog('login/route.ts:verifyStart','Starting password verify',{hashPreview:user.passwordHash?.substring(0,30)},'H1');
                // #endregion
                
                isAuthenticated = await verifyPassword(password, user.passwordHash);
                
                // #region agent log
                debugLog('login/route.ts:verifyResult','Password verification result',{isAuthenticated},'H1');
                // #endregion
            }
        } catch (dbError) {
            // #region agent log
            debugLog('login/route.ts:dbError','Database error',{error:String(dbError)},'H2');
            // #endregion
            console.error('Database auth error:', dbError);
            // Fall through to legacy auth
        }
        
        // Fallback to legacy auth (for migration period)
        if (!isAuthenticated && !user) {
            const legacyPassword = CREDENTIALS[departmentId];
            if (legacyPassword && legacyPassword === password) {
                isAuthenticated = true;
                authMethod = 'legacy';
                console.warn(`[SECURITY WARNING] Legacy auth used for ${departmentId}. Please migrate to database auth.`);
            }
        }
        
        if (isAuthenticated) {
            // Record successful login
            await recordLoginAttempt(
                departmentId, 
                ipAddress, 
                userAgent, 
                true, 
                undefined, 
                user?.id
            );
            
            // Update last login time if user exists
            if (user) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() }
                }).catch(console.error);
            }
            
            return NextResponse.json({ 
                success: true,
                // Don't expose auth method in production
                // authMethod: process.env.NODE_ENV === 'development' ? authMethod : undefined
            });
        } else {
            // Record failed login
            const failReason = user 
                ? 'invalid_password' 
                : CREDENTIALS[departmentId] 
                    ? 'invalid_password' 
                    : 'user_not_found';
                    
            await recordLoginAttempt(
                departmentId, 
                ipAddress, 
                userAgent, 
                false, 
                failReason
            );
            
            // Generic error message (don't reveal if user exists)
            return NextResponse.json(
                { 
                    success: false, 
                    error: "รหัสแผนกหรือรหัสผ่านไม่ถูกต้อง",
                    remainingAttempts: rateLimitResult.remainingAttempts - 1
                },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: "เกิดข้อผิดพลาดในระบบ" },
            { status: 500 }
        );
    }
}

/**
 * Test Login Script
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const ITERATIONS = 100000;
const DIGEST = 'sha512';

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            const [iterations, salt, hash] = storedHash.split(':');
            const iterCount = parseInt(iterations, 10);
            
            if (!iterCount || !salt || !hash) {
                console.log('Invalid hash format');
                resolve(false);
                return;
            }
            
            console.log(`Iterations: ${iterCount}`);
            console.log(`Salt: ${salt}`);
            console.log(`Hash length: ${hash.length}`);
            
            crypto.pbkdf2(password, salt, iterCount, KEY_LENGTH, DIGEST, (err, derivedKey) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const hashBuffer = Buffer.from(hash, 'hex');
                const derivedBuffer = derivedKey;
                
                console.log(`Stored hash buffer length: ${hashBuffer.length}`);
                console.log(`Derived buffer length: ${derivedBuffer.length}`);
                
                if (hashBuffer.length !== derivedBuffer.length) {
                    console.log('Buffer length mismatch!');
                    resolve(false);
                    return;
                }
                
                const match = crypto.timingSafeEqual(hashBuffer, derivedBuffer);
                console.log(`Password match: ${match}`);
                resolve(match);
            });
        } catch (error) {
            console.error('Error:', error);
            resolve(false);
        }
    });
}

async function testLogin() {
    console.log('🔐 Testing login for ADMIN...\n');
    
    const user = await prisma.user.findUnique({
        where: { departmentId: 'ADMIN' }
    });
    
    if (!user) {
        console.log('❌ User not found!');
        return;
    }
    
    console.log(`User found: ${user.departmentId}`);
    console.log(`Password hash: ${user.passwordHash}\n`);
    
    const testPassword = 'Admin@NBH2024!';
    console.log(`Testing password: ${testPassword}\n`);
    
    const result = await verifyPassword(testPassword, user.passwordHash);
    
    if (result) {
        console.log('\n✅ Login SUCCESS!');
    } else {
        console.log('\n❌ Login FAILED!');
    }
}

testLogin()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { UserEntity } from './entities';
import type { Env } from './core-utils';
const JWT_SECRET = 'a-very-secret-key-that-should-be-in-env-vars'; // In a real app, use c.env.JWT_SECRET
const JWT_ALGO = { name: 'HMAC', hash: 'SHA-256' };
async function getCryptoKey(secret: string): Promise<CryptoKey> {
    const secretBuf = new TextEncoder().encode(secret);
    return crypto.subtle.importKey('raw', secretBuf, JWT_ALGO, false, ['sign', 'verify']);
}
export async function signToken(payload: { userId: string }): Promise<string> {
    const key = await getCryptoKey(JWT_SECRET);
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = await crypto.subtle.sign(JWT_ALGO.name, key, new TextEncoder().encode(data));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${data}.${encodedSignature}`;
}
export async function verifyToken(token: string): Promise<{ userId: string } | null> {
    try {
        const key = await getCryptoKey(JWT_SECRET);
        const [header, payload, signature] = token.split('.');
        if (!header || !payload || !signature) return null;
        const data = `${header}.${payload}`;
        const signatureBuf = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify(JWT_ALGO.name, key, signatureBuf, new TextEncoder().encode(data));
        if (!isValid) return null;
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
        return null;
    }
}
export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        key,
        256
    );
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${saltHex}:${hashHex}`;
}
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) return false;
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        key,
        256
    );
    const newHashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    return newHashHex === hashHex;
}
type AuthVariables = {
    user: UserEntity;
};
export const authMiddleware = createMiddleware<{ Bindings: Env, Variables: AuthVariables }>(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HTTPException(401, { message: 'Unauthorized: Missing or invalid token' });
    }
    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload?.userId) {
        throw new HTTPException(401, { message: 'Unauthorized: Invalid token' });
    }
    const user = new UserEntity(c.env, payload.userId);
    if (!(await user.exists())) {
        throw new HTTPException(401, { message: 'Unauthorized: User not found' });
    }
    c.set('user', user);
    await next();
});
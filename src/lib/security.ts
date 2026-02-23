import { prisma } from "@/lib/prisma";

// ═══════════════ TYPES ═══════════════
interface SecuritySettings {
    rateLimitEnabled: boolean;
    rateLimitMax: number;
    bruteForceEnabled: boolean;
    bruteForceMax: number;
    bruteForceBlock: number;
    corsStrictMode: boolean;
    corsAllowedOrigins: string;
    inputSanitization: boolean;
    auditLogExpanded: boolean;
}

// ═══════════════ SETTINGS CACHE (5 daqiqa) ═══════════════
let cachedSettings: SecuritySettings | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 daqiqa

const DEFAULT_SETTINGS: SecuritySettings = {
    rateLimitEnabled: true,
    rateLimitMax: 10,
    bruteForceEnabled: true,
    bruteForceMax: 5,
    bruteForceBlock: 15,
    corsStrictMode: false,
    corsAllowedOrigins: "",
    inputSanitization: true,
    auditLogExpanded: true,
};

export async function getSecuritySettings(): Promise<SecuritySettings> {
    const now = Date.now();
    if (cachedSettings && now - cacheTime < CACHE_TTL) {
        return cachedSettings;
    }

    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: "default" },
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: "default" },
            });
        }

        cachedSettings = settings;
        cacheTime = now;
        return settings;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

// Keshni tozalash (settings o'zgarganda)
export function clearSettingsCache() {
    cachedSettings = null;
    cacheTime = 0;
}

// ═══════════════ RATE LIMITER (in-memory) ═══════════════
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Har 10 daqiqada eski yozuvlarni tozalash
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap) {
        if (now > val.resetTime) rateLimitMap.delete(key);
    }
}, 10 * 60 * 1000);

/**
 * Rate limit tekshirish
 * @returns `null` agar ruxsat berilsa, yoki `{ blocked: true, retryAfter }` agar bloklanmasa
 */
export async function checkRateLimit(ip: string): Promise<{ blocked: boolean; retryAfter: number } | null> {
    const settings = await getSecuritySettings();
    if (!settings.rateLimitEnabled) return null;

    const now = Date.now();
    const windowMs = 60 * 1000; // 1 daqiqa oyna
    const key = `rl:${ip}`;
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return null;
    }

    entry.count++;

    if (entry.count > settings.rateLimitMax) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return { blocked: true, retryAfter };
    }

    return null;
}

// ═══════════════ BRUTE FORCE PROTECTION (in-memory) ═══════════════
const bruteForceMap = new Map<string, { attempts: number; blockedUntil: number }>();

setInterval(() => {
    const now = Date.now();
    for (const [key, val] of bruteForceMap) {
        if (now > val.blockedUntil && val.attempts === 0) bruteForceMap.delete(key);
    }
}, 15 * 60 * 1000);

/**
 * Login urinishni tekshirish
 * @returns `null` agar ruxsat, yoki `{ blocked, remainingMinutes }`
 */
export async function checkBruteForce(ip: string): Promise<{ blocked: boolean; remainingMinutes: number } | null> {
    const settings = await getSecuritySettings();
    if (!settings.bruteForceEnabled) return null;

    const now = Date.now();
    const key = `bf:${ip}`;
    const entry = bruteForceMap.get(key);

    if (!entry) return null;

    if (entry.blockedUntil > now) {
        const remainingMinutes = Math.ceil((entry.blockedUntil - now) / 60000);
        return { blocked: true, remainingMinutes };
    }

    return null;
}

/**
 * Login muvaffaqiyatsiz (counter oshirish)
 */
export async function recordFailedLogin(ip: string) {
    const settings = await getSecuritySettings();
    if (!settings.bruteForceEnabled) return;

    const key = `bf:${ip}`;
    const entry = bruteForceMap.get(key) || { attempts: 0, blockedUntil: 0 };

    entry.attempts++;

    if (entry.attempts >= settings.bruteForceMax) {
        entry.blockedUntil = Date.now() + settings.bruteForceBlock * 60 * 1000;
        entry.attempts = 0; // Reset counter
    }

    bruteForceMap.set(key, entry);
}

/**
 * Muvaffaqiyatli login (counter tozalash)
 */
export function clearBruteForce(ip: string) {
    bruteForceMap.delete(`bf:${ip}`);
}

// ═══════════════ INPUT SANITIZATION ═══════════════
/**
 * XSS va injection himoya — HTML taglarni tozalash
 */
export async function sanitizeInput(str: string): Promise<string> {
    const settings = await getSecuritySettings();
    if (!settings.inputSanitization) return str;

    return str
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;")
        .replace(/\\/g, "&#x5C;")
        .replace(/`/g, "&#96;")
        .trim();
}

// ═══════════════ AUDIT LOG ═══════════════
/**
 * Kengaytirilgan audit log
 */
export async function logAudit(userId: string, action: string, details?: string, ip?: string) {
    const settings = await getSecuritySettings();
    if (!settings.auditLogExpanded) return;

    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                details: details || null,
                ipAddress: ip || null,
            },
        });
    } catch {
        console.error("Audit log xato:", action, details);
    }
}

// ═══════════════ CORS TEKSHIRISH ═══════════════
/**
 * CORS strict mode tekshirish
 * @returns allowed origin yoki "*"
 */
export async function getCorsOrigin(requestOrigin: string | null): Promise<string> {
    const settings = await getSecuritySettings();

    if (!settings.corsStrictMode) return "*";

    if (!requestOrigin) return "";

    const allowedOrigins = settings.corsAllowedOrigins
        .split(",")
        .map(o => o.trim().toLowerCase())
        .filter(Boolean);

    if (allowedOrigins.length === 0) return "*";

    const origin = requestOrigin.toLowerCase();
    // Domain yoki to'liq URL bo'yicha tekshirish
    const isAllowed = allowedOrigins.some(allowed =>
        origin === allowed ||
        origin === `https://${allowed}` ||
        origin === `http://${allowed}` ||
        origin.endsWith(`.${allowed}`)
    );

    return isAllowed ? requestOrigin : "";
}

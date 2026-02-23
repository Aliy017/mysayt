import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewLead } from "@/lib/botHandlers";
import { checkRateLimit, sanitizeInput, getCorsOrigin } from "@/lib/security";

// Dynamic CORS headers
async function getCorsHeaders(origin: string | null) {
    const allowedOrigin = await getCorsOrigin(origin);
    return {
        "Access-Control-Allow-Origin": allowedOrigin || "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

// OPTIONS preflight
export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin");
    const headers = await getCorsHeaders(origin);
    return NextResponse.json(null, { status: 204, headers });
}

// POST /api/leads — PUBLIC (tashqi saytlardan lead qabul qilish)
export async function POST(req: NextRequest) {
    const origin = req.headers.get("origin");
    const corsHeaders = await getCorsHeaders(origin);

    // ═══ CORS strict mode tekshirish ═══
    if (corsHeaders["Access-Control-Allow-Origin"] === "") {
        return NextResponse.json(
            { error: "CORS: ushbu domendan ruxsat berilmagan" },
            { status: 403, headers: corsHeaders }
        );
    }

    // ═══ Rate limiting ═══
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("x-real-ip")
        || "unknown";

    const rateResult = await checkRateLimit(ip);
    if (rateResult?.blocked) {
        return NextResponse.json(
            { error: `Juda ko'p so'rov. ${rateResult.retryAfter} soniyadan keyin urinib ko'ring.` },
            { status: 429, headers: { ...corsHeaders, "Retry-After": String(rateResult.retryAfter) } }
        );
    }

    try {
        const body = await req.json();

        // Validatsiya
        if (!body.name || !body.phone || !body.domain) {
            return NextResponse.json(
                { error: "Ism, telefon va domen majburiy" },
                { status: 400, headers: corsHeaders }
            );
        }

        // ═══ Input sanitization ═══
        const safeName = await sanitizeInput(String(body.name));
        const safeGoal = body.goal ? await sanitizeInput(String(body.goal)) : null;
        const safeRevenue = body.revenue ? await sanitizeInput(String(body.revenue)) : null;

        // Saytni topish
        const site = await prisma.site.findUnique({
            where: { domain: body.domain },
        });

        if (!site || !site.isActive) {
            return NextResponse.json(
                { error: "Sayt topilmadi yoki faol emas" },
                { status: 404, headers: corsHeaders }
            );
        }

        // Telefon formatlash
        const phone = body.phone.replace(/\D/g, "");

        // Lead yaratish
        const lead = await prisma.lead.create({
            data: {
                siteId: site.id,
                name: safeName,
                phone: phone.startsWith("998") ? `+${phone}` : `+998${phone}`,
                goal: safeGoal,
                revenue: safeRevenue,
                source: body.source || "organic",
                utmSource: body.utmSource || null,
                utmMedium: body.utmMedium || null,
                utmCampaign: body.utmCampaign || null,
                extraData: body.extraData || null,
            },
        });

        // Avtomatik notification yaratish
        prisma.notification.create({
            data: {
                type: "LEAD",
                title: `Yangi lead: ${safeName}`,
                message: `${site.domain} — ${safeGoal || "Maqsad ko'rsatilmagan"}`,
                siteId: site.id,
                leadId: lead.id,
            },
        }).catch(() => { });

        // Telegram bot orqali xabar yuborish
        notifyNewLead({
            name: lead.name,
            phone: lead.phone,
            goal: lead.goal,
            siteId: lead.siteId,
        }).catch(() => { });

        return NextResponse.json(
            {
                success: true,
                id: lead.id,
                analytics: {
                    metaPixelId: site.metaPixelId || null,
                    yandexMetricaId: site.yandexId || null,
                    googleAdsTag: site.googleAdsTag || null,
                },
            },
            { status: 201, headers: corsHeaders }
        );
    } catch (error) {
        console.error("Lead yaratishda xato:", error);
        return NextResponse.json(
            { error: "Server xatosi" },
            { status: 500, headers: corsHeaders }
        );
    }
}


// GET /api/leads — HIMOYALANGAN (admin panel uchun)
export async function GET(req: NextRequest) {
    // Dynamic import to avoid circular dependency
    const { apiAuth, canAccessSite } = await import("@/lib/apiAuth");

    try {
        const authResult = await apiAuth();
        if ("error" in authResult) return authResult.error;

        const { searchParams } = new URL(req.url);
        const siteId = searchParams.get("siteId");
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const where: Record<string, unknown> = {};

        // Sayt filtri — faqat tegishli saytlar
        if (siteId) {
            // Tanlangan saytga ruxsat bormi?
            if (!canAccessSite(authResult, siteId)) {
                return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
            }
            where.siteId = siteId;
        } else if (!authResult.isTeamAdmin) {
            // Sitelar filtri — faqat o'ziga tegishli saytlar
            where.siteId = { in: authResult.siteIds };
        }

        if (status) where.status = status;

        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    site: { select: { domain: true, name: true } },
                    assignedTo: { select: { name: true, login: true } },
                },
            }),
            prisma.lead.count({ where }),
        ]);

        return NextResponse.json({
            leads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Leadlar olishda xato:", error);
        return NextResponse.json(
            { error: "Server xatosi" },
            { status: 500 }
        );
    }
}

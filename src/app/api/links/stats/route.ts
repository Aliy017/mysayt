import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuth, canAccessSite } from "@/lib/apiAuth";

// GET /api/links/stats?siteId=X&period=week|month|all
export async function GET(req: NextRequest) {
    const authResult = await apiAuth();
    if ("error" in authResult) return authResult.error;

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const period = searchParams.get("period") || "all";

    // ═══ Xavfsizlik: sayt tegishliligini tekshirish ═══
    if (siteId && !canAccessSite(authResult, siteId)) {
        return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    // Davr filtri
    let dateFilter = {};
    const now = new Date();
    if (period === "today") {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { gte: todayStart } };
    } else if (period === "week") {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        dateFilter = { createdAt: { gte: weekStart } };
    } else if (period === "month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { gte: monthStart } };
    }

    // ═══ Sayt filtri — faqat tegishli saytlar ═══
    const where: Record<string, unknown> = { ...dateFilter };
    if (siteId) {
        where.siteId = siteId;
    } else if (!authResult.isTeamAdmin) {
        where.siteId = { in: authResult.siteIds };
    }

    // 1) Manba bo'yicha leadlar
    const bySource = await prisma.lead.groupBy({
        by: ["source"],
        where,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
    });

    // 2) UTM bo'yicha tafsilot
    const byUtm = await prisma.lead.groupBy({
        by: ["utmSource", "utmMedium", "utmCampaign"],
        where: { ...where, utmSource: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
    });

    // 3) Jami
    const total = await prisma.lead.count({ where });

    // 4) Kunlik trend (oxirgi 30 kun)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const trendLeads = await prisma.lead.findMany({
        where: { ...where, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, source: true },
    });

    const trend: Record<string, Record<string, number>> = {};
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        trend[key] = {};
    }

    for (const lead of trendLeads) {
        const day = lead.createdAt.toISOString().split("T")[0];
        const src = lead.source || "organic";
        if (trend[day]) {
            trend[day][src] = (trend[day][src] || 0) + 1;
        }
    }

    return NextResponse.json({
        total,
        bySource: bySource.map(s => ({
            source: s.source || "organic",
            count: s._count.id,
            percent: total > 0 ? Math.round((s._count.id / total) * 100) : 0,
        })),
        byUtm: byUtm.map(u => ({
            source: u.utmSource,
            medium: u.utmMedium,
            campaign: u.utmCampaign,
            count: u._count.id,
        })),
        trend: Object.entries(trend).map(([date, sources]) => ({
            date,
            total: Object.values(sources).reduce((a, b) => a + b, 0),
            ...sources,
        })),
    });
}

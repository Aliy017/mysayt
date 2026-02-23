import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuth } from "@/lib/apiAuth";

// GET /api/dashboard/stats
export async function GET() {
    try {
        const authResult = await apiAuth();
        if ("error" in authResult) return authResult.error;

        // TEAM_ADMIN — barcha saytlar; boshqalar — faqat tegishli saytlar
        let siteIds: string[];
        if (authResult.isTeamAdmin) {
            const allSites = await prisma.site.findMany({ select: { id: true } });
            siteIds = allSites.map((s) => s.id);
        } else {
            siteIds = authResult.siteIds;
        }

        if (siteIds.length === 0) {
            return NextResponse.json({
                today: 0, thisWeek: 0, thisMonth: 0, total: 0,
                byStatus: {}, bySite: [], bySource: [],
            });
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const siteFilter = { siteId: { in: siteIds } };

        const [today, thisWeek, thisMonth, total, byStatus, bySite, bySource, byUtmSource, byUtmMedium, byUtmCampaign] =
            await Promise.all([
                prisma.lead.count({ where: { ...siteFilter, createdAt: { gte: todayStart } } }),
                prisma.lead.count({ where: { ...siteFilter, createdAt: { gte: weekStart } } }),
                prisma.lead.count({ where: { ...siteFilter, createdAt: { gte: monthStart } } }),
                prisma.lead.count({ where: siteFilter }),
                prisma.lead.groupBy({ by: ["status"], where: siteFilter, _count: { id: true } }),
                prisma.lead.groupBy({
                    by: ["siteId"],
                    where: { ...siteFilter, createdAt: { gte: todayStart } },
                    _count: { id: true },
                }),
                prisma.lead.groupBy({
                    by: ["source"],
                    where: siteFilter,
                    _count: { id: true },
                }),
                prisma.lead.groupBy({
                    by: ["utmSource"],
                    where: { ...siteFilter, utmSource: { not: null } },
                    _count: { id: true },
                    orderBy: { _count: { id: "desc" } },
                }),
                prisma.lead.groupBy({
                    by: ["utmMedium"],
                    where: { ...siteFilter, utmMedium: { not: null } },
                    _count: { id: true },
                    orderBy: { _count: { id: "desc" } },
                }),
                prisma.lead.groupBy({
                    by: ["utmCampaign"],
                    where: { ...siteFilter, utmCampaign: { not: null } },
                    _count: { id: true },
                    orderBy: { _count: { id: "desc" } },
                }),
            ]);

        const sites = await prisma.site.findMany({
            where: { id: { in: siteIds } },
            select: { id: true, domain: true, name: true, metaPixelId: true, yandexId: true, googleAdsTag: true, isActive: true },
        });

        const bySiteWithNames = bySite.map((s) => {
            const site = sites.find((si) => si.id === s.siteId);
            return { siteId: s.siteId, domain: site?.domain || "", name: site?.name || "", todayCount: s._count.id };
        });

        const statusMap: Record<string, number> = {};
        byStatus.forEach((s) => { statusMap[s.status] = s._count.id; });

        const sourceData = bySource.map((s) => ({
            source: s.source || "organic",
            count: s._count.id,
        }));

        const siteAnalytics = sites.map((s) => ({
            domain: s.domain,
            name: s.name,
            isActive: s.isActive,
            metaPixelId: s.metaPixelId || null,
            yandexId: s.yandexId || null,
            googleAdsTag: s.googleAdsTag || null,
        }));

        return NextResponse.json({
            today, thisWeek, thisMonth, total,
            byStatus: statusMap,
            bySite: bySiteWithNames,
            bySource: sourceData,
            siteAnalytics,
            utm: {
                bySource: byUtmSource.map((s) => ({ value: s.utmSource || "", count: s._count.id })),
                byMedium: byUtmMedium.map((s) => ({ value: s.utmMedium || "", count: s._count.id })),
                byCampaign: byUtmCampaign.map((s) => ({ value: s.utmCampaign || "", count: s._count.id })),
            },
        });
    } catch (error) {
        console.error("Dashboard stats xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

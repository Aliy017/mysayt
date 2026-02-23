import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/leads/new-count?since=ISO_DATE
// Oxirgi tekshirishdan keyingi yangi leadlar soni va eng oxirgisi
export async function GET(req: NextRequest) {
    const { apiAuth, canAccessSite: _canAccessSite } = await import("@/lib/apiAuth");

    try {
        const authResult = await apiAuth();
        if ("error" in authResult) return authResult.error;
        void _canAccessSite;

        const { searchParams } = new URL(req.url);
        const since = searchParams.get("since");

        const where: Record<string, unknown> = {};

        // Faqat o'ziga tegishli saytlar
        if (!authResult.isTeamAdmin) {
            where.siteId = { in: authResult.siteIds };
        }

        // Vaqt filtri
        if (since) {
            where.createdAt = { gt: new Date(since) };
        }

        const [count, latest] = await Promise.all([
            prisma.lead.count({ where }),
            prisma.lead.findFirst({
                where,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    createdAt: true,
                    site: { select: { domain: true } },
                },
            }),
        ]);

        return NextResponse.json({ count, latest });
    } catch (error) {
        console.error("new-count xato:", error);
        return NextResponse.json({ count: 0, latest: null });
    }
}

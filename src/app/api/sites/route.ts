import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuth } from "@/lib/apiAuth";
import { clearSiteDomainsCache } from "@/lib/security";

// GET /api/sites — Foydalanuvchiga tegishli saytlar
export async function GET() {
    try {
        const authResult = await apiAuth();
        if ("error" in authResult) return authResult.error;

        // TEAM_ADMIN — barcha saytlar; SUPER_ADMIN/ADMIN — faqat o'ziga tegishli
        const where = authResult.isTeamAdmin
            ? {}
            : { id: { in: authResult.siteIds } };

        const sites = await prisma.site.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { leads: true, users: true } },
            },
        });
        return NextResponse.json(sites);
    } catch (error) {
        console.error("Sites GET xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

// POST /api/sites — Yangi sayt qo'shish (FAQAT TEAM_ADMIN va SUPER_ADMIN)
export async function POST(req: NextRequest) {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN", "SUPER_ADMIN"]);
        if ("error" in authResult) return authResult.error;

        const body = await req.json();

        if (!body.domain || !body.name) {
            return NextResponse.json(
                { error: "Domen va nom majburiy" },
                { status: 400 }
            );
        }

        const exists = await prisma.site.findUnique({ where: { domain: body.domain } });
        if (exists) {
            return NextResponse.json({ error: "Bu domen allaqachon mavjud" }, { status: 409 });
        }

        const site = await prisma.site.create({
            data: {
                domain: body.domain.toLowerCase().trim(),
                name: body.name.trim(),
                metaPixelId: body.metaPixelId || null,
                yandexId: body.yandexId || null,
                googleAdsTag: body.googleAdsTag || null,
            },
        });

        // Yaratuvchiga avtomatik bog'lash (agar SUPER_ADMIN bo'lsa)
        if (authResult.isSuperAdmin) {
            await prisma.userSite.create({
                data: { userId: authResult.userId!, siteId: site.id },
            });
        }

        // Sayt domenlar keshini tozalash (CORS yangilanishi uchun)
        clearSiteDomainsCache();

        return NextResponse.json({ success: true, id: site.id }, { status: 201 });
    } catch (error) {
        console.error("Sites POST xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

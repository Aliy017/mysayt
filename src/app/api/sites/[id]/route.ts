import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuth, canAccessSite } from "@/lib/apiAuth";
import { clearSiteDomainsCache } from "@/lib/security";

// PATCH /api/sites/[id] — Sayt tahrirlash (FAQAT tegishli sayt)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN", "SUPER_ADMIN"]);
        if ("error" in authResult) return authResult.error;

        const { id } = await params;

        // Sayt foydalanuvchiga tegishlimi tekshirish
        if (!canAccessSite(authResult, id)) {
            return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
        }

        const body = await req.json();
        const updateData: Record<string, unknown> = {};
        if (body.name) updateData.name = body.name;
        if (body.domain) updateData.domain = body.domain;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.lowPowerMode !== undefined) updateData.lowPowerMode = body.lowPowerMode;
        if (body.metaPixelId !== undefined) updateData.metaPixelId = body.metaPixelId;
        if (body.yandexId !== undefined) updateData.yandexId = body.yandexId;
        if (body.googleAdsTag !== undefined) updateData.googleAdsTag = body.googleAdsTag;

        await prisma.site.update({ where: { id }, data: updateData });
        clearSiteDomainsCache(); // CORS yangilash
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Site PATCH xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

// DELETE /api/sites/[id] — (FAQAT TEAM_ADMIN)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN"]);
        if ("error" in authResult) return authResult.error;

        const { id } = await params;
        await prisma.site.delete({ where: { id } });
        clearSiteDomainsCache(); // CORS yangilash
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Site DELETE xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

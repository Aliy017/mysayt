import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuth } from "@/lib/apiAuth";

// GET /api/links/generated — Saqlangan linklar ro'yxati
export async function GET(req: NextRequest) {
    try {
        const authResult = await apiAuth();
        if ("error" in authResult) return authResult.error;

        const siteId = req.nextUrl.searchParams.get("siteId");

        const where = authResult.isTeamAdmin
            ? siteId ? { siteId } : {}
            : { siteId: { in: authResult.siteIds }, ...(siteId ? { siteId } : {}) };

        const links = await prisma.generatedLink.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 50,
            include: { site: { select: { domain: true, name: true } } },
        });

        return NextResponse.json(links);
    } catch (error) {
        console.error("Generated links GET xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

// POST /api/links/generated — Yangi link saqlash
export async function POST(req: NextRequest) {
    try {
        const authResult = await apiAuth();
        if ("error" in authResult) return authResult.error;

        const body = await req.json();

        if (!body.siteId || !body.url || !body.source) {
            return NextResponse.json({ error: "siteId, url va source kerak" }, { status: 400 });
        }

        const link = await prisma.generatedLink.create({
            data: {
                siteId: body.siteId,
                url: body.url,
                source: body.source,
                medium: body.medium || null,
                campaign: body.campaign || null,
                lowPower: body.lowPower || false,
            },
        });

        return NextResponse.json({ success: true, id: link.id }, { status: 201 });
    } catch (error) {
        console.error("Generated links POST xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

// PATCH /api/links/generated — Link lowPower o'zgartirish
export async function PATCH(req: NextRequest) {
    try {
        const authResult = await apiAuth();
        if ("error" in authResult) return authResult.error;

        const body = await req.json();
        if (!body.id) return NextResponse.json({ error: "id kerak" }, { status: 400 });

        // Hozirgi linkni olish
        const existing = await prisma.generatedLink.findUnique({ where: { id: body.id } });
        if (!existing) return NextResponse.json({ error: "Link topilmadi" }, { status: 404 });

        const newLowPower = body.lowPower !== undefined ? body.lowPower : !existing.lowPower;

        // URL ni yangilash — low=1 qo'shish yoki olib tashlash
        let newUrl = existing.url;
        const urlObj = new URL(existing.url);
        if (newLowPower) {
            urlObj.searchParams.set("low", "1");
        } else {
            urlObj.searchParams.delete("low");
        }
        newUrl = urlObj.toString();

        const updated = await prisma.generatedLink.update({
            where: { id: body.id },
            data: { lowPower: newLowPower, url: newUrl },
            include: { site: { select: { domain: true, name: true } } },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Generated links PATCH xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

// DELETE /api/links/generated — Link o'chirish
export async function DELETE(req: NextRequest) {
    try {
        const authResult = await apiAuth();
        if ("error" in authResult) return authResult.error;

        const id = req.nextUrl.searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id kerak" }, { status: 400 });

        await prisma.generatedLink.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Generated links DELETE xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

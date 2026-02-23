import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuth, canAccessSite } from "@/lib/apiAuth";

// PATCH /api/leads/[id] — Lead statusini o'zgartirish (HIMOYALANGAN)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await apiAuth();
        if ("error" in authResult) return authResult.error;

        const { id } = await params;
        const body = await req.json();

        // Leadning saytiga ruxsat bormi tekshirish
        const existingLead = await prisma.lead.findUnique({
            where: { id },
            select: { siteId: true },
        });

        if (!existingLead) {
            return NextResponse.json({ error: "Lead topilmadi" }, { status: 404 });
        }

        if (!canAccessSite(authResult, existingLead.siteId)) {
            return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
        }

        const updateData: Record<string, unknown> = {};

        if (body.status) updateData.status = body.status;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.assignedId !== undefined) updateData.assignedId = body.assignedId;

        const lead = await prisma.lead.update({
            where: { id },
            data: updateData,
            include: {
                site: { select: { domain: true, name: true } },
                assignedTo: { select: { name: true } },
            },
        });

        return NextResponse.json(lead);
    } catch (error) {
        console.error("Lead update xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

// DELETE /api/leads/[id] — Lead o'chirish (FAQAT TD/SD + ownership)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN", "SUPER_ADMIN"]);
        if ("error" in authResult) return authResult.error;

        const { id } = await params;

        // Leadning saytiga ruxsat bormi tekshirish
        const existingLead = await prisma.lead.findUnique({
            where: { id },
            select: { siteId: true },
        });

        if (!existingLead) {
            return NextResponse.json({ error: "Lead topilmadi" }, { status: 404 });
        }

        if (!canAccessSite(authResult, existingLead.siteId)) {
            return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
        }

        await prisma.lead.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Lead delete xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { apiAuth } from "@/lib/apiAuth";

// PATCH /api/users/[id] — Foydalanuvchini o'zgartirish (FAQAT TD/SD)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN", "SUPER_ADMIN"]);
        if ("error" in authResult) return authResult.error;

        const { id } = await params;
        const body = await req.json();

        // SUPER_ADMIN faqat o'zi yaratgan userlarni o'zgartira oladi (TD hamma)
        if (authResult.isSuperAdmin) {
            const targetUser = await prisma.user.findUnique({
                where: { id },
                select: { createdById: true, role: true },
            });
            // SD boshqa SD yoki TD ni tahrirlashi mumkin emas
            if (targetUser?.role === "TEAM_ADMIN" || targetUser?.role === "SUPER_ADMIN") {
                if (targetUser.createdById !== authResult.userId) {
                    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
                }
            }
        }

        const updateData: Record<string, unknown> = {};
        if (body.name) updateData.name = body.name;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        // Rol o'zgartirish — faqat TD
        if (body.role && authResult.isTeamAdmin) {
            updateData.role = body.role;
        }

        if (body.password) {
            updateData.password = await bcrypt.hash(body.password, 10);
        }

        await prisma.user.update({ where: { id }, data: updateData });

        // Saytlarni yangilash
        if (body.siteIds) {
            await prisma.userSite.deleteMany({ where: { userId: id } });
            if (body.siteIds.length > 0) {
                await prisma.userSite.createMany({
                    data: body.siteIds.map((siteId: string) => ({
                        userId: id,
                        siteId,
                    })),
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("User PATCH xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

// DELETE /api/users/[id] — (FAQAT TD)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN"]);
        if ("error" in authResult) return authResult.error;

        const { id } = await params;

        // O'zini o'chirmaslik
        if (id === authResult.userId) {
            return NextResponse.json({ error: "O'zingizni o'chira olmaysiz" }, { status: 400 });
        }

        // Bog'liq ma'lumotlarni tozalash
        await prisma.user.updateMany({ where: { createdById: id }, data: { createdById: null } });
        await prisma.activityLog.deleteMany({ where: { userId: id } });
        await prisma.notification.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
        await prisma.userSite.deleteMany({ where: { userId: id } });
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("User DELETE xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

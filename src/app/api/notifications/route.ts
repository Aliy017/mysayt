import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuth } from "@/lib/apiAuth";

// GET /api/notifications — Habarnomalar (HIMOYALANGAN)
export async function GET() {
    try {
        const authResult = await apiAuth();
        if ("error" in authResult) return authResult.error;

        // Foydalanuvchiga tegishli notification lar
        // receiverId = userId YOKI receiverId = null (barcha uchun)
        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { receiverId: authResult.userId },
                    { receiverId: null },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                sender: { select: { name: true, login: true } },
            },
        });

        // SiteId va LeadId orqali qo'shimcha ma'lumot olish
        const siteIds = [...new Set(notifications.map(n => n.siteId).filter(Boolean))] as string[];
        const leadIds = [...new Set(notifications.map(n => n.leadId).filter(Boolean))] as string[];

        const [sites, leads] = await Promise.all([
            siteIds.length > 0 ? prisma.site.findMany({
                where: { id: { in: siteIds } },
                select: { id: true, domain: true, name: true },
            }) : [],
            leadIds.length > 0 ? prisma.lead.findMany({
                where: { id: { in: leadIds } },
                select: { id: true, name: true, phone: true },
            }) : [],
        ]);

        const siteMap = Object.fromEntries(sites.map(s => [s.id, s]));
        const leadMap = Object.fromEntries(leads.map(l => [l.id, l]));

        const enriched = notifications.map(n => ({
            ...n,
            site: n.siteId ? siteMap[n.siteId] || null : null,
            lead: n.leadId ? leadMap[n.leadId] || null : null,
        }));

        return NextResponse.json(enriched);
    } catch (error) {
        console.error("Notifications xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

// POST /api/notifications — yangi bildirishnoma (FAQAT TD/SD)
export async function POST(req: NextRequest) {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN", "SUPER_ADMIN"]);
        if ("error" in authResult) return authResult.error;

        const body = await req.json();
        const notification = await prisma.notification.create({
            data: {
                type: body.type || "SYSTEM",
                title: body.title,
                message: body.message || "",
                siteId: body.siteId || null,
                leadId: body.leadId || null,
                senderId: authResult.userId,
                receiverId: body.receiverId || null,
            },
        });
        return NextResponse.json(notification, { status: 201 });
    } catch (error) {
        console.error("Notification create xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

// PATCH /api/notifications — O'qildi deb belgilash
export async function PATCH(req: NextRequest) {
    try {
        const authResult = await apiAuth();
        if ("error" in authResult) return authResult.error;

        const body = await req.json();
        if (body.markAllRead) {
            // Faqat o'z notification larini
            await prisma.notification.updateMany({
                where: {
                    OR: [
                        { receiverId: authResult.userId },
                        { receiverId: null },
                    ],
                },
                data: { isRead: true },
            });
            return NextResponse.json({ success: true });
        }
        if (body.id) {
            // Notification foydalanuvchiga tegishlimi tekshirish
            const n = await prisma.notification.findUnique({
                where: { id: body.id },
                select: { receiverId: true },
            });
            if (n && n.receiverId && n.receiverId !== authResult.userId) {
                return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
            }
            await prisma.notification.update({
                where: { id: body.id },
                data: { isRead: true },
            });
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "id yoki markAllRead kerak" }, { status: 400 });
    } catch (error) {
        console.error("Notification PATCH xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

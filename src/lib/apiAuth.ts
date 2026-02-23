import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API route uchun xavfsizlik tekshirish helper
 * 1) Session borligini tekshiradi
 * 2) Rolni tekshiradi (agar roles[] berilsa)
 * 3) Foydalanuvchiga tegishli saytlar ID larini qaytaradi
 */
export async function apiAuth(allowedRoles?: string[]) {
    const session = await auth();

    if (!session?.user) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const user = session.user as { userId: string; role: string; name: string };

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return { error: NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 }) };
    }

    // Foydalanuvchiga tegishli sayt IDlar
    const userSites = await prisma.userSite.findMany({
        where: { userId: user.userId },
        select: { siteId: true },
    });

    const siteIds = userSites.map(us => us.siteId);

    return {
        userId: user.userId,
        role: user.role,
        name: user.name,
        siteIds,                    // Foydalanuvchiga tegishli saytlar
        isTeamAdmin: user.role === "TEAM_ADMIN",
        isSuperAdmin: user.role === "SUPER_ADMIN",
        isAdmin: user.role === "ADMIN",
    };
}

/**
 * siteId foydalanuvchiga tegishliligini tekshirish
 * TEAM_ADMIN — barchaga ruxsat
 */
export function canAccessSite(authResult: { role: string; siteIds: string[]; isTeamAdmin: boolean }, siteId: string): boolean {
    if (authResult.isTeamAdmin) return true;
    return authResult.siteIds.includes(siteId);
}

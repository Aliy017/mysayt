import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { apiAuth } from "@/lib/apiAuth";

// GET /api/users — Foydalanuvchilar ro'yxati
export async function GET() {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN", "SUPER_ADMIN"]);
        if ("error" in authResult) return authResult.error;
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                login: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                sites: {
                    include: {
                        site: { select: { id: true, domain: true, name: true } },
                    },
                },
            },
        });

        const formatted = users.map((u) => ({
            ...u,
            sites: u.sites.map((us) => us.site),
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Users GET xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

// POST /api/users — Yangi foydalanuvchi yaratish
export async function POST(req: NextRequest) {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN", "SUPER_ADMIN"]);
        if ("error" in authResult) return authResult.error;
        const body = await req.json();

        if (!body.login || !body.password || !body.name || !body.role) {
            return NextResponse.json(
                { error: "Login, parol, ism va rol majburiy" },
                { status: 400 }
            );
        }

        // Login tekshirish
        const exists = await prisma.user.findUnique({ where: { login: body.login } });
        if (exists) {
            return NextResponse.json({ error: "Bu login band" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(body.password, 10);

        const user = await prisma.user.create({
            data: {
                login: body.login,
                password: hashedPassword,
                name: body.name,
                role: body.role,
                isActive: true,
            },
        });

        // Saytlarga ulash
        if (body.siteIds && body.siteIds.length > 0) {
            await prisma.userSite.createMany({
                data: body.siteIds.map((siteId: string) => ({
                    userId: user.id,
                    siteId,
                })),
            });
        }

        return NextResponse.json({ success: true, id: user.id }, { status: 201 });
    } catch (error) {
        console.error("Users POST xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

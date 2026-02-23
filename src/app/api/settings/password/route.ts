import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/settings/password — parolni o'zgartirish
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.userId) {
            return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
        }

        const { oldPassword, newPassword } = await req.json();

        if (!oldPassword || !newPassword) {
            return NextResponse.json({ error: "Ikkala maydon majburiy" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "Parol kamida 6 ta belgi" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.userId } });
        if (!user) {
            return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
        }

        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid) {
            return NextResponse.json({ error: "Joriy parol noto'g'ri" }, { status: 403 });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashed },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Password change xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

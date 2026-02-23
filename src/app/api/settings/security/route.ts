import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuth } from "@/lib/apiAuth";
import { clearSettingsCache } from "@/lib/security";

// GET /api/settings/security — Xavfsizlik sozlamalarini olish (TD only)
export async function GET() {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN"]);
        if ("error" in authResult) return authResult.error;

        let settings = await prisma.systemSettings.findUnique({
            where: { id: "default" },
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: "default" },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Security settings GET xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

// PATCH /api/settings/security — Sozlamalarni o'zgartirish (TD only)
export async function PATCH(req: NextRequest) {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN"]);
        if ("error" in authResult) return authResult.error;

        const body = await req.json();

        const updateData: Record<string, unknown> = {};

        // Boolean togglelar
        const booleanFields = [
            "rateLimitEnabled", "bruteForceEnabled", "corsStrictMode",
            "inputSanitization", "auditLogExpanded",
        ];
        for (const field of booleanFields) {
            if (typeof body[field] === "boolean") updateData[field] = body[field];
        }

        // Int maydonlar (min cheklov bilan)
        if (typeof body.rateLimitMax === "number" && body.rateLimitMax >= 1 && body.rateLimitMax <= 1000) {
            updateData.rateLimitMax = body.rateLimitMax;
        }
        if (typeof body.bruteForceMax === "number" && body.bruteForceMax >= 1 && body.bruteForceMax <= 100) {
            updateData.bruteForceMax = body.bruteForceMax;
        }
        if (typeof body.bruteForceBlock === "number" && body.bruteForceBlock >= 1 && body.bruteForceBlock <= 1440) {
            updateData.bruteForceBlock = body.bruteForceBlock;
        }

        // String maydonlar
        if (typeof body.corsAllowedOrigins === "string") {
            updateData.corsAllowedOrigins = body.corsAllowedOrigins.trim();
        }

        // Upsert — agar yo'q bo'lsa yaratish
        const settings = await prisma.systemSettings.upsert({
            where: { id: "default" },
            update: updateData,
            create: { id: "default", ...updateData },
        });

        // Keshni tozalash
        clearSettingsCache();

        // Audit log
        if (authResult.userId) {
            const { logAudit } = await import("@/lib/security");
            await logAudit(
                authResult.userId,
                "security_settings_update",
                JSON.stringify(updateData)
            );
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Security settings PATCH xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

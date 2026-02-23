import { NextRequest, NextResponse } from "next/server";
import { setWebhook, getWebhookInfo } from "@/lib/bot";
import { apiAuth } from "@/lib/apiAuth";

// GET /api/bot/setup-webhook — Webhook holatini ko'rish (FAQAT TD)
export async function GET() {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN"]);
        if ("error" in authResult) return authResult.error;

        const info = await getWebhookInfo();
        return NextResponse.json(info);
    } catch (error) {
        console.error("Webhook info xato:", error);
        return NextResponse.json({ error: "Xato" }, { status: 500 });
    }
}

// POST /api/bot/setup-webhook — Webhook URL ni o'rnatish (FAQAT TD)
export async function POST(req: NextRequest) {
    try {
        const authResult = await apiAuth(["TEAM_ADMIN"]);
        if ("error" in authResult) return authResult.error;

        const { url } = await req.json();

        if (!url) {
            return NextResponse.json(
                { error: "url maydoni kerak. Masalan: https://mysayt.uz/api/bot/webhook" },
                { status: 400 }
            );
        }

        const result = await setWebhook(url);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Webhook setup xato:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}

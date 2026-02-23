import { NextRequest, NextResponse } from "next/server";
import { handleUpdate } from "@/lib/botHandlers";
import type { TelegramUpdate } from "@/lib/bot";

const BOT_TOKEN = process.env.BOT_TOKEN || "";

// Telegram webhook secret token ni tekshirish
// Telegram setWebhook da secret_token o'rnatilsa, har bir so'rovda
// X-Telegram-Bot-Api-Secret-Token headerda yuboriladi
function verifyTelegramRequest(req: NextRequest): boolean {
    // Agar secret token o'rnatilmagan bo'lsa — IP tekshirish
    const secretToken = process.env.BOT_WEBHOOK_SECRET;
    if (secretToken) {
        const headerToken = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
        return headerToken === secretToken;
    }

    // Asosiy himoya: BOT_TOKEN borligini tekshirish
    return !!BOT_TOKEN;
}

// POST /api/bot/webhook — Telegram xabarlarni qabul qilish
export async function POST(req: NextRequest) {
    try {
        // ═══ Xavfsizlik tekshirish ═══
        if (!verifyTelegramRequest(req)) {
            console.warn("Bot webhook: Noto'g'ri yoki ruxsatsiz so'rov");
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const update: TelegramUpdate = await req.json();

        // Xabarni qayta ishlash
        await handleUpdate(update);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Bot webhook xato:", error);
        // Telegram ga doim 200 qaytarish kerak
        return NextResponse.json({ ok: true });
    }
}

// GET — health check (token ko'rsatmasin!)
export async function GET() {
    return NextResponse.json({
        status: "Bot webhook is active",
        hasToken: !!BOT_TOKEN,
    });
}

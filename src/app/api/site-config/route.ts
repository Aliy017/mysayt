import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/site-config?domain=pimedia.uz — Public API (autentifikatsiyasiz)
// Saytning low power mode va boshqa sozlamalarini qaytaradi
export async function GET(req: NextRequest) {
    try {
        const domain = req.nextUrl.searchParams.get("domain");
        if (!domain) {
            return NextResponse.json({ error: "domain parametri kerak" }, { status: 400 });
        }

        const site = await prisma.site.findUnique({
            where: { domain: domain.toLowerCase().trim() },
            select: {
                lowPowerMode: true,
                isActive: true,
                metaPixelId: true,
                yandexId: true,
                googleAdsTag: true,
            },
        });

        if (!site) {
            return NextResponse.json({ lowPowerMode: false, metaPixelId: null, yandexId: null, googleAdsTag: null });
        }

        // CORS headers — boshqa domenlardan ham so'rov yuborish uchun
        return NextResponse.json(
            {
                lowPowerMode: site.lowPowerMode,
                metaPixelId: site.metaPixelId || null,
                yandexId: site.yandexId || null,
                googleAdsTag: site.googleAdsTag || null,
            },
            {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
                },
            }
        );
    } catch (error) {
        console.error("Site-config GET xato:", error);
        return NextResponse.json({ lowPowerMode: false });
    }
}

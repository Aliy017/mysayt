import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Public routes — ruxsat berish
    if (
        pathname === "/login" ||
        pathname === "/" ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // /api/leads — public (tashqi saytlardan lead qabul qilish)
    // /api/bot/webhook — public (Telegram webhook)
    if (pathname === "/api/leads" || pathname === "/api/bot/webhook") {
        // OPTIONS = CORS preflight — to'g'ridan-to'g'ri javob
        if (req.method === "OPTIONS") {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Max-Age": "86400",
                },
            });
        }
        // POST — lead yuborish (CORS headerlar bilan)
        if (req.method === "POST") {
            const response = NextResponse.next();
            response.headers.set("Access-Control-Allow-Origin", "*");
            return response;
        }
    }

    // NextAuth API — ruxsat berish
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    // /admin/* va boshqa /api/* — session cookie tekshirish
    const token =
        req.cookies.get("authjs.session-token")?.value ||
        req.cookies.get("__Secure-authjs.session-token")?.value;

    if (!token && (pathname.startsWith("/admin") || pathname.startsWith("/api"))) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

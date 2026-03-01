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
    // /api/site-config — public (sayt konfiguratsiyasi)
    // /api/bot/webhook — public (Telegram webhook)
    // CORS headerlarni route.ts o'zi boshqaradi (getCorsOrigin orqali)
    if (
        pathname === "/api/leads" ||
        pathname === "/api/site-config" ||
        pathname === "/api/bot/webhook"
    ) {
        return NextResponse.next();
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

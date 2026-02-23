"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { checkBruteForce, recordFailedLogin, clearBruteForce } from "@/lib/security";

export async function loginAction(
    _prevState: { error: string } | null,
    formData: FormData
) {
    // IP olish
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
        || headersList.get("x-real-ip")
        || "unknown";

    // ═══ Brute force tekshirish ═══
    const bruteResult = await checkBruteForce(ip);
    if (bruteResult?.blocked) {
        return {
            error: `Juda ko'p urinish. ${bruteResult.remainingMinutes} daqiqadan keyin qayta urinib ko'ring.`
        };
    }

    try {
        await signIn("credentials", {
            login: formData.get("login") as string,
            password: formData.get("password") as string,
            redirectTo: "/admin/dashboard",
        });

        // Muvaffaqiyatli login — counter tozalash
        clearBruteForce(ip);

        return null;
    } catch (error) {
        if (error instanceof AuthError) {
            // Muvaffaqiyatsiz login — counter oshirish
            await recordFailedLogin(ip);
            return { error: "Login yoki parol noto'g'ri" };
        }
        throw error; // NextAuth redirect errors should be re-thrown
    }
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Server-side role tekshirish.
 * Cheklangan sahifalarda: const session = await requireRole(["TEAM_ADMIN", "SUPER_ADMIN"]);
 * Agar ruxsat bo'lmasa — /admin/dashboard ga redirect qiladi
 */
export async function requireRole(allowedRoles: string[]) {
    const session = await auth();
    if (!session) redirect("/login");

    const role = (session.user as { role?: string })?.role;
    if (!role || !allowedRoles.includes(role)) {
        redirect("/admin/dashboard");
    }

    return session;
}

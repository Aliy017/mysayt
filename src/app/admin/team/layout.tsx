import { requireRole } from "@/lib/requireRole";

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
    // Faqat TEAM_ADMIN va SUPER_ADMIN kirishi mumkin
    await requireRole(["TEAM_ADMIN", "SUPER_ADMIN"]);
    return <>{children}</>;
}

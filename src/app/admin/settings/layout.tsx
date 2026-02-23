import { requireRole } from "@/lib/requireRole";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
    // Faqat TEAM_ADMIN kirishi mumkin
    await requireRole(["TEAM_ADMIN"]);
    return <>{children}</>;
}

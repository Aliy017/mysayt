import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Providers } from "@/components/Providers";
import { AdminSidebar } from "@/components/AdminSidebar";
import LeadNotifier from "@/components/LeadNotifier";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <Providers>
            <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('lowPowerMode')==='true')document.documentElement.classList.add('low-power')}catch(e){}` }} />
            <div className="min-h-screen bg-[#0a0a0f]">
                <AdminSidebar />
                <main className="admin-main">
                    <div className="admin-content max-w-[1400px]">
                        {children}
                    </div>
                </main>
            </div>
            <LeadNotifier />
        </Providers>
    );
}

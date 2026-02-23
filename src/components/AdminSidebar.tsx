"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "chart" },
    { href: "/admin/leads", label: "Arizalar", icon: "users" },
    { href: "/admin/links", label: "Linklar", icon: "link" },
    { href: "/admin/sites", label: "Saytlar", icon: "globe" },
    { href: "/admin/team", label: "Foydalanuvchilar", icon: "team" },
    { href: "/admin/notifications", label: "Habarnomalar", icon: "bell" },
    { href: "/admin/security", label: "Xavfsizlik", icon: "shield" },
    { href: "/admin/settings", label: "Sozlamalar", icon: "settings" },
];

function NavIcon({ type, active }: { type: string; active?: boolean }) {
    const style = { width: 18, height: 18, color: active ? '#FF2020' : undefined };
    switch (type) {
        case "chart":
            return (<svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="4" rx="1.5" /><rect x="14" y="10" width="7" height="11" rx="1.5" /><rect x="3" y="13" width="7" height="8" rx="1.5" /></svg>);
        case "users":
            return (<svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>);
        case "globe":
            return (<svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" /></svg>);
        case "team":
            return (<svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>);
        case "bell":
            return (<svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>);
        case "settings":
            return (<svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>);
        case "link":
            return (<svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>);
        case "shield":
            return (<svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
        default:
            return null;
    }
}

const ROLE_LABELS: Record<string, string> = {
    TEAM_ADMIN: "TeamAdmin",
    SUPER_ADMIN: "SuperAdmin",
    ADMIN: "Admin",
};

export function AdminSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);
    const role = (session?.user as { role?: string })?.role || "";

    useEffect(() => {
        setMounted(true);
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Close sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const visibleItems = NAV_ITEMS.filter((item) => {
        if (role === "ADMIN") {
            return ["/admin/dashboard", "/admin/leads", "/admin/notifications", "/admin/links"].includes(item.href);
        }
        if (role === "SUPER_ADMIN") {
            return !["/admin/settings", "/admin/security", "/admin/sites"].includes(item.href);
        }
        return true;

    });

    const showSidebar = !isMobile || mobileOpen;

    if (!mounted) return null;

    return (
        <>
            {/* Mobile header bar */}
            {isMobile && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 51,
                    height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 12px',
                    background: 'rgba(14,14,20,0.95)', backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: mobileOpen ? 'rgba(255,32,32,0.1)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${mobileOpen ? 'rgba(255,32,32,0.2)' : 'rgba(255,255,255,0.06)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: mobileOpen ? '#FF2020' : 'rgba(255,255,255,0.6)', cursor: 'pointer',
                        }}
                    >
                        <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
                        </svg>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, #FF2020, #cc1a1a)',
                        }}>
                            <svg style={{ width: 14, height: 14, color: 'white' }} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>MySayt</span>
                    </div>
                    <div style={{ width: 38 }} />
                </div>
            )}

            {/* Mobile overlay */}
            {isMobile && mobileOpen && (
                <div
                    style={{ position: 'fixed', top: 52, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 44 }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            {showSidebar && (
                <aside suppressHydrationWarning style={{
                    position: 'fixed', top: isMobile ? 52 : 0, left: 0,
                    height: isMobile ? 'calc(100% - 52px)' : '100%', width: 260,
                    background: '#0e0e14', borderRight: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', flexDirection: 'column', zIndex: isMobile ? 45 : 30,
                    overflowY: 'auto',
                }}>
                    {/* Logo — faqat desktopda */}
                    {!isMobile && (
                        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #FF2020, #cc1a1a)',
                                }}>
                                    <svg style={{ width: 18, height: 18, color: 'white' }} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: 14 }}>MySayt</p>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Admin Panel</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {visibleItems.map((item) => {
                            const active = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12,
                                        fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s',
                                        color: active ? '#FF2020' : 'rgba(255,255,255,0.5)',
                                        background: active ? 'rgba(255,32,32,0.10)' : 'transparent',
                                        border: active ? '1px solid rgba(255,32,32,0.15)' : '1px solid transparent',
                                    }}
                                >
                                    <NavIcon type={item.icon} active={active} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User */}
                    <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        {session?.user && (
                            <div style={{ padding: '0 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                                    }}>
                                        {session.user.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user.name}</p>
                                        <span style={{
                                            display: 'inline-flex', padding: '2px 8px', borderRadius: 4,
                                            fontSize: 10, fontWeight: 600,
                                            color: '#FF2020', background: 'rgba(255,32,32,0.1)',
                                            border: '1px solid rgba(255,32,32,0.2)',
                                        }}>
                                            {ROLE_LABELS[role] || role}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                                        color: 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none', cursor: 'pointer',
                                        marginTop: 4,
                                    }}
                                >
                                    <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                                    </svg>
                                    Chiqish
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
            )}
        </>
    );
}

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";

// ══════════════ TYPES ══════════════
interface UtmBreakdown { value: string; count: number }
interface SiteAnalytics { domain: string; name: string; isActive: boolean; metaPixelId: string | null; yandexId: string | null; googleAdsTag: string | null }
interface Stats {
    today: number; thisWeek: number; thisMonth: number; total: number;
    byStatus: Record<string, number>;
    bySite: { siteId: string; domain: string; name: string; todayCount: number }[];
    bySource: { source: string; count: number }[];
    siteAnalytics?: SiteAnalytics[];
    utm?: { bySource: UtmBreakdown[]; byMedium: UtmBreakdown[]; byCampaign: UtmBreakdown[] };
}

// ══════════════ CONSTANTS ══════════════
const STATUS_LABELS: Record<string, string> = {
    NEW: "Yangi", CONTACTED: "Bog'lanildi", QUALIFIED: "Tasdiqlandi",
    PROPOSAL: "Taklif", WON: "Shartnoma", LOST: "Rad",
};
const STATUS_COLORS: Record<string, string> = {
    NEW: "#3b82f6", CONTACTED: "#f59e0b", QUALIFIED: "#22c55e",
    PROPOSAL: "#a855f7", WON: "#10b981", LOST: "#ef4444",
};

const SOURCE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    instagram: { label: "Instagram", color: "#E4405F", icon: "📸" },
    telegram: { label: "Telegram", color: "#0088CC", icon: "✈️" },
    facebook: { label: "Facebook", color: "#1877F2", icon: "📘" },
    google: { label: "Google", color: "#4285F4", icon: "🔵" },
    tiktok: { label: "TikTok", color: "#010101", icon: "🎵" },
    youtube: { label: "YouTube", color: "#FF0000", icon: "▶️" },
    organic: { label: "Sayt orqali kirgan", color: "#22c55e", icon: "🌐" },
    direct: { label: "Bevosita kirish", color: "#8b5cf6", icon: "🔗" },
    site: { label: "Sayt ichidan", color: "#64748b", icon: "🏠" },
    test: { label: "Sinov", color: "#94a3b8", icon: "🧪" },
};

function getSourceConfig(source: string) {
    const key = source.toLowerCase();
    if (SOURCE_CONFIG[key]) return SOURCE_CONFIG[key];
    if (key.includes("instagram") || key.includes("ig")) return SOURCE_CONFIG.instagram;
    if (key.includes("telegram") || key.includes("tg")) return SOURCE_CONFIG.telegram;
    if (key.includes("facebook") || key.includes("fb") || key.includes("meta")) return SOURCE_CONFIG.facebook;
    if (key.includes("google") || key.includes("gclid")) return SOURCE_CONFIG.google;
    if (key.includes("tiktok")) return SOURCE_CONFIG.tiktok;
    if (key.includes("youtube") || key.includes("yt")) return SOURCE_CONFIG.youtube;
    return { label: source, color: "#6b7280", icon: "🌐" };
}

// ══════════════ MAIN DASHBOARD ══════════════
export default function DashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [utmTab, setUtmTab] = useState<"source" | "medium" | "campaign">("source");

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check(); window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        const fetchStats = () => {
            fetch("/api/dashboard/stats")
                .then((r) => r.json())
                .then((data) => { setStats(data); setLoading(false); })
                .catch(() => setLoading(false));
        };
        fetchStats();
        const interval = setInterval(() => {
            if (!document.hidden) fetchStats();
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const role = (session?.user as { role?: string })?.role || "";
    const ROLE_LABELS_MAP: Record<string, string> = { TEAM_ADMIN: "TeamAdmin", SUPER_ADMIN: "SuperAdmin", ADMIN: "Admin" };

    return (
        <div>
            {/* ═══ Header ═══ */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Dashboard
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
                    Xush kelibsiz, <span style={{ color: 'rgba(255,255,255,0.7)' }}>{session?.user?.name}</span>
                    {" · "}
                    <span style={{ color: '#FF2020', fontWeight: 600 }}>{ROLE_LABELS_MAP[role] || role}</span>
                </p>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ height: 100, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease infinite' }} />
                    ))}
                </div>
            ) : stats ? (
                <>
                    {/* ═══════ STAT CARDS ═══════ */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                        <StatCard label="Bugun" value={stats.today} icon="today" color="#3b82f6" />
                        <StatCard label="Shu hafta" value={stats.thisWeek} icon="week" color="#8b5cf6" />
                        <StatCard label="Shu oy" value={stats.thisMonth} icon="month" color="#f59e0b" />
                        <StatCard label="Jami" value={stats.total} icon="total" color="#FF2020" />
                    </div>

                    {/* ═══════ ROW: MANBALAR + STATUS ═══════ */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 12, marginBottom: 12 }}>
                        {/* Manbalar */}
                        <div className="card">
                            <CardHeader icon="📊" title="Mijoz qayerdan keldi?" />
                            {stats.bySource.length > 0 ? (
                                <SourceChart sources={stats.bySource} isMobile={isMobile} />
                            ) : (
                                <EmptyState text="Hali lead ma'lumotlari yo'q" />
                            )}
                        </div>

                        {/* Status donut */}
                        <div className="card">
                            <CardHeader icon="🎯" title="Ariza holatlari" />
                            {Object.entries(stats.byStatus).length > 0 ? (
                                <StatusDonut byStatus={stats.byStatus} total={stats.total} isMobile={isMobile} />
                            ) : (
                                <EmptyState text="Hali arizalar yo'q" />
                            )}
                        </div>
                    </div>

                    {/* ═══════ UTM BREAKDOWN ═══════ */}
                    {stats.utm && (
                        <div className="card" style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                <CardHeader icon="🏷" title="UTM Tahlili" />
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {(["source", "medium", "campaign"] as const).map((tab) => (
                                        <button key={tab} onClick={() => setUtmTab(tab)} style={{
                                            padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                            background: utmTab === tab ? 'rgba(255,32,32,0.15)' : 'rgba(255,255,255,0.04)',
                                            color: utmTab === tab ? '#FF2020' : 'rgba(255,255,255,0.4)',
                                            transition: 'all 0.2s',
                                        }}>
                                            {tab === "source" ? "Manba" : tab === "medium" ? "Turi" : "Aksiya nomi"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <UtmChart data={stats.utm[utmTab === "source" ? "bySource" : utmTab === "medium" ? "byMedium" : "byCampaign"]} type={utmTab} isMobile={isMobile} />
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>💡 UTM — bu reklama havolasidagi maxsus belgi. Linklar bo&apos;limidan UTM link yarating va tarqating.</p>
                        </div>
                    )}

                    {/* ═══════ ROW: SAYTLAR + ANALYTICS ═══════ */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                        {/* Saytlar */}
                        <div className="card">
                            <CardHeader icon="🌐" title="Bugun kelgan arizalar" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {stats.bySite.length > 0 ? (
                                    stats.bySite.map((site) => (
                                        <div key={site.siteId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(255,32,32,0.1), rgba(255,32,32,0.03))', border: '1px solid rgba(255,32,32,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌐</div>
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{site.domain}</p>
                                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{site.name}</p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: 20, fontWeight: 800, color: '#FF2020' }}>{site.todayCount}</span>
                                                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>bugun</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyState text="Bugun lead kelmadi" />
                                )}
                            </div>
                        </div>

                        {/* Analytics Tracking */}
                        {stats.siteAnalytics && stats.siteAnalytics.length > 0 && (
                            <div className="card">
                                <CardHeader icon="📡" title="Analytics Tracking" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {stats.siteAnalytics.map((site) => (
                                        <div key={site.domain}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{site.domain}</span>
                                                <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 6, background: site.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: site.isActive ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                                                    {site.isActive ? 'Faol' : 'Nofaol'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                                                <TrackingBadge name="Pixel" id={site.metaPixelId} color="#3b82f6" />
                                                <TrackingBadge name="Yandex" id={site.yandexId} color="#ef4444" />
                                                <TrackingBadge name="G.Ads" id={site.googleAdsTag} color="#f59e0b" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <EmptyState text="Ma'lumot yuklanmadi" />
            )}
        </div>
    );
}

// ══════════════ COMPONENTS ══════════════

function CardHeader({ icon, title }: { icon: string; title: string }) {
    return (
        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{icon}</span> {title}
        </h3>
    );
}

function EmptyState({ text }: { text: string }) {
    return <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: 32, fontStyle: 'italic' }}>{text}</p>;
}

function TrackingBadge({ name, id, color }: { name: string; id: string | null; color: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8,
            background: id ? `${color}10` : 'rgba(255,255,255,0.02)',
            border: `1px solid ${id ? `${color}30` : 'rgba(255,255,255,0.04)'}`,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: id ? color : 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: id ? color : 'rgba(255,255,255,0.25)' }}>{name}</span>
        </div>
    );
}

// ══════════════ SOURCE CHART ══════════════
function SourceChart({ sources, isMobile }: { sources: { source: string; count: number }[]; isMobile: boolean }) {
    const sorted = useMemo(() => [...sources].sort((a, b) => b.count - a.count), [sources]);
    const maxCount = sorted[0]?.count || 1;
    const totalLeads = sorted.reduce((sum, s) => sum + s.count, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map((s) => {
                const cfg = getSourceConfig(s.source);
                const pct = totalLeads > 0 ? Math.round((s.count / totalLeads) * 100) : 0;
                const barWidth = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
                return (
                    <div key={s.source}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: isMobile ? 13 : 15, width: 20, textAlign: 'center' }}>{cfg.icon}</span>
                                <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{cfg.label}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: cfg.color }}>{s.count}</span>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
                            </div>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 3, width: `${barWidth}%`,
                                background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)`,
                                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                            }} />
                        </div>
                    </div>
                );
            })}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Jami: <strong style={{ color: 'rgba(255,255,255,0.4)' }}>{totalLeads}</strong></span>
            </div>
        </div>
    );
}

// ══════════════ UTM CHART ══════════════
function UtmChart({ data, type, isMobile }: { data: UtmBreakdown[]; type: string; isMobile: boolean }) {
    if (!data || data.length === 0) return <EmptyState text="UTM ma'lumotlari yo'q" />;

    const colors = ["#FF2020", "#3b82f6", "#f59e0b", "#22c55e", "#a855f7", "#ec4899", "#0088CC", "#8b5cf6"];
    const total = data.reduce((s, d) => s + d.count, 0);
    const maxCount = data[0]?.count || 1;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.slice(0, 8).map((item, i) => {
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                const barW = (item.count / maxCount) * 100;
                const color = colors[i % colors.length];
                return (
                    <div key={item.value}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>{item.value}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color }}>{item.count}</span>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
                            </div>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 3, width: `${barW}%`,
                                background: `linear-gradient(90deg, ${color}, ${color}77)`,
                                transition: 'width 0.6s ease',
                            }} />
                        </div>
                    </div>
                );
            })}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                    {type === "source" ? "utm_source" : type === "medium" ? "utm_medium" : "utm_campaign"} · {data.length} ta
                </span>
            </div>
        </div>
    );
}

// ══════════════ STATUS DONUT ══════════════
function StatusDonut({ byStatus, total, isMobile }: { byStatus: Record<string, number>; total: number; isMobile: boolean }) {
    const statuses = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
    const radius = 55;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const segments = statuses.map(([status, count]) => {
        const pct = total > 0 ? count / total : 0;
        const dashLength = circumference * pct;
        const seg = { status, count, pct, dashLength, offset, color: STATUS_COLORS[status] || "#666" };
        offset += dashLength;
        return seg;
    });

    return (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? 12 : 20 }}>
            <div style={{ flexShrink: 0 }}>
                <svg width={isMobile ? 110 : 130} height={isMobile ? 110 : 130} viewBox="0 0 140 140" style={{ display: 'block', margin: '0 auto' }}>
                    <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="14" />
                    {segments.map((seg) => (
                        <circle key={seg.status} cx="70" cy="70" r={radius} fill="none"
                            stroke={seg.color} strokeWidth="14" strokeLinecap="round"
                            strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                            strokeDashoffset={-seg.offset}
                            transform="rotate(-90 70 70)"
                            style={{ transition: 'all 0.8s ease' }}
                        />
                    ))}
                    <text x="70" y="66" textAnchor="middle" fill="white" fontSize="22" fontWeight="800">{total}</text>
                    <text x="70" y="82" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="600">JAMI</text>
                </svg>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {statuses.map(([status, count]) => {
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                        <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[status] || "#666" }} />
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{STATUS_LABELS[status] || status}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{count}</span>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{pct}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ══════════════ STAT CARD ══════════════
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
    return (
        <div className="stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, width: 50, height: 50, borderRadius: '50%', opacity: 0.06, background: color, filter: 'blur(20px)' }} />
            <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <StatIcon type={icon} color={color} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                </div>
                <p style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, margin: 0 }}>{value}</p>
            </div>
        </div>
    );
}

function StatIcon({ type, color }: { type: string; color: string }) {
    const s = { width: 14, height: 14, color };
    switch (type) {
        case "today": return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>);
        case "week": return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>);
        case "month": return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>);
        case "total": return (<svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>);
        default: return null;
    }
}

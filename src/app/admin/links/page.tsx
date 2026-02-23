"use client";

import { useEffect, useState, useMemo } from "react";

// ═══════════════ SOURCE CONFIG ═══════════════
const SOURCES: Record<string, { label: string; color: string; icon: string }> = {
    organic: { label: "Sayt orqali kirgan", color: "#22c55e", icon: "🌱" },
    instagram: { label: "Instagram", color: "#E4405F", icon: "📸" },
    telegram: { label: "Telegram", color: "#0088CC", icon: "✈️" },
    facebook: { label: "Meta / Facebook", color: "#1877F2", icon: "📘" },
    google: { label: "Google Ads", color: "#4285F4", icon: "🔍" },
    google_ads: { label: "Google Ads", color: "#4285F4", icon: "🔍" },
    whatsapp: { label: "WhatsApp", color: "#25D366", icon: "💬" },
    tiktok: { label: "TikTok", color: "#000000", icon: "🎵" },
    youtube: { label: "YouTube", color: "#FF0000", icon: "▶️" },
    email: { label: "Email", color: "#f59e0b", icon: "📧" },
    qr_code: { label: "QR Kod", color: "#8b5cf6", icon: "📱" },
    twitter: { label: "Twitter / X", color: "#1DA1F2", icon: "🐦" },
    linkedin: { label: "LinkedIn", color: "#0A66C2", icon: "💼" },
    yandex: { label: "Yandex", color: "#FF0000", icon: "🔴" },
    direct: { label: "Bevosita kirish", color: "#94a3b8", icon: "🔗" },
};

function getSource(key: string) {
    const k = key?.toLowerCase() || "organic";
    return SOURCES[k] || { label: key || "Noma'lum", color: "#64748b", icon: "⚪" };
}

// ═══════════════ UTM PRESETS ═══════════════
const UTM_SOURCES = [
    { value: "instagram", label: "📸 Instagram" },
    { value: "telegram", label: "✈️ Telegram" },
    { value: "facebook", label: "📘 Facebook" },
    { value: "google_ads", label: "🔍 Google Ads" },
    { value: "whatsapp", label: "💬 WhatsApp" },
    { value: "tiktok", label: "🎵 TikTok" },
    { value: "youtube", label: "▶️ YouTube" },
    { value: "email", label: "📧 Email" },
    { value: "qr_code", label: "📱 QR Kod" },
    { value: "twitter", label: "🐦 Twitter / X" },
    { value: "linkedin", label: "💼 LinkedIn" },
    { value: "yandex", label: "🔴 Yandex" },
];

const UTM_MEDIUMS = [
    { value: "social", label: "Ijtimoiy tarmoq (bepul post)" },
    { value: "cpc", label: "Bosish uchun to'lov (reklama)" },
    { value: "cpm", label: "Ko'rish uchun to'lov (banner)" },
    { value: "referral", label: "Tavsiya (referal)" },
    { value: "email", label: "Email xabar" },
    { value: "qr", label: "QR Kod" },
    { value: "messenger", label: "Messenger xabar" },
    { value: "video", label: "Video reklama" },
    { value: "story", label: "Story / Reels" },
];

// ═══════════════ TYPES ═══════════════
interface SourceStat { source: string; count: number; percent: number }
interface UtmStat { source: string; medium: string | null; campaign: string | null; count: number }
interface TrendItem { date: string; total: number;[key: string]: string | number }
interface Site { id: string; domain: string; name: string; metaPixelId?: string | null; googleAdsTag?: string | null; yandexId?: string | null }

type Tab = "generator" | "traffic" | "analytics";

// ═══════════════ MAIN PAGE ═══════════════
export default function LinksPage() {
    const [tab, setTab] = useState<Tab>("generator");
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedSite, setSelectedSite] = useState("");
    const [period, setPeriod] = useState("month");
    const [stats, setStats] = useState<{ total: number; bySource: SourceStat[]; byUtm: UtmStat[]; trend: TrendItem[] } | null>(null);
    const [loading, setLoading] = useState(false);

    // Saytlarni olish
    useEffect(() => {
        fetch("/api/sites").then(r => r.json()).then(data => {
            const s = Array.isArray(data) ? data : data.sites || [];
            setSites(s);
            if (s.length > 0 && !selectedSite) setSelectedSite(s[0].id);
        }).catch(() => { });
    }, []);

    // Statistika olish
    useEffect(() => {
        if (tab !== "traffic" && tab !== "analytics") return;
        setLoading(true);
        const params = new URLSearchParams({ period });
        if (selectedSite) params.set("siteId", selectedSite);
        fetch(`/api/links/stats?${params}`).then(r => r.json()).then(d => {
            setStats(d);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [tab, selectedSite, period]);

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: "generator", label: "UTM Generator", icon: "🔗" },
        { key: "traffic", label: "Trafik", icon: "📊" },
        { key: "analytics", label: "Analytics", icon: "📈" },
    ];

    return (
        <div style={{ padding: "0" }}>
            {/* ── Global styles for dark theme selects + responsive ── */}
            <style>{`
                .links-select,
                .links-input {
                    padding: 12px 16px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: #12121a;
                    color: #e0e0e0;
                    font-size: 14px;
                    outline: none;
                    width: 100%;
                    transition: border-color 0.2s;
                    -webkit-appearance: none;
                    appearance: none;
                }
                .links-select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 14px center;
                    padding-right: 36px;
                }
                .links-select:focus,
                .links-input:focus {
                    border-color: #FF2020;
                }
                .links-select option {
                    background: #12121a;
                    color: #e0e0e0;
                    padding: 8px;
                }
                .links-filter-select {
                    padding: 8px 14px;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: #12121a;
                    color: #e0e0e0;
                    font-size: 13px;
                    outline: none;
                    -webkit-appearance: none;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 10px center;
                    padding-right: 28px;
                }
                .links-filter-select option {
                    background: #12121a;
                    color: #e0e0e0;
                }
                .links-grid-2 {
                    display: grid;
                    gap: 24px;
                    grid-template-columns: 1fr 1fr;
                }
                .links-grid-3 {
                    display: grid;
                    gap: 20px;
                    grid-template-columns: 1fr 1fr 1fr;
                }
                .links-grid-full {
                    grid-column: 1 / -1;
                }
                @media (max-width: 768px) {
                    .links-grid-2,
                    .links-grid-3 {
                        grid-template-columns: 1fr !important;
                    }
                    .links-select, .links-input, .links-filter-select {
                        font-size: 16px !important;
                        padding: 12px 14px !important;
                        border-radius: 10px !important;
                        min-height: 48px;
                        -webkit-appearance: none;
                        appearance: none;
                    }
                    .links-select {
                        padding-right: 32px !important;
                        background-size: 12px !important;
                        background-position: right 12px center !important;
                    }
                    .links-tabs-wrap {
                        width: 100% !important;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    .links-tabs-wrap button {
                        white-space: nowrap;
                        padding: 10px 14px !important;
                        font-size: 12px !important;
                    }
                    .saved-link-card {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 10px !important;
                        padding: 14px !important;
                    }
                    .saved-link-info p {
                        white-space: normal !important;
                        overflow: visible !important;
                        text-overflow: unset !important;
                        word-break: break-all !important;
                    }
                    .saved-link-actions {
                        width: 100% !important;
                        justify-content: space-between !important;
                        border-top: 1px solid rgba(255,255,255,0.06);
                        padding-top: 10px !important;
                        margin-top: 2px;
                    }
                }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Linklar</h1>
                <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                    UTM linklar yarating va trafik manbalarini kuzating
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: "flex", gap: 4, marginBottom: 24, padding: 4,
                background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--border)",
            }} className="links-tabs-wrap">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                            fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                            background: tab === t.key ? "#FF2020" : "transparent",
                            color: tab === t.key ? "#fff" : "var(--muted)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {tab === "generator" && <UtmGeneratorTab sites={sites} />}
            {tab === "traffic" && (
                <TrafficTab
                    stats={stats} loading={loading}
                    sites={sites} selectedSite={selectedSite} setSelectedSite={setSelectedSite}
                    period={period} setPeriod={setPeriod}
                />
            )}
            {tab === "analytics" && (
                <AnalyticsTab
                    sites={sites} selectedSite={selectedSite} setSelectedSite={setSelectedSite}
                    stats={stats} loading={loading}
                    period={period} setPeriod={setPeriod}
                />
            )}
        </div>
    );
}

// ═══════════════ TAB 1: UTM GENERATOR ═══════════════
interface SavedLink {
    id: string;
    url: string;
    source: string;
    medium: string | null;
    campaign: string | null;
    lowPower: boolean;
    clicks: number;
    createdAt: string;
    site: { domain: string; name: string };
}

function UtmGeneratorTab({ sites }: { sites: Site[] }) {
    const [siteId, setSiteId] = useState("");
    const [source, setSource] = useState("");
    const [medium, setMedium] = useState("");
    const [campaign, setCampaign] = useState("");
    const [customSource, setCustomSource] = useState("");
    const [lowPower, setLowPower] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
    const [linksLoading, setLinksLoading] = useState(true);

    useEffect(() => {
        if (sites.length > 0 && !siteId) setSiteId(sites[0].id);
    }, [sites, siteId]);

    // Saqlangan linklar ro'yxatini olish
    useEffect(() => {
        setLinksLoading(true);
        fetch("/api/links/generated")
            .then(r => r.json())
            .then(data => {
                setSavedLinks(Array.isArray(data) ? data : []);
                setLinksLoading(false);
            })
            .catch(() => setLinksLoading(false));
    }, []);

    const site = sites.find(s => s.id === siteId);
    const actualSource = source === "__custom" ? customSource : source;

    const generatedLink = useMemo(() => {
        if (!site || !actualSource) return "";
        const base = `https://${site.domain}`;
        const params = new URLSearchParams();
        params.set("utm_source", actualSource);
        if (medium) params.set("utm_medium", medium);
        if (campaign) params.set("utm_campaign", campaign);
        if (lowPower) params.set("low", "1");
        return `${base}?${params.toString()}`;
    }, [site, actualSource, medium, campaign, lowPower]);

    const handleCopy = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!generatedLink || !siteId || !actualSource) return;
        setSaving(true);
        try {
            await fetch("/api/links/generated", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    siteId, url: generatedLink, source: actualSource,
                    medium: medium || null, campaign: campaign || null, lowPower,
                }),
            });
            const res = await fetch("/api/links/generated");
            const data = await res.json();
            setSavedLinks(Array.isArray(data) ? data : []);
        } catch { /* ignore */ }
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleDelete = async (id: string) => {
        await fetch(`/api/links/generated?id=${id}`, { method: "DELETE" });
        setSavedLinks(prev => prev.filter(l => l.id !== id));
    };

    const handleCopyLink = (url: string) => {
        navigator.clipboard.writeText(url);
    };

    const handleToggleLow = async (id: string, currentLow: boolean) => {
        try {
            const res = await fetch("/api/links/generated", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, lowPower: !currentLow }),
            });
            const updated = await res.json();
            if (updated.id) {
                setSavedLinks(prev => prev.map(l => l.id === id ? updated : l));
            }
        } catch { /* ignore */ }
    };

    const getSourceIcon = (src: string) => {
        const icons: Record<string, string> = {
            instagram: "📸", telegram: "✈️", facebook: "📘", google: "🔍",
            tiktok: "🎵", youtube: "▶️", linkedin: "💼", yandex: "🔴",
        };
        return icons[src] || "🔗";
    };

    const timeAgo = (dateStr: string) => {
        const now = new Date();
        const d = new Date(dateStr);
        const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
        if (diff < 60) return "hozirgina";
        if (diff < 3600) return `${Math.floor(diff / 60)} daq oldin`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;
        return d.toLocaleDateString("uz");
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 6, display: "block",
    };

    return (
        <div style={{ maxWidth: 900 }}>
            <div className="links-grid-2">
                {/* Sol — Form */}
                <div style={{
                    background: "var(--card-bg)", borderRadius: 16, padding: 24,
                    border: "1px solid var(--border)",
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
                            🔗 Link yaratish
                        </h3>
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            style={{
                                width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer',
                                background: showHelp ? 'rgba(255,32,32,0.15)' : 'rgba(255,255,255,0.08)',
                                color: showHelp ? '#FF2020' : 'rgba(255,255,255,0.5)',
                                fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                            title="Bu nima?"
                        >?</button>
                    </div>

                    {/* Tooltip tushuntirish */}
                    {showHelp && (
                        <div style={{
                            background: 'rgba(255,32,32,0.04)', border: '1px solid rgba(255,32,32,0.12)',
                            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                            fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8,
                        }}>
                            <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: 'var(--foreground)', fontSize: 12 }}>💡 Bu nima uchun kerak?</p>
                            Bu link <b>qayerdan kelganini eslab qoladi</b>.<br />
                            <span style={{ color: '#FF2020' }}>📡 Manba</span> — mijoz qayerdan keldi? (Instagram, Telegram...)<br />
                            <span style={{ color: '#3b82f6' }}>📺 Tur</span> — qanday reklama? (post, story...)<br />
                            <span style={{ color: '#f59e0b' }}>🏷 Aksiya</span> — qaysi aksiya uchun?<br /><br />
                            <b>Misol:</b> Instagram — 10 kishi, Telegram — 25 kishi.<br />
                            Siz ko&apos;rasiz: <b>Telegram 2.5x ko&apos;proq olib keldi!</b>
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Sayt */}
                        <div>
                            <label style={labelStyle}>🌐 Sayt</label>
                            <select className="links-select" value={siteId} onChange={e => setSiteId(e.target.value)}>
                                {sites.map(s => (
                                    <option key={s.id} value={s.id}>{s.domain} — {s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Manba */}
                        <div>
                            <label style={labelStyle}>📡 Qayerdan keladi?</label>
                            <select className="links-select" value={source} onChange={e => setSource(e.target.value)}>
                                <option value="">Tanlang...</option>
                                {UTM_SOURCES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                                <option value="__custom">✍️ Boshqa (o&apos;z qiymat)</option>
                            </select>
                            {source === "__custom" && (
                                <input
                                    className="links-input"
                                    value={customSource} onChange={e => setCustomSource(e.target.value)}
                                    placeholder="Masalan: my_blog" style={{ marginTop: 8 }}
                                />
                            )}
                        </div>

                        {/* Medium */}
                        <div>
                            <label style={labelStyle}>📺 Qanday turdagi reklama?</label>
                            <select className="links-select" value={medium} onChange={e => setMedium(e.target.value)}>
                                <option value="">Tanlang (ixtiyoriy)...</option>
                                {UTM_MEDIUMS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Kampaniya */}
                        <div>
                            <label style={labelStyle}>🏷 Aksiya / Reklama nomi</label>
                            <input
                                className="links-input"
                                value={campaign} onChange={e => setCampaign(e.target.value)}
                                placeholder="Masalan: bahor_aksiya"
                            />
                        </div>

                        {/* ⚡ Low Power Mode */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: lowPower ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${lowPower ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: 12, padding: '12px 16px', transition: 'all 0.3s',
                        }}>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: lowPower ? '#f59e0b' : 'var(--muted)', margin: 0 }}>
                                    ⚡ Kam quvvat rejimi
                                </p>
                                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0 0', opacity: 0.7 }}>
                                    Sayt animatsiyasiz ochiladi — tez yuklanadi
                                </p>
                            </div>
                            <button onClick={() => setLowPower(!lowPower)} style={{
                                position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                                background: lowPower ? '#f59e0b' : 'rgba(255,255,255,0.10)', transition: 'background 0.2s', flexShrink: 0,
                            }}>
                                <span style={{
                                    position: 'absolute', top: 2, left: lowPower ? 22 : 2,
                                    width: 20, height: 20, borderRadius: 10, background: 'white',
                                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                }} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* O'ng — Natija */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Generated Link */}
                    <div style={{
                        background: "var(--card-bg)", borderRadius: 16, padding: 24,
                        border: "1px solid var(--border)",
                    }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginTop: 0, marginBottom: 16 }}>
                            📋 Yaratilgan link
                        </h3>

                        {generatedLink ? (
                            <>
                                <div style={{
                                    background: "rgba(255,32,32,0.06)", border: "1px solid rgba(255,32,32,0.15)",
                                    borderRadius: 10, padding: "14px 16px", wordBreak: "break-all",
                                    fontSize: 13, color: "var(--foreground)", lineHeight: 1.6,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                }}>
                                    {generatedLink}
                                </div>

                                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                    <button onClick={handleCopy} style={{
                                        flex: 1, padding: "12px",
                                        borderRadius: 10, border: "none", cursor: "pointer",
                                        background: copied ? "#22c55e" : "#FF2020",
                                        color: "#fff", fontWeight: 700, fontSize: 14,
                                        transition: "all 0.3s",
                                    }}>
                                        {copied ? "✅ Nusxalandi!" : "📋 Nusxalash"}
                                    </button>
                                    <button onClick={handleSave} disabled={saving} style={{
                                        padding: "12px 20px",
                                        borderRadius: 10, border: "1px solid rgba(255,32,32,0.3)", cursor: "pointer",
                                        background: "rgba(255,32,32,0.1)",
                                        color: "#FF2020", fontWeight: 700, fontSize: 14,
                                        transition: "all 0.3s", opacity: saving ? 0.5 : 1,
                                    }}>
                                        {saving ? "..." : "💾 Saqlash"}
                                    </button>
                                </div>

                                {saved && (
                                    <div style={{
                                        marginTop: 8, padding: '8px 14px', borderRadius: 8,
                                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                                        color: '#22c55e', fontSize: 12, fontWeight: 600, textAlign: 'center',
                                    }}>
                                        ✅ Link muvaffaqiyatli saqlandi!
                                    </div>
                                )}
                            </>
                        ) : (
                            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
                                Manba tanlang — link avtomatik yaratiladi
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════ Saqlangan linklar tarixi ═══════ */}
            <div style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginBottom: 16 }}>
                    📂 Saqlangan linklar
                    <span style={{ fontSize: 12, fontWeight: 400, color: "var(--muted)", marginLeft: 8 }}>
                        ({savedLinks.length} ta)
                    </span>
                </h3>

                {linksLoading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Yuklanmoqda...</div>
                ) : savedLinks.length === 0 ? (
                    <div style={{
                        background: "var(--card-bg)", borderRadius: 16, padding: 40,
                        border: "1px solid var(--border)", textAlign: "center",
                    }}>
                        <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
                            Hali link saqlanmagan. Yuqorida link yaratib 💾 Saqlash tugmasini bosing.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {savedLinks.map(link => (
                            <div key={link.id} className="saved-link-card" style={{
                                background: "var(--card-bg)", borderRadius: 12, padding: "14px 16px",
                                border: "1px solid var(--border)",
                                display: "flex", alignItems: "center", gap: 12,
                                transition: "border-color 0.2s",
                            }}>
                                {/* Source icon */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                    background: "rgba(255,32,32,0.08)", display: "flex",
                                    alignItems: "center", justifyContent: "center", fontSize: 16,
                                }}>
                                    {getSourceIcon(link.source)}
                                </div>

                                {/* Info */}
                                <div className="saved-link-info" style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontSize: 13, fontWeight: 600, margin: 0,
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        color: "var(--foreground)",
                                    }}>
                                        {link.site.domain}
                                        <span style={{ color: "var(--muted)", fontWeight: 400 }}> · {link.source}</span>
                                        {link.medium && <span style={{ color: "var(--muted)", fontWeight: 400 }}> / {link.medium}</span>}
                                    </p>
                                    {link.campaign && (
                                        <p style={{ fontSize: 11, color: "#f59e0b", margin: "2px 0 0 0", fontWeight: 500 }}>
                                            🏷 {link.campaign}
                                        </p>
                                    )}
                                    <p style={{
                                        fontSize: 10, color: "var(--muted)", margin: "2px 0 0 0",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        fontFamily: "'JetBrains Mono', monospace", opacity: 0.6,
                                    }}>
                                        {link.url}
                                    </p>
                                </div>

                                {/* Actions row */}
                                <div className="saved-link-actions" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                    <button
                                        onClick={() => handleToggleLow(link.id, link.lowPower)}
                                        title={link.lowPower ? "LOW yoqilgan" : "LOW o'chirilgan"}
                                        style={{
                                            padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                                            cursor: "pointer", transition: "all 0.2s", border: "none",
                                            color: link.lowPower ? '#f59e0b' : 'rgba(255,255,255,0.25)',
                                            background: link.lowPower ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                                        }}
                                    >
                                        {link.lowPower ? '⚡ LOW' : '⚡'}
                                    </button>
                                    <span style={{
                                        padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                                        color: "var(--muted)", background: "rgba(255,255,255,0.04)",
                                    }}>
                                        {timeAgo(link.createdAt)}
                                    </span>
                                    <button onClick={() => handleCopyLink(link.url)} title="Nusxalash" style={{
                                        width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                                        background: "rgba(255,255,255,0.04)", color: "var(--muted)",
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                                    }}>📋</button>
                                    <button onClick={() => handleDelete(link.id)} title="O'chirish" style={{
                                        width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                                        background: "rgba(239,68,68,0.06)", color: "#ef4444",
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                                    }}>🗑</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}

// ═══════════════ TAB 2: TRAFIK ═══════════════
function TrafficTab({ stats, loading, sites, selectedSite, setSelectedSite, period, setPeriod }: {
    stats: { total: number; bySource: SourceStat[]; byUtm: UtmStat[]; trend: TrendItem[] } | null;
    loading: boolean; sites: Site[]; selectedSite: string; setSelectedSite: (v: string) => void;
    period: string; setPeriod: (v: string) => void;
}) {
    const periods = [
        { value: "today", label: "Bugun" },
        { value: "week", label: "Hafta" },
        { value: "month", label: "Oy" },
        { value: "all", label: "Barchasi" },
    ];

    const maxCount = stats?.bySource ? Math.max(...stats.bySource.map(s => s.count), 1) : 1;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Filters */}
            <div style={{
                display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
                background: "var(--card-bg)", borderRadius: 12, padding: "12px 16px",
                border: "1px solid var(--border)",
            }}>
                <select className="links-filter-select" value={selectedSite} onChange={e => setSelectedSite(e.target.value)}>
                    <option value="">Barcha saytlar</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.domain}</option>)}
                </select>

                <div style={{ display: "flex", gap: 4, padding: 3, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                    {periods.map(p => (
                        <button key={p.value} onClick={() => setPeriod(p.value)} style={{
                            padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                            fontSize: 12, fontWeight: 600,
                            background: period === p.value ? "#FF2020" : "transparent",
                            color: period === p.value ? "#fff" : "var(--muted)",
                            transition: "all 0.2s",
                        }}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {stats && (
                    <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                        Jami: <span style={{ color: "#FF2020" }}>{stats.total}</span> ariza
                    </span>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Yuklanmoqda...</div>
            ) : stats ? (
                <div className="links-grid-2">
                    {/* Manba bo'yicha arizalar */}
                    <div style={{
                        background: "var(--card-bg)", borderRadius: 16, padding: 24,
                        border: "1px solid var(--border)",
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginTop: 0, marginBottom: 20 }}>
                            📡 Manbalar bo'yicha arizalar
                        </h3>

                        {stats.bySource.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {stats.bySource.map(s => {
                                    const cfg = getSource(s.source);
                                    const barWidth = (s.count / maxCount) * 100;
                                    return (
                                        <div key={s.source}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                                                    {cfg.icon} {cfg.label}
                                                </span>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>
                                                    {s.count} <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>{s.percent}%</span>
                                                </span>
                                            </div>
                                            <div style={{
                                                height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3,
                                                overflow: "hidden",
                                            }}>
                                                <div style={{
                                                    height: "100%", width: `${barWidth}%`, background: cfg.color,
                                                    borderRadius: 3, transition: "width 0.5s ease",
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p style={{ color: "var(--muted)", fontSize: 13 }}>Hali ma&apos;lumot yo&apos;q</p>
                        )}
                    </div>

                    {/* UTM tafsilot */}
                    <div style={{
                        background: "var(--card-bg)", borderRadius: 16, padding: 24,
                        border: "1px solid var(--border)",
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginTop: 0, marginBottom: 20 }}>
                            🏷 UTM kampaniyalar
                        </h3>

                        {stats.byUtm.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {stats.byUtm.map((u, i) => {
                                    const cfg = getSource(u.source || "");
                                    return (
                                        <div key={i} style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "10px 14px", borderRadius: 10,
                                            background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                                        }}>
                                            <div>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                                                    {cfg.icon} {u.source}
                                                </span>
                                                {u.medium && (
                                                    <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>/ {u.medium}</span>
                                                )}
                                                {u.campaign && (
                                                    <span style={{ fontSize: 11, color: "#FF2020", marginLeft: 6 }}>#{u.campaign}</span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>{u.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p style={{ color: "var(--muted)", fontSize: 13 }}>UTM bilan kelgan arizalar hali yo&apos;q</p>
                        )}
                    </div>

                    {/* 30 kunlik trend */}
                    <div className="links-grid-full" style={{
                        background: "var(--card-bg)", borderRadius: 16, padding: 24,
                        border: "1px solid var(--border)",
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginTop: 0, marginBottom: 20 }}>
                            📈 Oxirgi 30 kun trend
                        </h3>
                        <TrendChart trend={stats.trend} />
                    </div>
                </div>
            ) : null}

            <style>{`
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: 1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}

// ═══════════════ TREND CHART (CSS bars) ═══════════════
function TrendChart({ trend }: { trend: TrendItem[] }) {
    if (!trend?.length) return <p style={{ color: "var(--muted)", fontSize: 13 }}>Ma&apos;lumot yo&apos;q</p>;

    const maxVal = Math.max(...trend.map(t => t.total), 1);

    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120, overflow: "hidden" }}>
            {trend.map((t, i) => {
                const h = (t.total / maxVal) * 100;
                const day = new Date(t.date);
                const label = `${day.getDate()}/${day.getMonth() + 1}`;
                return (
                    <div key={i} style={{
                        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                        position: "relative", cursor: "pointer",
                    }} title={`${label}: ${t.total} lead`}>
                        <div style={{
                            width: "100%", maxWidth: 18, height: `${Math.max(h, 2)}%`, minHeight: 2,
                            background: t.total > 0
                                ? "linear-gradient(to top, rgba(255,32,32,0.3), #FF2020)"
                                : "rgba(255,255,255,0.04)",
                            borderRadius: "4px 4px 0 0", transition: "height 0.3s ease",
                        }} />
                        {i % 5 === 0 && (
                            <span style={{
                                fontSize: 9, color: "var(--muted)", marginTop: 4,
                                whiteSpace: "nowrap",
                            }}>{label}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ═══════════════ TAB 3: ANALYTICS ═══════════════
function AnalyticsTab({ sites, selectedSite, setSelectedSite, stats, loading, period, setPeriod }: {
    sites: Site[]; selectedSite: string; setSelectedSite: (v: string) => void;
    stats: { total: number; bySource: SourceStat[]; byUtm: UtmStat[]; trend: TrendItem[] } | null;
    loading: boolean; period: string; setPeriod: (v: string) => void;
}) {
    const site = sites.find(s => s.id === selectedSite);

    const periods = [
        { value: "today", label: "Bugun" },
        { value: "week", label: "Hafta" },
        { value: "month", label: "Oy" },
        { value: "all", label: "Barchasi" },
    ];

    // Manbalar bo'yicha kartalar uchun ma'lumot
    const metaLeads = stats?.bySource.find(s =>
        ["facebook", "instagram", "meta"].includes(s.source?.toLowerCase() || "")
    )?.count || 0;
    const googleLeads = stats?.bySource.find(s =>
        ["google", "google_ads"].includes(s.source?.toLowerCase() || "")
    )?.count || 0;
    const yandexLeads = stats?.bySource.find(s =>
        s.source?.toLowerCase() === "yandex"
    )?.count || 0;

    const cardStyle: React.CSSProperties = {
        background: "var(--card-bg)", borderRadius: 16, padding: 24,
        border: "1px solid var(--border)",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Site filter */}
            <div style={{
                display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
                background: "var(--card-bg)", borderRadius: 12, padding: "12px 16px",
                border: "1px solid var(--border)",
            }}>
                <select className="links-filter-select" value={selectedSite} onChange={e => setSelectedSite(e.target.value)}>
                    <option value="">Barcha saytlar</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.domain}</option>)}
                </select>

                <div style={{ display: "flex", gap: 4, padding: 3, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                    {periods.map(p => (
                        <button key={p.value} onClick={() => setPeriod(p.value)} style={{
                            padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                            fontSize: 12, fontWeight: 600,
                            background: period === p.value ? "#FF2020" : "transparent",
                            color: period === p.value ? "#fff" : "var(--muted)",
                            transition: "all 0.2s",
                        }}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Yuklanmoqda...</div>
            ) : (
                <div className="links-grid-3">
                    {/* Meta Pixel */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: "linear-gradient(135deg, #1877F2, #E4405F)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 18,
                            }}>📘</div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Meta Pixel</h4>
                                <span style={{ fontSize: 11, color: "var(--muted)" }}>Facebook + Instagram</span>
                            </div>
                        </div>

                        <div style={{ fontSize: 28, fontWeight: 800, color: "#1877F2", marginBottom: 4 }}>{metaLeads}</div>
                        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>lead (Meta manbalardan)</p>

                        {site?.metaPixelId ? (
                            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>
                                Pixel ID: <code style={{ color: "#1877F2" }}>{site.metaPixelId}</code>
                            </div>
                        ) : null}

                        <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" style={{
                            display: "block", padding: "10px", borderRadius: 8, textAlign: "center",
                            background: "rgba(24,119,242,0.1)", color: "#1877F2",
                            fontSize: 12, fontWeight: 600, textDecoration: "none",
                            border: "1px solid rgba(24,119,242,0.2)",
                        }}>
                            Facebook Ads Manager →
                        </a>
                    </div>

                    {/* Google Ads */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: "linear-gradient(135deg, #4285F4, #34A853)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 18,
                            }}>🔍</div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Google Ads</h4>
                                <span style={{ fontSize: 11, color: "var(--muted)" }}>Search + Display</span>
                            </div>
                        </div>

                        <div style={{ fontSize: 28, fontWeight: 800, color: "#4285F4", marginBottom: 4 }}>{googleLeads}</div>
                        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>lead (Google manbalardan)</p>

                        {site?.googleAdsTag ? (
                            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>
                                Tag: <code style={{ color: "#4285F4" }}>{site.googleAdsTag}</code>
                            </div>
                        ) : null}

                        <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer" style={{
                            display: "block", padding: "10px", borderRadius: 8, textAlign: "center",
                            background: "rgba(66,133,244,0.1)", color: "#4285F4",
                            fontSize: 12, fontWeight: 600, textDecoration: "none",
                            border: "1px solid rgba(66,133,244,0.2)",
                        }}>
                            Google Ads Console →
                        </a>
                    </div>

                    {/* Yandex Metrica */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: "linear-gradient(135deg, #FF0000, #FC0)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 18,
                            }}>🔴</div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Yandex Metrica</h4>
                                <span style={{ fontSize: 11, color: "var(--muted)" }}>WebVisor + Heatmap</span>
                            </div>
                        </div>

                        <div style={{ fontSize: 28, fontWeight: 800, color: "#FF0000", marginBottom: 4 }}>{yandexLeads}</div>
                        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>lead (Yandex manbalardan)</p>

                        {site?.yandexId ? (
                            <>
                                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>
                                    Counter: <code style={{ color: "#FF0000" }}>{site.yandexId}</code>
                                </div>
                                <a href={`https://metrica.yandex.com/dashboard?id=${site.yandexId}`} target="_blank" rel="noopener noreferrer" style={{
                                    display: "block", padding: "10px", borderRadius: 8, textAlign: "center",
                                    background: "rgba(255,0,0,0.08)", color: "#FF0000",
                                    fontSize: 12, fontWeight: 600, textDecoration: "none",
                                    border: "1px solid rgba(255,0,0,0.2)", marginBottom: 8,
                                }}>
                                    📊 Yandex Dashboard →
                                </a>
                                <a href={`https://metrica.yandex.com/dashboard?id=${site.yandexId}&report=webvisor`} target="_blank" rel="noopener noreferrer" style={{
                                    display: "block", padding: "10px", borderRadius: 8, textAlign: "center",
                                    background: "rgba(255,0,0,0.04)", color: "#FF6666",
                                    fontSize: 12, fontWeight: 600, textDecoration: "none",
                                    border: "1px solid rgba(255,0,0,0.12)",
                                }}>
                                    🎥 WebVisor (foydalanuvchi harakatlari) →
                                </a>
                            </>
                        ) : (
                            <p style={{ fontSize: 11, color: "var(--muted)" }}>
                                Yandex Metrica Counter ID sozlanmagan. Saytlar bo&apos;limidan qo&apos;shing.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Yandex Metrica iframe (agar counter bor bo'lsa) */}
            {site?.yandexId && (
                <div style={{
                    background: "var(--card-bg)", borderRadius: 16, padding: 24,
                    border: "1px solid var(--border)",
                }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginTop: 0, marginBottom: 16 }}>
                        🎥 Yandex Metrica — WebVisor
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                        Foydalanuvchilar saytda nima qilganini real vaqtda ko&apos;ring
                    </p>
                    <div style={{
                        borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)",
                        background: "#fff", height: 600,
                    }}>
                        <iframe
                            src={`https://metrica.yandex.com/dashboard?id=${site.yandexId}`}
                            style={{ width: "100%", height: "100%", border: "none" }}
                            sandbox="allow-scripts allow-same-origin allow-popups"
                            title="Yandex Metrica Dashboard"
                        />
                    </div>
                </div>
            )}

        </div>
    );
}

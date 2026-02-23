"use client";

import { useEffect, useState } from "react";

interface Site {
    id: string;
    domain: string;
    name: string;
    isActive: boolean;
    metaPixelId: string | null;
    yandexId: string | null;
    googleAdsTag: string | null;
    createdAt: string;
    _count: { leads: number; users: number };
}

export default function SitesPage() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editSite, setEditSite] = useState<Site | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check(); window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const fetchSites = () => {
        setLoading(true);
        fetch("/api/sites").then((r) => r.json()).then((data) => { setSites(data); setLoading(false); });
    };
    useEffect(() => { fetchSites(); }, []);

    const toggleActive = async (id: string, isActive: boolean) => {
        await fetch(`/api/sites/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
        fetchSites();
    };

    const deleteSite = async (id: string, domain: string) => {
        if (!confirm(`"${domain}" saytini o'chirmoqchimisiz? Bu saytga tegishli barcha arizalar ham o'chiriladi!`)) return;
        await fetch(`/api/sites/${id}`, { method: "DELETE" });
        fetchSites();
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Saytlar</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Jami: {sites.length} ta sayt</p>
                </div>
                <button onClick={() => setShowCreate(true)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12,
                    fontSize: 14, fontWeight: 600, color: 'white', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #FF2020, #cc1a1a)', boxShadow: '0 4px 16px rgba(255,32,32,0.25)',
                }}>
                    <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    Yangi sayt
                </button>
            </div>

            {/* Sites grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                {loading ? (
                    [1, 2].map((i) => <div key={i} className="card" style={{ height: 176, opacity: 0.5 }} />)
                ) : sites.length === 0 ? (
                    <div className="card" style={{ gridColumn: 'span 2', padding: 48, textAlign: 'center' }}>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Saytlar yo&apos;q</p>
                    </div>
                ) : (
                    sites.map((site) => (
                        <div key={site.id} className="card" style={{ padding: isMobile ? 16 : 20 }}>
                            {/* Top */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.3)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" /></svg>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 700 }}>{site.domain}</p>
                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{site.name}</p>
                                    </div>
                                </div>
                                <span style={{
                                    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                    color: site.isActive ? '#22c55e' : '#ef4444',
                                    background: site.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                }}>{site.isActive ? "Faol" : "To'xtatilgan"}</span>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                                    <p style={{ fontSize: 20, fontWeight: 700, color: '#FF2020' }}>{site._count.leads}</p>
                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Arizalar</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                                    <p style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{site._count.users}</p>
                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Adminlar</p>
                                </div>
                            </div>

                            {/* API Badges */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                <ApiBadge label="Meta Pixel" active={!!site.metaPixelId} />
                                <ApiBadge label="Yandex Metrica" active={!!site.yandexId} />
                                <ApiBadge label="Google Ads" active={!!site.googleAdsTag} />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setEditSite(site)} style={{
                                    flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                                    color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                                }}>Sozlash</button>
                                <button onClick={() => toggleActive(site.id, site.isActive)} style={{
                                    padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                    color: site.isActive ? '#f59e0b' : '#22c55e',
                                    background: site.isActive ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                                    border: `1px solid ${site.isActive ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
                                }}>{site.isActive ? "To'xtatish" : "Faollashtirish"}</button>
                                <button onClick={() => deleteSite(site.id, site.domain)} style={{
                                    padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                    color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                }}>O&apos;chirish</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showCreate && <SiteFormModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchSites(); }} isMobile={isMobile} />}
            {editSite && <SiteFormModal site={editSite} onClose={() => setEditSite(null)} onSaved={() => { setEditSite(null); fetchSites(); }} isMobile={isMobile} />}
        </div>
    );
}

function ApiBadge({ label, active }: { label: string; active: boolean }) {
    return (
        <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 500,
            color: active ? '#22c55e' : 'rgba(255,255,255,0.2)',
            background: active ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${active ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.04)'}`,
        }}>
            {active ? "✓ " : ""}{label}
        </span>
    );
}

function SiteFormModal({ site, onClose, onSaved, isMobile }: { site?: Site; onClose: () => void; onSaved: () => void; isMobile: boolean }) {
    const [form, setForm] = useState({ domain: site?.domain || "", name: site?.name || "", metaPixelId: site?.metaPixelId || "", yandexId: site?.yandexId || "", googleAdsTag: site?.googleAdsTag || "" });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url = site ? `/api/sites/${site.id}` : "/api/sites";
        const res = await fetch(url, { method: site ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Xato"); setSaving(false); return; }
        onSaved();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 16 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
            <div style={{
                position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : 480,
                background: '#14141c', border: '1px solid rgba(255,255,255,0.10)', borderRadius: isMobile ? '20px 20px 0 0' : 20,
                maxHeight: isMobile ? '90vh' : '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>
                {/* Header */}
                <div style={{ position: 'sticky', top: 0, background: '#14141c', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '16px' : '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, borderRadius: isMobile ? '20px 20px 0 0' : '20px 20px 0 0' }}>
                    <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700 }}>{site ? "Sayt sozlamalari" : "Yangi sayt"}</h2>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                        <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 14 }}>{error}</div>}
                    <ModalInput label="Domen" value={form.domain} onChange={(v) => setForm({ ...form, domain: v })} placeholder="example.uz" required />
                    <ModalInput label="Nomi" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Sayt nomi" required />
                    <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>API Kalitlar (ixtiyoriy)</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <ApiInputRow label="Meta Pixel ID" value={form.metaPixelId} onChange={(v) => setForm({ ...form, metaPixelId: v })} placeholder="123456789" isMobile={isMobile} />
                            <ApiInputRow label="Yandex Metrica ID" value={form.yandexId} onChange={(v) => setForm({ ...form, yandexId: v })} placeholder="98765432" isMobile={isMobile} />
                            <ApiInputRow label="Google Ads Tag" value={form.googleAdsTag} onChange={(v) => setForm({ ...form, googleAdsTag: v })} placeholder="AW-XXXXXXXXX" isMobile={isMobile} />
                        </div>
                    </div>
                    <button type="submit" disabled={saving} className="btn-accent" style={{ width: '100%' }}>
                        {saving ? "Saqlanmoqda..." : (site ? "Saqlash" : "Yaratish")}
                    </button>
                </form>
            </div>
        </div>
    );
}

function ModalInput({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</label>
            <input required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-dark"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'white', border: '1px solid rgba(255,255,255,0.10)' }} />
        </div>
    );
}

function ApiInputRow({ label, value, onChange, placeholder, isMobile }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; isMobile: boolean }) {
    return (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 4 : 12 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: isMobile ? 'auto' : 110, flexShrink: 0 }}>{label}</label>
            <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                style={{ flex: 1, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', fontSize: 12, color: 'white' }} />
        </div>
    );
}

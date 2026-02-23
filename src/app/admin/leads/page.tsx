"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface Lead {
    id: string;
    name: string;
    phone: string;
    goal: string | null;
    revenue: string | null;
    status: string;
    source: string | null;
    notes: string | null;
    createdAt: string;
    site: { domain: string; name: string };
    assignedTo: { name: string; login: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    NEW: { label: "Yangi", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    CONTACTED: { label: "Bog'lanildi", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    QUALIFIED: { label: "Tasdiqlandi", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    PROPOSAL: { label: "Taklif", color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
    WON: { label: "Shartnoma", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    LOST: { label: "Rad", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const isFirstLoad = useRef(true);

    const ITEMS_PER_PAGE = 20;

    const fetchLeads = useCallback((silent = false, pageNum = 1, append = false) => {
        if (!silent && !append) setLoading(true);
        if (append) setLoadingMore(true);
        const params = new URLSearchParams();
        if (filter !== "ALL") params.set("status", filter);
        params.set("limit", String(ITEMS_PER_PAGE));
        params.set("page", String(pageNum));

        fetch(`/api/leads?${params}`)
            .then((r) => r.json())
            .then((data) => {
                if (append) {
                    setLeads(prev => [...prev, ...(data.leads || [])]);
                } else {
                    setLeads(data.leads || []);
                }
                setTotal(data.pagination?.total || 0);
                setLoading(false);
                setLoadingMore(false);
                isFirstLoad.current = false;
            })
            .catch(() => { setLoading(false); setLoadingMore(false); });
    }, [filter]);

    useEffect(() => { setPage(1); fetchLeads(); }, [fetchLeads]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchLeads(false, nextPage, true);
    };

    // ═══ Auto-refresh: har 10 sekundda yangi arizalar (saytni qotirmasdan) ═══
    useEffect(() => {
        const interval = setInterval(() => {
            if (!document.hidden) {
                // Hozir ko'rinib turgan barcha sahifalarni qayta yuklash
                const params = new URLSearchParams();
                if (filter !== "ALL") params.set("status", filter);
                params.set("limit", String(page * ITEMS_PER_PAGE));
                params.set("page", "1");

                fetch(`/api/leads?${params}`)
                    .then((r) => r.json())
                    .then((data) => {
                        setLeads(data.leads || []);
                        setTotal(data.pagination?.total || 0);
                    })
                    .catch(() => { });
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [filter, page]);

    const updateStatus = async (leadId: string, newStatus: string) => {
        const res = await fetch(`/api/leads/${leadId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
            fetchLeads();
            if (selectedLead?.id === leadId) {
                const updated = await res.json();
                setSelectedLead({ ...selectedLead, ...updated });
            }
        }
    };

    const saveNotes = async (leadId: string, notes: string) => {
        await fetch(`/api/leads/${leadId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes }),
        });
    };

    const filteredLeads = leads.filter((lead) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return lead.name.toLowerCase().includes(q) || lead.phone.includes(q) || lead.site.domain.toLowerCase().includes(q);
    });

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
                <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Arizalar</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Jami: {total} ta ariza</p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
                <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(255,255,255,0.25)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ism, telefon yoki domen..."
                    className="input-dark"
                    style={{ paddingLeft: 40, background: 'rgba(255,255,255,0.04)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}
                />
            </div>

            {/* Status Filter Tabs — wrap on mobile */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                <FilterTab active={filter === "ALL"} onClick={() => setFilter("ALL")} label="Barchasi" />
                {ALL_STATUSES.map((s) => (
                    <FilterTab key={s} active={filter === s} onClick={() => setFilter(s)} label={STATUS_CONFIG[s].label} color={STATUS_CONFIG[s].color} />
                ))}
            </div>

            {/* Content */}
            <div className="admin-table">
                {loading ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Yuklanmoqda...</div>
                ) : filteredLeads.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                        <svg style={{ width: 48, height: 48, margin: '0 auto 12px', color: 'rgba(255,255,255,0.1)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Ariza topilmadi</p>
                    </div>
                ) : isMobile ? (
                    /* ── Mobile Card Layout ── */
                    <div>
                        {filteredLeads.map((lead) => (
                            <div
                                key={lead.id}
                                onClick={() => setSelectedLead(lead)}
                                style={{
                                    padding: '14px 16px', cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 600 }}>{lead.name}</p>
                                        <a href={`tel:${lead.phone}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{lead.phone}</a>
                                    </div>
                                    <StatusBadge status={lead.status} />
                                </div>
                                {lead.goal && (
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {lead.goal}
                                    </p>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 4 }}>{lead.site.domain}</span>
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{formatDate(lead.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* ── Desktop Table ── */
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {["Ism", "Telefon", "Maqsad", "Sayt", "Status", "Sana"].map(h => (
                                        <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '14px 20px' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        onClick={() => setSelectedLead(lead)}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.15s' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 500 }}>{lead.name}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <a href={`tel:${lead.phone}`} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>{lead.phone}</a>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.goal || "—"}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 6 }}>{lead.site.domain}</span>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}><StatusBadge status={lead.status} /></td>
                                        <td style={{ padding: '16px 20px', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{formatDate(lead.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Yana yuklash */}
            {leads.length < total && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button onClick={loadMore} disabled={loadingMore} style={{
                        padding: '12px 32px', borderRadius: 12, border: '1px solid rgba(255,32,32,0.2)',
                        background: 'rgba(255,32,32,0.06)', color: '#FF2020', fontSize: 14, fontWeight: 600,
                        cursor: loadingMore ? 'not-allowed' : 'pointer', opacity: loadingMore ? 0.5 : 1,
                        transition: 'all 0.2s',
                    }}>
                        {loadingMore ? "Yuklanmoqda..." : `⬇️ Yana yuklash (${leads.length}/${total})`}
                    </button>
                </div>
            )}
            {/* Ariza tafsilotlari Modal */}
            {selectedLead && (
                <LeadModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onStatusChange={updateStatus}
                    onSaveNotes={saveNotes}
                    isMobile={isMobile}
                />
            )}
        </div>
    );
}

/* ── Components ── */

function FilterTab({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                border: `1px solid ${active ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.4)',
            }}
        >
            {color && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', marginRight: 6, background: color }} />}
            {label}
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || { label: status, color: "#666", bg: "rgba(100,100,100,0.1)" };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            color: config.color, background: config.bg,
            border: `1px solid ${config.color}22`, whiteSpace: 'nowrap',
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
            {config.label}
        </span>
    );
}

function LeadModal({
    lead, onClose, onStatusChange, onSaveNotes, isMobile,
}: {
    lead: Lead; onClose: () => void; onStatusChange: (id: string, status: string) => void;
    onSaveNotes: (id: string, notes: string) => void; isMobile: boolean;
}) {
    const [notes, setNotes] = useState(lead.notes || "");
    const [saving, setSaving] = useState(false);

    const handleSaveNotes = async () => { setSaving(true); await onSaveNotes(lead.id, notes); setSaving(false); onClose(); };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 16 }}>
            {/* Overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

            {/* Modal Card — full width bottom sheet on mobile, centered card on desktop */}
            <div style={{
                position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : 520,
                background: '#14141c', border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: isMobile ? '20px 20px 0 0' : 20,
                maxHeight: isMobile ? '90vh' : '85vh', overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>
                {/* Header */}
                <div style={{
                    position: 'sticky', top: 0, background: '#14141c',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: isMobile ? '16px 16px' : '20px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10,
                    borderRadius: isMobile ? '20px 20px 0 0' : '20px 20px 0 0',
                }}>
                    <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700 }}>Ariza tafsilotlari</h2>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255,255,255,0.5)',
                    }}>
                        <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <div style={{ padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>
                    {/* Info Grid — 1 column on mobile, 2 on desktop */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
                        <InfoItem label="Ism" value={lead.name} />
                        <InfoItem label="Telefon" value={lead.phone} isPhone />
                        <InfoItem label="Maqsad" value={lead.goal || "—"} full={isMobile} />
                        <InfoItem label="Daromad" value={lead.revenue || "—"} />
                        <InfoItem label="Sayt" value={lead.site.domain} />
                        <InfoItem label="Manba" value={lead.source === "organic" ? "Sayt orqali" : (lead.source || "Sayt orqali")} />
                        <InfoItem label="Sana" value={formatDate(lead.createdAt)} />
                    </div>

                    {/* Status Change */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Holatni o&apos;zgartirish</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {ALL_STATUSES.map((s) => {
                                const isActive = lead.status === s;
                                const cfg = STATUS_CONFIG[s];
                                return (
                                    <button
                                        key={s}
                                        onClick={() => onStatusChange(lead.id, s)}
                                        style={{
                                            padding: isMobile ? '6px 12px' : '8px 14px', borderRadius: 10,
                                            fontSize: isMobile ? 11 : 12, fontWeight: 600, cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            color: cfg.color, background: cfg.bg,
                                            border: isActive ? `2px solid ${cfg.color}` : `1px solid ${cfg.color}33`,
                                            opacity: isActive ? 1 : 0.6,
                                            transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                        }}
                                    >
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Eslatma</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Eslatma yozing..."
                            rows={3}
                            style={{
                                width: '100%', borderRadius: 12, padding: '12px 16px', fontSize: 14,
                                color: 'white', background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)', resize: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                        <button onClick={handleSaveNotes} disabled={saving} className="btn-accent" style={{ marginTop: 10, width: isMobile ? '100%' : 'auto' }}>
                            {saving ? "Saqlanmoqda..." : "💾 Saqlash"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value, isPhone, full }: { label: string; value: string; isPhone?: boolean; full?: boolean }) {
    return (
        <div style={full ? { gridColumn: 'span 2' } : undefined}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</p>
            {isPhone ? (
                <a href={`tel:${value}`} style={{ fontSize: 14, fontWeight: 500, color: 'white', textDecoration: 'none' }}>{value}</a>
            ) : (
                <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{value}</p>
            )}
        </div>
    );
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, "0");
    const months = ["yan", "fev", "mar", "apr", "may", "iyn", "iyul", "avg", "sen", "okt", "noy", "dek"];
    const mon = months[d.getMonth()];
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${day}-${mon}, ${hours}:${mins}`;
}

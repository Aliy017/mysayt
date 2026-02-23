"use client";

import { useEffect, useState } from "react";

interface Site { id: string; domain: string; name: string }
interface User {
    id: string; login: string; name: string; role: string; isActive: boolean; createdAt: string; sites: Site[];
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    TEAM_ADMIN: { label: "TeamAdmin", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    SUPER_ADMIN: { label: "SuperAdmin", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    ADMIN: { label: "Admin", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
};

export default function TeamPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check(); window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const fetchData = () => {
        setLoading(true);
        Promise.all([fetch("/api/users").then(r => r.json()), fetch("/api/sites").then(r => r.json())])
            .then(([u, s]) => { setUsers(u); setSites(s); setLoading(false); });
    };
    useEffect(() => { fetchData(); }, []);

    const toggleActive = async (id: string, isActive: boolean) => {
        const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.error || "Xatolik yuz berdi");
            return;
        }
        fetchData();
    };

    const executeDelete = async (id: string) => {
        setConfirmDelete(null);
        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "O'chirishda xatolik yuz berdi");
                return;
            }
            fetchData();
        } catch {
            alert("Server bilan aloqa yo'q");
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Foydalanuvchilar</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Jami: {users.length} ta</p>
                </div>
                <button onClick={() => setShowCreate(true)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12,
                    fontSize: 14, fontWeight: 600, color: 'white', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #FF2020, #cc1a1a)', boxShadow: '0 4px 16px rgba(255,32,32,0.25)',
                }}>
                    <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    Yangi foydalanuvchi
                </button>
            </div>

            {/* Users list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {loading ? (
                    [1, 2, 3].map((i) => <div key={i} className="card" style={{ height: 80, opacity: 0.5 }} />)
                ) : users.length === 0 ? (
                    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Foydalanuvchilar yo&apos;q</p>
                    </div>
                ) : (
                    users.map((user) => (
                        <div key={user.id} className="card" style={{ padding: isMobile ? 14 : 20 }}>
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 12 : 16 }}>
                                {/* Avatar + Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 700, flexShrink: 0,
                                        background: ROLE_CONFIG[user.role]?.bg, color: ROLE_CONFIG[user.role]?.color,
                                    }}>
                                        {user.name[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <p style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                                            <RoleBadge role={user.role} />
                                            {!user.isActive && <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>Nofaol</span>}
                                        </div>
                                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Login: {user.login}</p>
                                    </div>
                                </div>

                                {/* Sites */}
                                {user.sites.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {user.sites.map((s) => (
                                            <span key={s.id} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>{s.domain}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                {user.role !== "TEAM_ADMIN" && (
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                                        <button onClick={() => setEditUser(user)} style={{
                                            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                            color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                                        }}>✏️ Tahrirlash</button>
                                        <button onClick={() => toggleActive(user.id, user.isActive)} style={{
                                            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                            color: user.isActive ? '#f59e0b' : '#22c55e',
                                            background: user.isActive ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                                            border: `1px solid ${user.isActive ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
                                        }}>{user.isActive ? "To'xtatish" : "Faollashtirish"}</button>
                                        <button onClick={() => setConfirmDelete({ id: user.id, name: user.name })} style={{
                                            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                            color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                        }}>O&apos;chirish</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showCreate && <UserFormModal mode="create" sites={sites} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchData(); }} isMobile={isMobile} />}
            {editUser && <UserFormModal mode="edit" user={editUser} sites={sites} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); fetchData(); }} isMobile={isMobile} />}

            {/* O'chirish tasdiqlash modali */}
            {confirmDelete && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmDelete(null)} />
                    <div style={{ position: 'relative', background: '#14141c', borderRadius: 20, padding: 28, maxWidth: 400, width: '100%', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', textAlign: 'center' }}>
                        <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>O&apos;chirishni tasdiqlang</h3>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.5 }}>
                            <strong style={{ color: '#ef4444' }}>&quot;{confirmDelete.name}&quot;</strong> foydalanuvchisini o&apos;chirmoqchimisiz?<br />Bu amalni qaytarib bo&apos;lmaydi!
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>Bekor qilish</button>
                            <button onClick={() => executeDelete(confirmDelete.id)} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'white', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>Ha, o&apos;chirish</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const config = ROLE_CONFIG[role] || { label: role, color: "#666", bg: "rgba(100,100,100,0.1)" };
    return <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, color: config.color, background: config.bg, border: `1px solid ${config.color}22` }}>{config.label}</span>;
}

/* ══════════════ UNIVERSAL USER FORM MODAL (Create + Edit) ══════════════ */
function UserFormModal({ mode, user, sites, onClose, onSaved, isMobile }: {
    mode: "create" | "edit"; user?: User; sites: Site[]; onClose: () => void; onSaved: () => void; isMobile: boolean;
}) {
    const [form, setForm] = useState({
        name: user?.name || "",
        login: user?.login || "",
        password: "",
        role: user?.role || "ADMIN",
        siteIds: user?.sites.map(s => s.id) || [] as string[],
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");

        if (mode === "create") {
            const res = await fetch("/api/users", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Xato yuz berdi"); setSaving(false); return; }
        } else {
            // Edit mode — faqat o'zgargan fieldlarni yuboramiz
            const updateBody: Record<string, unknown> = {
                name: form.name,
                role: form.role,
                siteIds: form.siteIds,
            };
            if (form.password) updateBody.password = form.password;

            const res = await fetch(`/api/users/${user!.id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateBody),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Xato yuz berdi"); setSaving(false); return; }
        }
        onSaved();
    };

    const toggleSite = (siteId: string) => {
        setForm(prev => ({ ...prev, siteIds: prev.siteIds.includes(siteId) ? prev.siteIds.filter(id => id !== siteId) : [...prev.siteIds, siteId] }));
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 16 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
            <div style={{
                position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : 480,
                background: '#14141c', border: '1px solid rgba(255,255,255,0.10)', borderRadius: isMobile ? '20px 20px 0 0' : 20,
                maxHeight: isMobile ? '90vh' : '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>
                <div style={{ position: 'sticky', top: 0, background: '#14141c', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? 16 : '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, borderRadius: isMobile ? '20px 20px 0 0' : '20px 20px 0 0' }}>
                    <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700 }}>{mode === "create" ? "Yangi foydalanuvchi" : `${user?.name} — Tahrirlash`}</h2>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                        <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 14 }}>{error}</div>}

                    <FormInput label="Ism" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Alisher Toshmatov" />

                    {mode === "create" && (
                        <FormInput label="Login" value={form.login} onChange={v => setForm({ ...form, login: v })} placeholder="alisher" />
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                            {mode === "create" ? "Parol" : "Yangi parol (bo'sh qoldirsangiz o'zgarmaydi)"}
                        </label>
                        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                            placeholder={mode === "create" ? "••••••" : "Yangi parol..."}
                            required={mode === "create"} className="input-dark"
                            style={{ background: 'rgba(255,255,255,0.04)', color: 'white', border: '1px solid rgba(255,255,255,0.10)' }} />
                    </div>

                    {/* Rol */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Rol</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {(["ADMIN", "SUPER_ADMIN"] as const).map(r => (
                                <button key={r} type="button" onClick={() => setForm({ ...form, role: r })} style={{
                                    flex: 1, padding: '10px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    color: ROLE_CONFIG[r].color, background: ROLE_CONFIG[r].bg,
                                    border: form.role === r ? `2px solid ${ROLE_CONFIG[r].color}` : `1px solid ${ROLE_CONFIG[r].color}33`,
                                    opacity: form.role === r ? 1 : 0.5,
                                }}>{ROLE_CONFIG[r].label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Saytlar */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Saytlarga ruxsat</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {sites.map(site => (
                                <label key={site.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                                    border: '1px solid rgba(255,255,255,0.06)', background: form.siteIds.includes(site.id) ? 'rgba(255,32,32,0.05)' : 'rgba(255,255,255,0.02)',
                                }}>
                                    <input type="checkbox" checked={form.siteIds.includes(site.id)} onChange={() => toggleSite(site.id)} style={{ accentColor: '#FF2020' }} />
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 500 }}>{site.domain}</p>
                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{site.name}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button type="submit" disabled={saving} className="btn-accent" style={{ width: '100%' }}>
                        {saving ? (mode === "create" ? "Yaratilmoqda..." : "Saqlanmoqda...") : (mode === "create" ? "Yaratish" : "Saqlash")}
                    </button>
                </form>
            </div>
        </div>
    );
}

function FormInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</label>
            <input type="text" required value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input-dark"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'white', border: '1px solid rgba(255,255,255,0.10)' }} />
        </div>
    );
}

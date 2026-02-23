"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

export default function SettingsPage() {
    const { data: session } = useSession();
    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check(); window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);



    const changePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass.length < 6) { setMsg("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
        setSaving(true); setMsg("");
        try {
            const res = await fetch("/api/settings/password", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
            });
            const data = await res.json();
            setMsg(res.ok ? "✅ Parol muvaffaqiyatli o'zgartirildi" : data.error || "Xato");
            if (res.ok) { setOldPass(""); setNewPass(""); }
        } catch { setMsg("Tarmoq xatosi"); }
        setSaving(false);
    };

    return (
        <div style={{ maxWidth: isMobile ? '100%' : 640 }}>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20 }}>Sozlamalar</h1>

            {/* Profil */}
            <div className="card">
                <h2 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Profil</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ism</p>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>{session?.user?.name || "—"}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Rol</p>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>{(session?.user as { role?: string })?.role || "—"}</p>
                    </div>
                </div>
            </div>

            {/* Parol */}
            <div className="card">
                <h2 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Parolni o&apos;zgartirish</h2>
                <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: isMobile ? '100%' : 360 }}>
                    <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="Joriy parol" required className="input-dark"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'white', border: '1px solid rgba(255,255,255,0.10)' }} />
                    <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Yangi parol" required className="input-dark"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'white', border: '1px solid rgba(255,255,255,0.10)' }} />
                    {msg && <p style={{ fontSize: 14, color: msg.startsWith("✅") ? '#22c55e' : '#ef4444' }}>{msg}</p>}
                    <button type="submit" disabled={saving} className="btn-accent" style={{ alignSelf: isMobile ? 'stretch' : 'flex-start' }}>
                        {saving ? "Saqlanmoqda..." : "O'zgartirish"}
                    </button>
                </form>
            </div>

            {/* Tizimdan chiqish */}
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.1)' }}>
                <h2 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Xavfli hudud</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Bu amaldan keyin qayta login qilishingiz kerak bo&apos;ladi</p>
                <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
                    padding: isMobile ? '10px 16px' : '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    width: isMobile ? '100%' : 'auto',
                }}>Tizimdan chiqish</button>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    lead: { name: string; phone: string } | null;
    site: { domain: string; name: string } | null;
    sender: { name: string; login: string } | null;
}

const TYPE_ICONS: Record<string, string> = { LEAD: "📥", SYSTEM: "⚙️", ALERT: "🔔" };

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(20);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check(); window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const fetchNotifications = () => {
        fetch("/api/notifications")
            .then(r => r.json())
            .then(data => { setNotifications(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchNotifications(); }, []);

    const markAllRead = async () => {
        await fetch("/api/notifications", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAllRead: true }),
        });
        fetchNotifications();
    };

    const markOneRead = async (id: string) => {
        await fetch("/api/notifications", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        fetchNotifications();
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Habarnomalar</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
                        {notifications.length} ta habarnoma
                        {unreadCount > 0 && <span style={{ color: '#FF2020', fontWeight: 600 }}> · {unreadCount} ta yangi</span>}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{
                        padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>✓ Barchasini o&apos;qildi</button>
                )}
            </div>

            {/* Info banner — Kim habar yuboradi */}
            <div style={{
                padding: isMobile ? '12px 14px' : '14px 18px', borderRadius: 12, marginBottom: 16,
                background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)',
            }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                    💡 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Habarnomalar avtomatik yaratiladi</strong> — yangi lead kelganda, lead statusi o&apos;zgarganda
                    va tizim xabarlari bo&apos;lganda shu yerda ko&apos;rinadi
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="card" style={{ height: 64, opacity: 0.5 }} />)
                ) : notifications.length === 0 ? (
                    <div className="card" style={{ padding: isMobile ? 48 : 64, textAlign: 'center' }}>
                        <p style={{ fontSize: 40, marginBottom: 12 }}>🔔</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Hozircha habarnomalar yo&apos;q</p>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 4 }}>Yangi lead kelganda bu yerda ko&apos;rinadi</p>
                    </div>
                ) : (
                    notifications.slice(0, visibleCount).map(n => (
                        <div key={n.id}
                            onClick={() => !n.isRead && markOneRead(n.id)}
                            style={{
                                borderRadius: 12, padding: isMobile ? 12 : 16, cursor: !n.isRead ? 'pointer' : 'default',
                                background: n.isRead ? '#12121a' : '#14141e',
                                border: `1px solid ${n.isRead ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
                            }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <span style={{ fontSize: 18, marginTop: 2 }}>{TYPE_ICONS[n.type] || "📩"}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <p style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</p>
                                        {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF2020', flexShrink: 0 }} />}
                                    </div>
                                    {n.message && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{n.message}</p>}

                                    {/* Ariza tafsilotlari */}
                                    {n.lead && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,32,32,0.06)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(255,32,32,0.1)' }}>
                                                👤 {n.lead.name}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 4 }}>
                                                📱 {n.lead.phone}
                                            </span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                        {n.site && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 4 }}>🌐 {n.site.domain}</span>}
                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.20)' }}>{formatTime(n.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Yana yuklash */}
            {!loading && notifications.length > visibleCount && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button onClick={() => setVisibleCount(prev => prev + 20)} style={{
                        padding: '12px 32px', borderRadius: 12, border: '1px solid rgba(255,32,32,0.2)',
                        background: 'rgba(255,32,32,0.06)', color: '#FF2020', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                        {`⬇️ Yana yuklash (${Math.min(visibleCount, notifications.length)}/${notifications.length})`}
                    </button>
                </div>
            )}
        </div>
    );
}

function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Hozir";
    if (mins < 60) return `${mins} daqiqa oldin`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} soat oldin`;
    const days = Math.floor(hours / 24);
    return `${days} kun oldin`;
}

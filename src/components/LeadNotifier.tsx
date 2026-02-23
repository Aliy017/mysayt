"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface NewLead {
    id: string;
    name: string;
    phone: string;
    createdAt: string;
    site: { domain: string };
}

interface ToastData {
    id: string;
    name: string;
    phone: string;
    domain: string;
    time: string;
}

// ═══ Programmatic notification sound ═══
function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const now = ctx.currentTime;

        // "Ding" — ikkita harmonik nota
        [880, 1320].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.5);
        });
    } catch {
        // AudioContext ishlamasa ovoz chalmaydi
    }
}

// ═══ Browser Notification ═══
function showBrowserNotification(name: string, phone: string, domain: string) {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    new Notification("📥 Yangi ariza!", {
        body: `${name}\n📱 ${phone}\n🌐 ${domain}`,
        icon: "/icons/icon-192.svg",
        badge: "/icons/icon-192.svg",
        tag: "new-lead-" + Date.now(),
    });
}

export default function LeadNotifier() {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const lastChecked = useRef<string>(new Date().toISOString());
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Ruxsat so'rash — faqat birinchi marta
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Polling — har 10 sekundda yangi leadlarni tekshirish
    useEffect(() => {
        const poll = async () => {
            try {
                const res = await fetch(`/api/leads/new-count?since=${encodeURIComponent(lastChecked.current)}`);
                if (!res.ok) return;
                const data = await res.json();

                if (data.count > 0 && data.latest) {
                    const lead = data.latest as NewLead;
                    lastChecked.current = new Date().toISOString();

                    // In-app toast
                    const toastId = lead.id + "-" + Date.now();
                    const newToast: ToastData = {
                        id: toastId,
                        name: lead.name,
                        phone: lead.phone,
                        domain: lead.site.domain,
                        time: new Date(lead.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
                    };

                    setToasts(prev => [newToast, ...prev].slice(0, 3)); // Max 3 toast

                    // Sound
                    playNotificationSound();

                    // Browser notification
                    showBrowserNotification(lead.name, lead.phone, lead.site.domain);

                    // Auto-remove after 6s
                    setTimeout(() => removeToast(toastId), 6000);
                }
            } catch {
                // Network error — skip
            }
        };

        const interval = setInterval(poll, 10000);
        return () => clearInterval(interval);
    }, [removeToast]);

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: "fixed",
            top: isMobile ? 8 : 16,
            right: isMobile ? 8 : 16,
            left: isMobile ? 8 : "auto",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            pointerEvents: "none",
        }}>
            {toasts.map((toast, i) => (
                <div
                    key={toast.id}
                    onClick={() => { removeToast(toast.id); router.push("/admin/leads"); }}
                    style={{
                        pointerEvents: "auto",
                        cursor: "pointer",
                        width: isMobile ? "100%" : 380,
                        background: "rgba(14,14,22,0.97)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,32,32,0.25)",
                        borderRadius: 16,
                        padding: isMobile ? "14px 16px" : "16px 20px",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(255,32,32,0.08)",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        animation: "slideInNotif 0.4s cubic-bezier(0.16,1,0.3,1)",
                        opacity: 1 - i * 0.15,
                        transform: `translateY(${i * 4}px) scale(${1 - i * 0.02})`,
                        transition: "all 0.3s ease",
                    }}
                >
                    {/* Pulsating bell */}
                    <div style={{
                        position: "relative",
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: "linear-gradient(135deg, rgba(255,32,32,0.15), rgba(255,32,32,0.05))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 22, animation: "bellShake 0.6s ease 0.2s" }}>🔔</span>
                        <span style={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#FF2020",
                            boxShadow: "0 0 8px rgba(255,32,32,0.6)",
                            animation: "pulse 1.5s ease-in-out infinite",
                        }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#FF2020",
                                letterSpacing: "0.02em",
                            }}>
                                Yangi ariza!
                            </span>
                            <span style={{
                                fontSize: 10,
                                color: "rgba(255,255,255,0.3)",
                                fontWeight: 500,
                            }}>{toast.time}</span>
                        </div>
                        <p style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "white",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}>{toast.name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <span style={{
                                fontSize: 12,
                                color: "rgba(255,255,255,0.45)",
                            }}>📱 {toast.phone}</span>
                            <span style={{
                                fontSize: 10,
                                color: "rgba(255,255,255,0.3)",
                                background: "rgba(255,255,255,0.05)",
                                padding: "1px 6px",
                                borderRadius: 4,
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}>🌐 {toast.domain}</span>
                        </div>
                    </div>

                    {/* Close */}
                    <button
                        onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            border: "none",
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.3)",
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all 0.2s",
                        }}
                    >✕</button>
                </div>
            ))}

            {/* CSS Animations */}
            <style>{`
                @keyframes slideInNotif {
                    from { transform: translateX(120%) scale(0.8); opacity: 0; }
                    to { transform: translateX(0) scale(1); opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.7; }
                }
                @keyframes bellShake {
                    0% { transform: rotate(0); }
                    15% { transform: rotate(14deg); }
                    30% { transform: rotate(-12deg); }
                    45% { transform: rotate(8deg); }
                    60% { transform: rotate(-4deg); }
                    75% { transform: rotate(2deg); }
                    100% { transform: rotate(0); }
                }
            `}</style>
        </div>
    );
}

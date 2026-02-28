"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

interface SecuritySettings {
    rateLimitEnabled: boolean;
    rateLimitMax: number;
    bruteForceEnabled: boolean;
    bruteForceMax: number;
    bruteForceBlock: number;
    corsStrictMode: boolean;
    corsAllowedOrigins: string;
    inputSanitization: boolean;
    auditLogExpanded: boolean;
}

export default function SecurityPage() {
    const { data: session } = useSession();
    const role = (session?.user as { role?: string })?.role;

    // FAQAT TD
    if (role && role !== "TEAM_ADMIN") redirect("/admin/dashboard");

    const [settings, setSettings] = useState<SecuritySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [corsInput, setCorsInput] = useState("");

    // String states for number inputs — allows free typing, validates on blur
    const [rateLimitInput, setRateLimitInput] = useState("");
    const [bruteForceMaxInput, setBruteForceMaxInput] = useState("");
    const [bruteForceBlockInput, setBruteForceBlockInput] = useState("");

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch("/api/settings/security");
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
                setCorsInput(data.corsAllowedOrigins || "");
                setRateLimitInput(String(data.rateLimitMax ?? ""));
                setBruteForceMaxInput(String(data.bruteForceMax ?? ""));
                setBruteForceBlockInput(String(data.bruteForceBlock ?? ""));
            }
        } catch { /* xato */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const updateSetting = async (key: string, value: unknown) => {
        setSaving(key);
        try {
            const res = await fetch("/api/settings/security", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value }),
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch { /* xato */ }
        setSaving(null);
    };

    if (loading || !settings) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                Yuklanmoqda...
            </div>
        );
    }

    const cardStyle: React.CSSProperties = {
        background: "var(--card-bg)", borderRadius: 16, padding: 24,
        border: "1px solid var(--border)",
    };

    const toggleStyle = (enabled: boolean): React.CSSProperties => ({
        position: "relative", width: 48, height: 26, borderRadius: 13,
        background: enabled ? "#22c55e" : "rgba(255,255,255,0.1)",
        cursor: "pointer", transition: "all 0.3s", flexShrink: 0,
        border: enabled ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.15)",
    });

    const toggleKnob = (enabled: boolean): React.CSSProperties => ({
        position: "absolute", top: 2, left: enabled ? 23 : 2,
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    });

    const labelStyle: React.CSSProperties = {
        fontSize: 12, color: "var(--muted)", marginTop: 4,
    };

    const inputStyle: React.CSSProperties = {
        padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
        background: "#12121a", color: "#e0e0e0", fontSize: 14, width: 80,
        outline: "none", textAlign: "center",
    };

    return (
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)" }}>
                    🛡️ Xavfsizlik
                </h1>
                <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                    Tizim xavfsizlik sozlamalarini boshqaring
                </p>
            </div>

            <style>{`
                .sec-grid {
                    display: grid;
                    gap: 20px;
                    grid-template-columns: 1fr 1fr;
                }
                @media (max-width: 768px) {
                    .sec-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            <div className="sec-grid">
                {/* ═══ 1. Rate Limiting ═══ */}
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginTop: 0, marginBottom: 4 }}>
                                🚦 Rate Limiting
                            </h3>
                            <p style={labelStyle}>Ariza spam hujumidan himoya</p>
                        </div>
                        <div
                            style={toggleStyle(settings.rateLimitEnabled)}
                            onClick={() => updateSetting("rateLimitEnabled", !settings.rateLimitEnabled)}
                        >
                            <div style={toggleKnob(settings.rateLimitEnabled)} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>Max so'rov / daqiqa:</span>
                        <input
                            type="number"
                            min={1}
                            max={1000}
                            value={rateLimitInput}
                            style={inputStyle}
                            onChange={(e) => setRateLimitInput(e.target.value)}
                            onBlur={() => {
                                const v = parseInt(rateLimitInput);
                                if (!isNaN(v) && v >= 1 && v <= 1000) {
                                    setSettings({ ...settings, rateLimitMax: v });
                                    setRateLimitInput(String(v));
                                    updateSetting("rateLimitMax", v);
                                } else {
                                    setRateLimitInput(String(settings.rateLimitMax));
                                }
                            }}
                        />
                    </div>
                    <div style={{
                        marginTop: 12, padding: "8px 12px", borderRadius: 8,
                        background: settings.rateLimitEnabled ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                        fontSize: 12, color: settings.rateLimitEnabled ? "#22c55e" : "var(--muted)",
                    }}>
                        {settings.rateLimitEnabled
                            ? `✅ Faol — 1 IP dan ${settings.rateLimitMax} ta so'rov/daqiqa`
                            : "⚠️ O'chirilgan — cheksiz so'rov ruxsat"}
                    </div>
                </div>

                {/* ═══ 2. Brute Force ═══ */}
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginTop: 0, marginBottom: 4 }}>
                                🔐 Brute Force Himoya
                            </h3>
                            <p style={labelStyle}>Login urinishlarini cheklash</p>
                        </div>
                        <div
                            style={toggleStyle(settings.bruteForceEnabled)}
                            onClick={() => updateSetting("bruteForceEnabled", !settings.bruteForceEnabled)}
                        >
                            <div style={toggleKnob(settings.bruteForceEnabled)} />
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 13, color: "var(--muted)", minWidth: 120 }}>Max urinish:</span>
                            <input
                                type="number" min={1} max={100}
                                value={bruteForceMaxInput}
                                style={inputStyle}
                                onChange={(e) => setBruteForceMaxInput(e.target.value)}
                                onBlur={() => {
                                    const v = parseInt(bruteForceMaxInput);
                                    if (!isNaN(v) && v >= 1 && v <= 100) {
                                        setSettings({ ...settings, bruteForceMax: v });
                                        setBruteForceMaxInput(String(v));
                                        updateSetting("bruteForceMax", v);
                                    } else {
                                        setBruteForceMaxInput(String(settings.bruteForceMax));
                                    }
                                }}
                            />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 13, color: "var(--muted)", minWidth: 120 }}>Blok (daqiqa):</span>
                            <input
                                type="number" min={1} max={1440}
                                value={bruteForceBlockInput}
                                style={inputStyle}
                                onChange={(e) => setBruteForceBlockInput(e.target.value)}
                                onBlur={() => {
                                    const v = parseInt(bruteForceBlockInput);
                                    if (!isNaN(v) && v >= 1 && v <= 1440) {
                                        setSettings({ ...settings, bruteForceBlock: v });
                                        setBruteForceBlockInput(String(v));
                                        updateSetting("bruteForceBlock", v);
                                    } else {
                                        setBruteForceBlockInput(String(settings.bruteForceBlock));
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div style={{
                        marginTop: 12, padding: "8px 12px", borderRadius: 8,
                        background: settings.bruteForceEnabled ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                        fontSize: 12, color: settings.bruteForceEnabled ? "#22c55e" : "var(--muted)",
                    }}>
                        {settings.bruteForceEnabled
                            ? `✅ ${settings.bruteForceMax} urinish → ${settings.bruteForceBlock} daqiqa blok`
                            : "⚠️ O'chirilgan — cheksiz login urinish"}
                    </div>
                </div>

                {/* ═══ 3. CORS Strict Mode ═══ */}
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginTop: 0, marginBottom: 4 }}>
                                🌐 CORS Cheklash
                            </h3>
                            <p style={labelStyle}>Faqat ruxsat etilgan domenlardan ariza qabul</p>
                        </div>
                        <div
                            style={toggleStyle(settings.corsStrictMode)}
                            onClick={() => updateSetting("corsStrictMode", !settings.corsStrictMode)}
                        >
                            <div style={toggleKnob(settings.corsStrictMode)} />
                        </div>
                    </div>

                    {settings.corsStrictMode && (
                        <div style={{ marginTop: 12 }}>
                            <span style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 8 }}>
                                Ruxsat etilgan domenlar (vergul bilan):
                            </span>
                            <input
                                type="text"
                                value={corsInput}
                                placeholder="pimedia.uz, merit.com.uz"
                                style={{ ...inputStyle, width: "100%", textAlign: "left" }}
                                onChange={(e) => setCorsInput(e.target.value)}
                                onBlur={() => updateSetting("corsAllowedOrigins", corsInput)}
                            />
                        </div>
                    )}
                    <div style={{
                        marginTop: 12, padding: "8px 12px", borderRadius: 8,
                        background: settings.corsStrictMode ? "rgba(251,146,60,0.06)" : "rgba(255,255,255,0.02)",
                        fontSize: 12, color: settings.corsStrictMode ? "#fb923c" : "var(--muted)",
                    }}>
                        {settings.corsStrictMode
                            ? `🔒 Strict mode — faqat belgilangan domenlar`
                            : "🌍 Ochiq — barcha domenlardan ruxsat (*)"}
                    </div>
                </div>

                {/* ═══ 4. Input Sanitization ═══ */}
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginTop: 0, marginBottom: 4 }}>
                                🧹 XSS Tozalash
                            </h3>
                            <p style={labelStyle}>Kiruvchi ma&apos;lumotlardan zararli kodlarni tozalash</p>
                        </div>
                        <div
                            style={toggleStyle(settings.inputSanitization)}
                            onClick={() => updateSetting("inputSanitization", !settings.inputSanitization)}
                        >
                            <div style={toggleKnob(settings.inputSanitization)} />
                        </div>
                    </div>
                    <div style={{
                        marginTop: 12, padding: "8px 12px", borderRadius: 8,
                        background: settings.inputSanitization ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                        fontSize: 12, color: settings.inputSanitization ? "#22c55e" : "#ef4444",
                    }}>
                        {settings.inputSanitization
                            ? "✅ HTML/JS injection himoyasi faol"
                            : "❌ XAVFLI — XSS tozalash o'chirilgan!"}
                    </div>
                </div>

                {/* ═══ 5. Audit Log ═══ */}
                <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginTop: 0, marginBottom: 4 }}>
                                📋 Kengaytirilgan Audit Log
                            </h3>
                            <p style={labelStyle}>
                                Barcha amallar (ariza o&apos;zgarishi, user yaratish/o&apos;chirish, sozlama o&apos;zgarishi) logga yozilsin
                            </p>
                        </div>
                        <div
                            style={toggleStyle(settings.auditLogExpanded)}
                            onClick={() => updateSetting("auditLogExpanded", !settings.auditLogExpanded)}
                        >
                            <div style={toggleKnob(settings.auditLogExpanded)} />
                        </div>
                    </div>
                    <div style={{
                        marginTop: 12, padding: "8px 12px", borderRadius: 8,
                        background: settings.auditLogExpanded ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                        fontSize: 12, color: settings.auditLogExpanded ? "#22c55e" : "var(--muted)",
                    }}>
                        {settings.auditLogExpanded
                            ? "✅ Barcha amallar logga yozilmoqda"
                            : "⚠️ Faqat login/logout loglanadi"}
                    </div>
                </div>
            </div>

            {/* Saving indicator */}
            {saving && (
                <div style={{
                    position: "fixed", bottom: 24, right: 24, padding: "10px 20px",
                    background: "#22c55e", color: "white", borderRadius: 12,
                    fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
                    animation: "fadeIn 0.3s",
                }}>
                    ✅ Saqlanmoqda...
                </div>
            )}
        </div>
    );
}

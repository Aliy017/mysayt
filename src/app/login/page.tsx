"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(loginAction, null);

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(255,32,32,0.06) 0%, transparent 60%), #0a0a0f',
        }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 56, height: 56, borderRadius: 16, marginBottom: 20,
                        background: 'linear-gradient(135deg, #FF2020, #cc1a1a)',
                        boxShadow: '0 8px 32px rgba(255,32,32,0.25)',
                    }}>
                        <svg style={{ width: 28, height: 28, color: 'white' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>MySayt</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6 }}>Admin boshqaruv paneli</p>
                </div>

                {/* Form Card */}
                <div style={{
                    background: 'rgba(22,22,31,0.6)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28,
                }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Kirish</h2>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 24 }}>Login va parolingizni kiriting</p>

                    {/* Error */}
                    {state?.error && (
                        <div style={{
                            marginBottom: 20, padding: '12px 16px', borderRadius: 12,
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            color: '#ef4444', fontSize: 14, fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                            </svg>
                            {state.error}
                        </div>
                    )}

                    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Login */}
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Login</label>
                            <input name="login" type="text" required autoComplete="username" placeholder="loginni kiriting" className="input-dark" style={{ background: 'rgba(255,255,255,0.04)', color: 'white', border: '1px solid rgba(255,255,255,0.10)' }} />
                        </div>

                        {/* Password */}
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parol</label>
                            <input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className="input-dark" style={{ background: 'rgba(255,255,255,0.04)', color: 'white', border: '1px solid rgba(255,255,255,0.10)' }} />
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={isPending}
                            style={{
                                width: '100%', borderRadius: 12, padding: '14px 0', fontSize: 14, fontWeight: 600,
                                color: 'white', border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
                                marginTop: 8, opacity: isPending ? 0.5 : 1,
                                background: isPending ? 'rgba(255,32,32,0.3)' : 'linear-gradient(135deg, #FF2020, #cc1a1a)',
                                boxShadow: isPending ? 'none' : '0 4px 20px rgba(255,32,32,0.3)',
                            }}
                        >
                            {isPending ? "Tekshirilmoqda..." : "Kirish"}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 24 }}>
                    made by: <a href="https://t.me/notience" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#FF2020')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>E.B.A team</a>
                </p>
            </div>
        </div>
    );
}

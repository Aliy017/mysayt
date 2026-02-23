import { NextResponse } from "next/server";
import { handleUpdate } from "@/lib/botHandlers";
import type { TelegramUpdate } from "@/lib/bot";

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Global offset — serverda saqlanadi
let lastOffset = 0;

// GET /api/bot/poll — har safar 1 ta poll qiladi
// Brauzer JavaScript auto-refresh qiladi
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const html = searchParams.get("html");

    // HTML sahifa so'ralgan bo'lsa
    if (html === "1") {
        return new Response(POLL_PAGE_HTML, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    }

    if (!BOT_TOKEN) {
        return NextResponse.json({ error: "BOT_TOKEN topilmadi" }, { status: 500 });
    }

    try {
        const res = await fetch(
            `${API}/getUpdates?offset=${lastOffset}&timeout=2&limit=10`,
            { cache: "no-store" }
        );
        const data = await res.json();

        if (!data.ok) {
            return NextResponse.json({ error: "Telegram API xato", details: data }, { status: 502 });
        }

        if (!data.result?.length) {
            return NextResponse.json({ status: "waiting", offset: lastOffset });
        }

        const results = [];
        for (const update of data.result as TelegramUpdate[]) {
            lastOffset = update.update_id + 1;
            const text = update.message?.text || update.callback_query?.data || "";
            const from = update.message?.from?.first_name || update.callback_query?.from?.first_name || "";

            try {
                await handleUpdate(update);
                results.push({ from, text, ok: true });
            } catch (e) {
                results.push({ from, text, error: String(e) });
            }
        }

        return NextResponse.json({ processed: results.length, results, offset: lastOffset });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// Auto-polling HTML sahifa
const POLL_PAGE_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>🤖 Bot Polling</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0f;color:#e0e0e0;font-family:'Segoe UI',monospace;padding:20px}
h1{color:#FF2020;font-size:20px;margin-bottom:8px}
.status{color:#888;font-size:13px;margin-bottom:16px}
#log{background:#12121a;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;
height:80vh;overflow-y:auto;font-size:13px;line-height:1.8}
.msg{padding:4px 8px;border-radius:4px;margin:2px 0}
.msg.ok{background:rgba(34,197,94,0.08)}
.msg.err{background:rgba(239,68,68,0.08);color:#ef4444}
.msg.wait{color:#666}
.time{color:#555;margin-right:8px}
.from{color:#FF2020;font-weight:600}
.controls{margin-bottom:12px;display:flex;gap:8px;align-items:center}
button{background:#FF2020;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px}
button:hover{background:#dd1a1a}
button.off{background:#333}
.badge{display:inline-block;background:rgba(34,197,94,0.2);color:#22c55e;padding:2px 8px;border-radius:4px;font-size:11px}
</style></head><body>
<h1>🤖 MySayt Bot — Dev Polling</h1>
<p class="status">Telegramda /start yuboring, bu sahifa avtomatik yangilanadi</p>
<div class="controls">
<button id="toggleBtn" onclick="toggle()">⏸ To'xtatish</button>
<span id="statusBadge" class="badge">● Faol</span>
<span style="color:#555;font-size:12px" id="counter">Poll: 0</span>
</div>
<div id="log"></div>
<script>
let active = true;
let count = 0;
const log = document.getElementById('log');
const btn = document.getElementById('toggleBtn');
const badge = document.getElementById('statusBadge');
const counter = document.getElementById('counter');

function addLog(text, cls) {
    const d = document.createElement('div');
    d.className = 'msg ' + (cls || '');
    const t = new Date().toLocaleTimeString();
    d.innerHTML = '<span class="time">' + t + '</span> ' + text;
    log.appendChild(d);
    if (log.children.length > 200) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
}

function toggle() {
    active = !active;
    btn.textContent = active ? '⏸ To\\'xtatish' : '▶️ Davom';
    btn.className = active ? '' : 'off';
    badge.textContent = active ? '● Faol' : '● To\\'xtatilgan';
    badge.style.color = active ? '#22c55e' : '#888';
    badge.style.background = active ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)';
    if (active) poll();
}

async function poll() {
    if (!active) return;
    try {
        count++;
        counter.textContent = 'Poll: ' + count;
        const res = await fetch('/api/bot/poll');
        const data = await res.json();
        
        if (data.error) {
            addLog('❌ ' + data.error, 'err');
        } else if (data.results) {
            for (const r of data.results) {
                if (r.ok) {
                    addLog('📩 <span class="from">' + r.from + '</span>: "' + r.text + '" → ✅ Javob yuborildi', 'ok');
                } else {
                    addLog('📩 ' + r.from + ': "' + r.text + '" → ❌ ' + r.error, 'err');
                }
            }
        }
    } catch(e) {
        addLog('⚠️ ' + e.message, 'err');
    }
    setTimeout(poll, 2000);
}

addLog('🚀 Polling boshlandi...', 'wait');
poll();
</script></body></html>`;

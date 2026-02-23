import { prisma } from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
    sendMessage,
    sendReplyKeyboard,
    sendKeyboard,
    answerCallback,
    sendChatAction,
    sendMessageWithEffect,
    type TelegramUpdate,
} from "@/lib/bot";

// ══════════════ PREMIUM CUSTOM EMOJI ID LAR ══════════════
// RestrictedEmoji paketidan haqiqiy animatsiyali emoji ID lar
// https://t.me/addemoji/RestrictedEmoji
const CE = {
    fire: "5420315771991497307",  // 🔥 Fire
    check: "5427009714745517609",  // ✅ Green check
    rocket: "5445284980978621387",  // 🚀 Rocket
    gem: "5471952986970267163",  // 💎 Diamond
    thumbsUp: "5469770542288478598",  // 👍 Thumbs up
    heart: "5449505950283078474",  // ❤️ Heart
    key: "5330115548900501467",  // 🔑 Key
    wave: "5472055112702629499",  // 👋 Wave
    trophy: "5409008750893734809",  // 🏆 Trophy
    sparkle: "5472164874886846699",  // ✨ Sparkle
    user: "5373012449597335010",  // 👤 User
    new: "5361979468887893611",  // 🆕 New
    chart: "5431577498364158238",  // 📊 Chart
    chartUp: "5373001317042101552",  // 📈 Chart up
    bell: "5242628160297641831",  // 🔔 Bell
    globe: "5399898266265475100",  // 🌍 Globe
    users: "5372926953978341366",  // 👥 Users
    search: "5188217332748527444",  // 🔍 Search
    phone: "5467539229468793355",  // 📞 Phone
    money: "5375296873982604963",  // 💰 Money
    party: "5436040291507247633",  // 🎉 Party
    sleep: "5451959871257713464",  // 💤 Sleep
    cross: "5465665476971471368",  // ❌ Cross
    memo: "5334882760735598374",  // 📝 Memo
    bulb: "5472146462362048818",  // 💡 Bulb
    palette: "5431456208487716895",  // 🎨 Palette
    handshake: "5357080225463149588", // 🤝 Handshake
    briefcase: "5359785904535774578", // 💼 Briefcase
    medal: "5334644364280866007",  // 🏅 Medal
    badge: "5332547853304734597",  // 🎖 Badge
    refresh: "5264727218734524899",  // 🔄 Refresh
    folder: "5431736674147114227",  // 🗂 Folder
    star: "5431577498364158238",  // ⭐ Star (chart bilan bir xil, lekin star uchun)
    warning: "5465665476971471368",  // ⚠️ Warning (cross bilan bir xil)
    shield: "5330115548900501467",  // 🛡 Shield (key bilan bir xil)
    target: "5188217332748527444",  // 🎯 Target (search bilan bir xil)
};

// Message Effect ID lar (xabar yuborilganda animatsiya)
const EFFECTS = {
    fire: "5104841245755180586",  // 🔥
    thumbsUp: "5107584321108051014",  // 👍
    heart: "5159385139981059251",  // ❤️
    party: "5046509860389126442",  // 🎉
};

// ══════════════ ROLE-BASED MENYU ══════════════

function getMenuButtons(role: string): string[][] {
    const base = [
        ["📊 Bugungi stat", "📋 Leadlar"],
        ["📈 Haftalik", "📅 Oylik"],
        ["🔔 Habarnomalar", "⚙️ Sozlamalar"],
    ];

    if (role === "SUPER_ADMIN") {
        base.push(["🌐 Saytlarim", "👥 Adminlarim"]);
    }

    if (role === "TEAM_ADMIN") {
        base.push(["🌐 Barcha saytlar", "👥 Barcha foydalanuvchilar"]);
    }

    base.push(["🚪 Chiqish"]);
    return base;
}

const ROLE_LABELS: Record<string, string> = {
    TEAM_ADMIN: "🏆 TeamAdmin",
    SUPER_ADMIN: "⭐ SuperAdmin",
    ADMIN: "👤 Admin",
};

const ROLE_EMOJI: Record<string, string> = {
    TEAM_ADMIN: "🏆",
    SUPER_ADMIN: "⭐",
    ADMIN: "👤",
};

// ══════════════ GURUH FAOLLIK HOLATI ══════════════
const activeGroups = new Set<number>();

// ══════════════ PREMIUM HELPERS ══════════════

// Session cache — DB ga har safar bormaslik uchun
const sessionCache = new Map<string, { session: { id: string; userId: string | null; state: string; tempLogin: string | null }; ts: number }>();
const SESSION_TTL = 30000; // 30 soniya

function getCachedSession(key: string) {
    const c = sessionCache.get(key);
    if (c && Date.now() - c.ts < SESSION_TTL) return c.session;
    sessionCache.delete(key);
    return null;
}

function setCachedSession(key: string, session: { id: string; userId: string | null; state: string; tempLogin: string | null }) {
    sessionCache.set(key, { session, ts: Date.now() });
    // Cache hajmini cheklash
    if (sessionCache.size > 100) {
        const oldest = sessionCache.keys().next().value;
        if (oldest) sessionCache.delete(oldest);
    }
}

function clearCachedSession(key: string) {
    sessionCache.delete(key);
}

async function typeAndSend(chatId: number, text: string, effectId?: string) {
    await sendChatAction(chatId, "typing");
    if (effectId) {
        return sendMessageWithEffect(chatId, text, effectId);
    }
    return sendMessage(chatId, text);
}

// ══════════════ UPDATE HANDLER ══════════════

export async function handleUpdate(update: TelegramUpdate) {
    if (update.callback_query) {
        return handleCallback(update.callback_query);
    }

    const msg = update.message;
    if (!msg?.text || !msg.from) return;

    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    const text = msg.text.trim();
    const cleanText = text.replace(/@\w+/g, "").trim();

    // ══════ GURUH /start va /stop ══════
    if (isGroup) {
        if (cleanText === "/start") {
            activeGroups.add(chatId);
        } else if (cleanText === "/stop") {
            activeGroups.delete(chatId);
            return typeAndSend(chatId,
                "🔇 <b>Bot to'xtatildi</b>\n\n" +
                "Qayta yoqish uchun /start bosing."
            );
        } else if (!activeGroups.has(chatId)) {
            return;
        }
    }

    // BotSession (cached)
    const cacheKey = String(userId);
    let session: { id: string; userId: string | null; state: string; tempLogin: string | null } | null = getCachedSession(cacheKey);

    if (!session) {
        const dbSession = await prisma.botSession.findUnique({
            where: { telegramChatId: cacheKey },
        });
        if (dbSession) {
            session = dbSession;
        } else {
            session = await prisma.botSession.create({
                data: { telegramChatId: cacheKey, state: "idle" },
            });
        }
        setCachedSession(cacheKey, session);
    }

    // ══════ STATE MACHINE ══════

    // 1) /start — Login oqimi
    if (cleanText === "/start" || (!session.userId && session.state === "idle")) {
        const updated = await prisma.botSession.update({
            where: { id: session.id },
            data: { state: "awaiting_login", userId: null, tempLogin: null },
        });
        setCachedSession(cacheKey, updated);

        const name = msg.from.first_name || "Foydalanuvchi";

        if (isGroup) {
            return typeAndSend(chatId,
                `🛡 <b>MySayt Admin Bot</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `Salom, <b>${name}</b>!\n\n` +
                `Tizimga kirish uchun <b>login</b>ingizni yuboring.\n\n` +
                `⚠️ <i>Xavfsizlik uchun login/parolni\nshaxsiy chatda yuborish tavsiya etiladi.</i>`
            );
        }

        return typeAndSend(chatId,
            `🛡 <b>MySayt Admin Bot</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Salom, <b>${name}</b>! 👋\n\n` +
            `Tizimga kirish uchun\n<b>login</b>ingizni yuboring:`
        );
    }

    // 2) Login kutilmoqda
    if (session.state === "awaiting_login") {
        await prisma.botSession.update({
            where: { id: session.id },
            data: { state: "awaiting_password", tempLogin: cleanText },
        });
        clearCachedSession(cacheKey);
        return typeAndSend(chatId, "🔑 Endi <b>parol</b>ingizni yuboring:");
    }

    // 3) Parol kutilmoqda
    if (session.state === "awaiting_password") {
        const login = session.tempLogin;
        if (!login) {
            await prisma.botSession.update({
                where: { id: session.id },
                data: { state: "awaiting_login", tempLogin: null },
            });
            clearCachedSession(cacheKey);
            return typeAndSend(chatId, "❌ Xato yuz berdi.\n\nQaytadan <b>login</b> kiriting:");
        }

        const user = await prisma.user.findUnique({ where: { login } });

        if (!user || !user.isActive) {
            await prisma.botSession.update({
                where: { id: session.id },
                data: { state: "awaiting_login", tempLogin: null },
            });
            clearCachedSession(cacheKey);
            return typeAndSend(chatId,
                "❌ <b>Login yoki parol noto'g'ri</b>\n\n" +
                "Qaytadan <b>login</b> kiriting:"
            );
        }

        const valid = await bcrypt.compare(cleanText, user.password);
        if (!valid) {
            await prisma.botSession.update({
                where: { id: session.id },
                data: { state: "awaiting_login", tempLogin: null },
            });
            clearCachedSession(cacheKey);
            return typeAndSend(chatId,
                "❌ <b>Login yoki parol noto'g'ri</b>\n\n" +
                "Qaytadan <b>login</b> kiriting:"
            );
        }

        // ✅ Muvaffaqiyatli login — 🎉 party effect bilan
        await prisma.botSession.update({
            where: { id: session.id },
            data: { state: "idle", userId: user.id, tempLogin: null },
        });
        clearCachedSession(cacheKey);

        await prisma.user.update({
            where: { id: user.id },
            data: { telegramChatId: String(userId) },
        });

        const roleLabel = ROLE_LABELS[user.role] || user.role;

        if (isGroup) {
            return typeAndSend(chatId,
                `✅ <b>Kirish muvaffaqiyatli!</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `👤 <b>${user.name}</b>\n` +
                `${ROLE_EMOJI[user.role] || "🏷"} Rol: <b>${roleLabel}</b>\n\n` +
                `📋 Komandalar:` + getGroupCommandsText(user.role),
                EFFECTS.party
            );
        }

        // Private chatda reply keyboard bilan — effect ishlatish mumkin emas reply keyboard da
        await sendChatAction(chatId, "typing");
        return sendReplyKeyboard(
            chatId,
            `✅ <b>Xush kelibsiz!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `👤 <b>${user.name}</b>\n` +
            `${ROLE_EMOJI[user.role] || "🏷"} Rol: <b>${roleLabel}</b>\n\n` +
            `Quyidagi menyudan foydalaning 👇`,
            getMenuButtons(user.role)
        );
    }

    // 4) Login qilinmagan
    if (!session.userId) {
        await prisma.botSession.update({
            where: { id: session.id },
            data: { state: "awaiting_login" },
        });
        clearCachedSession(cacheKey);
        return typeAndSend(chatId,
            "🔐 Avval tizimga kiring.\n\n<b>Login</b>ingizni yuboring:"
        );
    }

    // Foydalanuvchi ma'lumotlari
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { sites: { include: { site: true } } },
    });

    if (!user || !user.isActive) {
        await prisma.botSession.update({
            where: { id: session.id },
            data: { state: "awaiting_login", userId: null },
        });
        clearCachedSession(cacheKey);
        return typeAndSend(chatId, "❌ Akkount faol emas.\n\nQaytadan <b>login</b> kiriting:");
    }

    // ══════ KOMANDALAR ══════
    const cmd = cleanText;

    if (cmd === "🚪 Chiqish" || cmd === "/logout") {
        await prisma.botSession.update({
            where: { id: session.id },
            data: { state: "idle", userId: null, tempLogin: null, activeSiteId: null },
        });
        clearCachedSession(cacheKey);
        await prisma.user.update({
            where: { id: user.id },
            data: { telegramChatId: null },
        });
        return typeAndSend(chatId,
            "👋 <b>Tizimdan chiqdingiz</b>\n" +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "Qayta kirish uchun /start bosing."
        );
    }

    if (cmd === "📊 Bugungi stat" || cmd === "/today") {
        await sendChatAction(chatId, "typing");
        return handleTodayStats(chatId, user);
    }

    if (cmd === "📋 Leadlar" || cmd === "/leads") {
        await sendChatAction(chatId, "typing");
        return handleLeadsList(chatId, user);
    }

    if (cmd === "📈 Haftalik" || cmd === "/weekly") {
        await sendChatAction(chatId, "typing");
        return handleWeeklyStats(chatId, user);
    }

    if (cmd === "📅 Oylik" || cmd === "/monthly") {
        await sendChatAction(chatId, "typing");
        return handleMonthlyStats(chatId, user);
    }

    if (cmd === "🔔 Habarnomalar" || cmd === "/notifications") {
        await sendChatAction(chatId, "typing");
        return handleNotifications(chatId, user);
    }

    if (cmd === "⚙️ Sozlamalar" || cmd === "/settings") {
        return handleSettings(chatId, user);
    }

    if ((cmd === "🌐 Saytlarim" || cmd === "/mysites") && user.role === "SUPER_ADMIN") {
        await sendChatAction(chatId, "typing");
        return handleMySites(chatId, user);
    }

    if ((cmd === "🌐 Barcha saytlar" || cmd === "/allsites") && user.role === "TEAM_ADMIN") {
        await sendChatAction(chatId, "typing");
        return handleAllSites(chatId);
    }

    if ((cmd === "👥 Adminlarim" || cmd === "/myadmins") && user.role === "SUPER_ADMIN") {
        await sendChatAction(chatId, "typing");
        return handleMyAdmins(chatId, user);
    }

    if ((cmd === "👥 Barcha foydalanuvchilar" || cmd === "/allusers") && user.role === "TEAM_ADMIN") {
        await sendChatAction(chatId, "typing");
        return handleAllUsers(chatId);
    }

    if (cmd === "/help" || cmd === "/menu") {
        if (isGroup) {
            return typeAndSend(chatId,
                `📋 <b>Komandalar ro'yxati</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━` +
                getGroupCommandsText(user.role)
            );
        }
        return sendReplyKeyboard(chatId,
            `📋 <b>Menyu</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Tugmalardan birini tanlang 👇`,
            getMenuButtons(user.role)
        );
    }

    if (isGroup) return;

    return typeAndSend(chatId,
        "🤷 Noma'lum komanda\n\n" +
        "/help yoki /menu bosing"
    );
}

// ══════════════ GURUH KOMANDALAR MATNI ══════════════

function getGroupCommandsText(role: string): string {
    let text = `
━━━━━━━━━━━━━━━━━━━━
/today — 📊 Bugungi statistika
/leads — 📋 Oxirgi leadlar
/weekly — 📈 Haftalik hisobot
/monthly — 📅 Oylik hisobot
/notifications — 🔔 Habarnomalar
/settings — ⚙️ Sozlamalar`;

    if (role === "SUPER_ADMIN") {
        text += `
/mysites — 🌐 Saytlarim
/myadmins — 👥 Adminlarim`;
    }

    if (role === "TEAM_ADMIN") {
        text += `
/allsites — 🌐 Barcha saytlar
/allusers — 👥 Barcha foydalanuvchilar`;
    }

    text += `
━━━━━━━━━━━━━━━━━━━━
/stop — 🔇 Botni to'xtatish
/logout — 🚪 Chiqish
/help — 📋 Komandalar`;

    return text;
}

// ══════════════ CALLBACK HANDLER ══════════════

async function handleCallback(query: { id: string; from: { id: number }; message?: { chat: { id: number }; message_id: number }; data?: string }) {
    const chatId = query.message?.chat.id || query.from.id;
    const fromId = query.from.id;
    const data = query.data || "";

    await answerCallback(query.id);

    if (data === "notify_on" || data === "notify_off") {
        const session = await prisma.botSession.findUnique({
            where: { telegramChatId: String(fromId) },
        });
        if (session?.userId) {
            await prisma.user.update({
                where: { id: session.userId },
                data: { notifyNewLead: data === "notify_on" },
            });
            return sendMessage(
                chatId,
                data === "notify_on"
                    ? "✅ Yangi lead bildirishnomalari <b>yoqildi</b> 🔔"
                    : "🔕 Yangi lead bildirishnomalari <b>o'chirildi</b>"
            );
        }
    }

    if (data.startsWith("lead_")) {
        const leadId = data.replace("lead_", "");
        await sendChatAction(chatId, "typing");
        return handleLeadDetail(chatId, leadId);
    }

    // ═══ Leads pagination ═══
    if (data.startsWith("lp_")) {
        // lp_PAGE_STATUS  (masalan: lp_2_ALL yoki lp_0_NEW)
        const parts = data.split("_");
        const page = parseInt(parts[1]) || 0;
        const statusFilter = parts[2] || "ALL";
        const session = await prisma.botSession.findUnique({
            where: { telegramChatId: String(fromId) },
        });
        if (session?.userId) {
            const user = await prisma.user.findUnique({
                where: { id: session.userId },
                include: { sites: { include: { site: true } } },
            });
            if (user) {
                await sendChatAction(chatId, "typing");
                return handleLeadsList(chatId, user, page, statusFilter);
            }
        }
    }

    // ═══ Leads status filter ═══
    if (data.startsWith("lf_")) {
        const statusFilter = data.replace("lf_", "");
        const session = await prisma.botSession.findUnique({
            where: { telegramChatId: String(fromId) },
        });
        if (session?.userId) {
            const user = await prisma.user.findUnique({
                where: { id: session.userId },
                include: { sites: { include: { site: true } } },
            });
            if (user) {
                await sendChatAction(chatId, "typing");
                return handleLeadsList(chatId, user, 0, statusFilter);
            }
        }
    }

    // Lead status o'zgartirish
    if (data.startsWith("st_")) {
        const parts = data.split("_");
        if (parts.length >= 3) {
            const newStatus = parts[1];
            const leadId = parts.slice(2).join("_");
            try {
                await prisma.lead.update({
                    where: { id: leadId },
                    data: { status: newStatus as LeadStatus },
                });
                const label = STATUS_LABELS[newStatus] || newStatus;
                return sendMessage(chatId,
                    `✅ Lead statusi <b>${label}</b> ga o'zgartirildi!`
                );
            } catch {
                return sendMessage(chatId, "❌ Status o'zgartirish muvaffaqiyatsiz.");
            }
        }
    }
}

const STATUS_LABELS: Record<string, string> = {
    NEW: "🔵 Yangi",
    CONTACTED: "🟡 Bog'lanildi",
    QUALIFIED: "🟢 Tasdiqlandi",
    PROPOSAL: "🟣 Taklif",
    WON: "✅ Shartnoma",
    LOST: "🔴 Rad",
};

// ══════════════ HANDLER FUNKSIYALAR ══════════════

interface UserWithSites {
    id: string;
    name: string;
    role: string;
    sites: { site: { id: string; domain: string; name: string } }[];
}

function getUserSiteIds(user: UserWithSites): string[] | null {
    if (user.role === "TEAM_ADMIN") return null;
    return user.sites.map(s => s.site.id);
}

function buildSiteFilter(user: UserWithSites) {
    const siteIds = getUserSiteIds(user);
    return siteIds ? { siteId: { in: siteIds } } : {};
}

// ═══════ Bugungi stat ═══════
async function handleTodayStats(chatId: number, user: UserWithSites) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const filter = buildSiteFilter(user);
    const [count, byStatus, bySite] = await Promise.all([
        prisma.lead.count({
            where: { ...filter, createdAt: { gte: todayStart } },
        }),
        prisma.lead.groupBy({
            by: ["status"],
            where: { ...filter, createdAt: { gte: todayStart } },
            _count: { id: true },
        }),
        prisma.lead.groupBy({
            by: ["siteId"],
            where: { ...filter, createdAt: { gte: todayStart } },
            _count: { id: true },
        }),
    ]);

    let msg = `📊 <b>Bugungi statistika</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `🆕 Jami yangi leadlar: <b>${count}</b>\n`;

    if (byStatus.length > 0) {
        msg += `\n📊 <b>Status bo'yicha:</b>\n`;
        for (const s of byStatus) {
            const bar = generateMiniBar(s._count.id, count);
            msg += `  ${STATUS_LABELS[s.status] || s.status}: <b>${s._count.id}</b> ${bar}\n`;
        }
    }

    if (bySite.length > 0) {
        msg += `\n🌐 <b>Sayt bo'yicha:</b>\n`;
        const sites = await prisma.site.findMany({
            where: { id: { in: bySite.map(s => s.siteId) } },
            select: { id: true, domain: true },
        });
        const siteMap = Object.fromEntries(sites.map(s => [s.id, s.domain]));
        for (const s of bySite) {
            msg += `  🌍 ${siteMap[s.siteId] || "?"}: <b>${s._count.id}</b>\n`;
        }
    }

    if (count === 0) {
        msg += `\n💤 <i>Bugun hali lead kelmagan</i>`;
    }

    return sendMessage(chatId, msg);
}

// ═══════ Leadlar ro'yxati (PREMIUM — pagination + filter) ═══════
const LEADS_PER_PAGE = 5;

async function handleLeadsList(chatId: number, user: UserWithSites, page: number = 0, statusFilter: string = "ALL") {
    const siteFilter = buildSiteFilter(user);
    const where = {
        ...siteFilter,
        ...(statusFilter !== "ALL" ? { status: statusFilter as LeadStatus } : {}),
    };

    // Parallel: count + leads + status counts
    const [total, leads, statusCounts] = await Promise.all([
        prisma.lead.count({ where }),
        prisma.lead.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: page * LEADS_PER_PAGE,
            take: LEADS_PER_PAGE,
            include: { site: { select: { domain: true } } },
        }),
        prisma.lead.groupBy({
            by: ["status"],
            where: siteFilter,
            _count: { id: true },
        }),
    ]);

    const totalAll = statusCounts.reduce((sum, s) => sum + s._count.id, 0);
    const totalPages = Math.ceil(total / LEADS_PER_PAGE);

    // ═══ Header ═══
    const filterLabel = statusFilter === "ALL" ? "Barcha" : (STATUS_LABELS[statusFilter] || statusFilter);
    let msg = `📋 <b>${filterLabel} leadlar</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Status summary line
    const statusSummary = statusCounts
        .map(s => `${STATUS_LABELS[s.status]?.split(" ")[0] || "⚪"} ${s._count.id}`)
        .join(" · ");
    msg += `📊 Jami: <b>${totalAll}</b> lead  ${statusSummary}\n`;

    if (statusFilter !== "ALL") {
        msg += `🔍 Filter: <b>${filterLabel}</b> — <b>${total}</b> ta topildi\n`;
    }
    msg += `\n`;

    if (leads.length === 0) {
        msg += `💤 <i>Bu filterda lead topilmadi</i>`;
    }

    // ═══ Lead cards ═══
    const buttons: { text: string; callback_data: string; icon_custom_emoji_id?: string }[][] = [];

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        const statusIcon = STATUS_LABELS[lead.status]?.split(" ")[0] || "⚪";
        const timeAgo = getTimeAgo(lead.createdAt);
        const num = page * LEADS_PER_PAGE + i + 1;

        msg += `<b>${num}.</b> ${statusIcon} <b>${lead.name}</b>\n`;
        msg += `     📞 <code>${lead.phone}</code>\n`;
        msg += `     🌐 ${lead.site.domain} · 🕐 ${timeAgo}\n\n`;

        // Premium icon button — custom emoji
        const statusCE = STATUS_CE[lead.status] || CE.user;
        buttons.push([{
            text: `${lead.name} — ${lead.site.domain}`,
            callback_data: `lead_${lead.id}`,
            icon_custom_emoji_id: statusCE,
        }]);
    }

    // ═══ Pagination tugmalari ═══
    if (totalPages > 1) {
        msg += `\n📄 Sahifa <b>${page + 1}</b> / <b>${totalPages}</b>\n`;

        const navRow: { text: string; callback_data: string; icon_custom_emoji_id?: string }[] = [];

        if (page > 0) {
            navRow.push({
                text: `Oldingi`,
                callback_data: `lp_${page - 1}_${statusFilter}`,
                icon_custom_emoji_id: CE.rocket,
            });
        }

        navRow.push({
            text: `${page + 1} / ${totalPages}`,
            callback_data: `lp_${page}_${statusFilter}`,
            icon_custom_emoji_id: CE.chart,
        });

        if (page < totalPages - 1) {
            navRow.push({
                text: `Keyingi`,
                callback_data: `lp_${page + 1}_${statusFilter}`,
                icon_custom_emoji_id: CE.rocket,
            });
        }

        buttons.push(navRow);
    }

    // ═══ Status filter tugmalari ═══
    const filterRow1: { text: string; callback_data: string; icon_custom_emoji_id?: string }[] = [];
    const filterRow2: { text: string; callback_data: string; icon_custom_emoji_id?: string }[] = [];

    // "Barchasi" tugmasi
    filterRow1.push({
        text: statusFilter === "ALL" ? "✦ Barchasi" : "Barchasi",
        callback_data: "lf_ALL",
        icon_custom_emoji_id: CE.star,
    });

    const filterStatuses = [
        { key: "NEW", label: "Yangi", ce: CE.new },
        { key: "CONTACTED", label: "Aloqa", ce: CE.target },
        { key: "QUALIFIED", label: "Tasd.", ce: CE.check },
    ];
    const filterStatuses2 = [
        { key: "PROPOSAL", label: "Taklif", ce: CE.rocket },
        { key: "WON", label: "Shart.", ce: CE.trophy },
        { key: "LOST", label: "Rad", ce: CE.fire },
    ];

    for (const fs of filterStatuses) {
        const isActive = statusFilter === fs.key;
        filterRow1.push({
            text: isActive ? `✦ ${fs.label}` : fs.label,
            callback_data: `lf_${fs.key}`,
            icon_custom_emoji_id: fs.ce,
        });
    }
    for (const fs of filterStatuses2) {
        const isActive = statusFilter === fs.key;
        filterRow2.push({
            text: isActive ? `✦ ${fs.label}` : fs.label,
            callback_data: `lf_${fs.key}`,
            icon_custom_emoji_id: fs.ce,
        });
    }

    buttons.push(filterRow1);
    buttons.push(filterRow2);

    return sendKeyboard(chatId, msg, buttons);
}

// Status → Custom Emoji mapping
const STATUS_CE: Record<string, string> = {
    NEW: CE.new,
    CONTACTED: CE.target,
    QUALIFIED: CE.check,
    PROPOSAL: CE.rocket,
    WON: CE.trophy,
    LOST: CE.fire,
};

// Oddiy emojisiz status nomlari (tugmalar uchun)
const STATUS_CLEAN: Record<string, string> = {
    NEW: "Yangi",
    CONTACTED: "Aloqa",
    QUALIFIED: "Tasdiq",
    PROPOSAL: "Taklif",
    WON: "Shartnoma",
    LOST: "Rad",
};

// ═══════ Haftalik ═══════
async function handleWeeklyStats(chatId: number, user: UserWithSites) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const filter = buildSiteFilter(user);

    const [thisWeek, prevWeek] = await Promise.all([
        prisma.lead.count({ where: { ...filter, createdAt: { gte: weekStart } } }),
        prisma.lead.count({ where: { ...filter, createdAt: { gte: prevWeekStart, lt: weekStart } } }),
    ]);

    const change = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : (thisWeek > 0 ? 100 : 0);
    const arrow = change >= 0 ? "📈" : "📉";
    const barThis = generateBar(thisWeek, Math.max(thisWeek, prevWeek));
    const barPrev = generateBar(prevWeek, Math.max(thisWeek, prevWeek));

    let msg = `📈 <b>Haftalik hisobot</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `Bu hafta:     <b>${thisWeek}</b> lead\n`;
    msg += `${barThis}\n\n`;
    msg += `O'tgan hafta: <b>${prevWeek}</b> lead\n`;
    msg += `${barPrev}\n\n`;
    msg += `${arrow} O'zgarish: <b>${change >= 0 ? "+" : ""}${change}%</b>`;

    if (change > 0) {
        msg += ` 🔥`;
    }

    return sendMessage(chatId, msg);
}

// ═══════ Oylik ═══════
async function handleMonthlyStats(chatId: number, user: UserWithSites) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const filter = buildSiteFilter(user);

    const [thisMonth, prevMonth, leads] = await Promise.all([
        prisma.lead.count({ where: { ...filter, createdAt: { gte: monthStart } } }),
        prisma.lead.count({ where: { ...filter, createdAt: { gte: prevMonthStart, lt: monthStart } } }),
        prisma.lead.findMany({
            where: { ...filter, createdAt: { gte: monthStart } },
            select: { createdAt: true },
        }),
    ]);

    const change = prevMonth > 0 ? Math.round(((thisMonth - prevMonth) / prevMonth) * 100) : (thisMonth > 0 ? 100 : 0);
    const arrow = change >= 0 ? "📈" : "📉";

    const dayMap: Record<string, number> = {};
    for (const l of leads) {
        const day = l.createdAt.toISOString().split("T")[0];
        dayMap[day] = (dayMap[day] || 0) + 1;
    }
    const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];

    let msg = `📅 <b>Oylik hisobot</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `Bu oy:     <b>${thisMonth}</b> lead\n`;
    msg += `O'tgan oy: <b>${prevMonth}</b> lead\n`;
    msg += `${arrow} O'zgarish: <b>${change >= 0 ? "+" : ""}${change}%</b>`;
    if (change > 0) msg += ` 🔥`;
    msg += `\n`;

    if (bestDay) {
        msg += `\n🏆 Eng yaxshi kun: <b>${bestDay[0]}</b> (${bestDay[1]} lead)`;
    }

    // Mini grafik (oxirgi kunlar)
    const last7 = Object.entries(dayMap).slice(-7);
    if (last7.length > 0) {
        msg += `\n\n📊 <b>Oxirgi kunlar:</b>\n`;
        const maxVal = Math.max(...last7.map(([, v]) => v));
        for (const [day, count] of last7) {
            const bar = generateBar(count, maxVal);
            const shortDay = day.split("-").slice(1).join("/");
            msg += `<code>${shortDay}</code> ${bar} <b>${count}</b>\n`;
        }
    }

    return sendMessage(chatId, msg);
}

// ═══════ Habarnomalar ═══════
async function handleNotifications(chatId: number, user: UserWithSites) {
    const notifs = await prisma.notification.findMany({
        where: { receiverId: user.id, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    if (notifs.length === 0) {
        return sendMessage(chatId,
            "🔔 <b>Habarnomalar</b>\n" +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "✅ O'qilmagan habarnomalar yo'q"
        );
    }

    let msg = `🔔 <b>O'qilmagan (${notifs.length})</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const n of notifs) {
        const timeAgo = getTimeAgo(n.createdAt);
        msg += `📌 <b>${n.title}</b>\n`;
        if (n.message) msg += `    ${n.message}\n`;
        msg += `    🕐 ${timeAgo}\n\n`;
    }

    await prisma.notification.updateMany({
        where: { receiverId: user.id, isRead: false },
        data: { isRead: true },
    });

    msg += "✅ <i>Barchasi o'qildi deb belgilandi</i>";

    return sendMessage(chatId, msg);
}

// ═══════ Sozlamalar ═══════
async function handleSettings(chatId: number, user: UserWithSites) {
    const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { notifyNewLead: true },
    });

    const isOn = fullUser?.notifyNewLead || false;

    // Premium: tugmada icon_custom_emoji_id
    return sendKeyboard(
        chatId,
        `⚙️ <b>Sozlamalar</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🔔 Yangi lead xabarlari:\n` +
        `<b>${isOn ? "✅ Yoqilgan" : "❌ O'chirilgan"}</b>\n\n` +
        `👤 <b>${user.name}</b> · ${ROLE_LABELS[user.role] || user.role}`,
        [
            [
                {
                    text: isOn ? "O'chirish" : "Yoqish",
                    callback_data: isOn ? "notify_off" : "notify_on",
                    icon_custom_emoji_id: isOn ? CE.warning : CE.bell,
                },
                {
                    text: "Menyu",
                    callback_data: "noop",
                    icon_custom_emoji_id: CE.star,
                },
            ],
        ]
    );
}

// ═══════ Lead tafsiloti ═══════
async function handleLeadDetail(chatId: number, leadId: string) {
    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { site: { select: { domain: true, name: true } } },
    });

    if (!lead) {
        return sendMessage(chatId, "❌ Lead topilmadi.");
    }

    let msg = `📋 <b>Lead tafsiloti</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `👤 Ism: <b>${lead.name}</b>\n`;
    msg += `📞 Tel: <code>${lead.phone}</code>\n`;
    msg += `🌐 Sayt: <b>${lead.site.domain}</b> (${lead.site.name})\n`;
    msg += `📊 Status: ${STATUS_LABELS[lead.status] || lead.status}\n`;
    if (lead.goal) msg += `🎯 Maqsad: ${lead.goal}\n`;
    if (lead.revenue) msg += `💰 Daromad: ${lead.revenue}\n`;
    if (lead.source) msg += `📡 Manba: ${lead.source}\n`;
    if (lead.notes) msg += `📝 Eslatma: ${lead.notes}\n`;
    msg += `\n🕐 ${getTimeAgo(lead.createdAt)}`;
    msg += `\n📅 ${lead.createdAt.toLocaleString("uz-UZ")}`;

    // Premium status o'zgartirish tugmalari
    const statuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];
    const statusEmojis: Record<string, string> = {
        NEW: CE.new, CONTACTED: CE.target, QUALIFIED: CE.check,
        PROPOSAL: CE.rocket, WON: CE.trophy, LOST: CE.fire,
    };

    const row1: { text: string; callback_data: string; icon_custom_emoji_id?: string }[] = [];
    const row2: { text: string; callback_data: string; icon_custom_emoji_id?: string }[] = [];

    for (const st of statuses) {
        if (st === lead.status) continue;
        // Oddiy emojisiz — faqat matn, premium icon ko'rsatadi
        const label = STATUS_CLEAN[st] || st;
        const btn = {
            text: label,
            callback_data: `st_${st}_${lead.id}`,
            icon_custom_emoji_id: statusEmojis[st],
        };
        if (row1.length < 3) row1.push(btn);
        else row2.push(btn);
    }

    const buttons: { text: string; callback_data: string; icon_custom_emoji_id?: string }[][] = [];
    if (row1.length) buttons.push(row1);
    if (row2.length) buttons.push(row2);

    return sendKeyboard(chatId, msg, buttons);
}

// ═══════ Saytlarim (SD) ═══════
async function handleMySites(chatId: number, user: UserWithSites) {
    if (user.sites.length === 0) {
        return sendMessage(chatId, "🌐 Sizga hech qanday sayt biriktirilmagan.");
    }

    const siteIds = user.sites.map(s => s.site.id);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalLeads, todayLeads] = await Promise.all([
        prisma.lead.groupBy({
            by: ["siteId"],
            where: { siteId: { in: siteIds } },
            _count: { id: true },
        }),
        prisma.lead.groupBy({
            by: ["siteId"],
            where: { siteId: { in: siteIds }, createdAt: { gte: todayStart } },
            _count: { id: true },
        }),
    ]);

    const totalMap = Object.fromEntries(totalLeads.map(s => [s.siteId, s._count.id]));
    const todayMap = Object.fromEntries(todayLeads.map(s => [s.siteId, s._count.id]));

    let msg = `🌐 <b>Saytlaringiz (${user.sites.length})</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const us of user.sites) {
        const total = totalMap[us.site.id] || 0;
        const today = todayMap[us.site.id] || 0;
        msg += `🌍 <b>${us.site.domain}</b>\n`;
        msg += `    ${us.site.name}\n`;
        msg += `    📊 Jami: <b>${total}</b> · Bugun: <b>${today}</b>\n\n`;
    }

    return sendMessage(chatId, msg);
}

// ═══════ Barcha saytlar (TD) ═══════
async function handleAllSites(chatId: number) {
    const sites = await prisma.site.findMany({
        include: { _count: { select: { leads: true, users: true } } },
    });

    if (sites.length === 0) {
        return sendMessage(chatId, "🌐 Hali saytlar yo'q.");
    }

    let msg = `🌐 <b>Barcha saytlar (${sites.length})</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const s of sites) {
        msg += `${s.isActive ? "🟢" : "🔴"} <b>${s.domain}</b>\n`;
        msg += `    ${s.name}\n`;
        msg += `    📊 Leadlar: <b>${s._count.leads}</b> · 👥 Adminlar: <b>${s._count.users}</b>\n\n`;
    }

    return sendMessage(chatId, msg);
}

// ═══════ Adminlarim (SD) ═══════
async function handleMyAdmins(chatId: number, user: UserWithSites) {
    const mySiteIds = user.sites.map(s => s.site.id);
    if (mySiteIds.length === 0) {
        return sendMessage(chatId, "👥 Sizga hech qanday sayt biriktirilmagan.");
    }

    const admins = await prisma.user.findMany({
        where: {
            role: "ADMIN",
            sites: { some: { siteId: { in: mySiteIds } } },
        },
        include: { sites: { include: { site: { select: { domain: true } } } } },
    });

    if (admins.length === 0) {
        return sendMessage(chatId, "👥 Hali adminlar yo'q.");
    }

    let msg = `👥 <b>Adminlaringiz (${admins.length})</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const a of admins) {
        const sites = a.sites.map(s => s.site.domain).join(", ");
        msg += `${a.isActive ? "🟢" : "🔴"} <b>${a.name}</b> · <code>${a.login}</code>\n`;
        msg += `    🌐 ${sites}\n\n`;
    }

    return sendMessage(chatId, msg);
}

// ═══════ Barcha foydalanuvchilar (TD) ═══════
async function handleAllUsers(chatId: number) {
    const users = await prisma.user.findMany({
        include: { sites: { include: { site: { select: { domain: true } } } } },
        orderBy: { role: "asc" },
    });

    let msg = `👥 <b>Barcha foydalanuvchilar (${users.length})</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const u of users) {
        const sites = u.sites.map(s => s.site.domain).join(", ");
        const roleEmoji = ROLE_EMOJI[u.role] || "🏷";
        msg += `${u.isActive ? "🟢" : "🔴"} <b>${u.name}</b>\n`;
        msg += `    ${roleEmoji} ${ROLE_LABELS[u.role] || u.role} · <code>${u.login}</code>\n`;
        if (sites) msg += `    🌐 ${sites}\n`;
        msg += "\n";
    }

    return sendMessage(chatId, msg);
}

// ══════════════ UTILITY ══════════════

function getTimeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "hozirgina";
    if (mins < 60) return `${mins} daqiqa oldin`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} soat oldin`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} kun oldin`;
    return date.toLocaleDateString("uz-UZ");
}

function generateBar(value: number, max: number): string {
    if (max === 0) return "░░░░░░░░░░";
    const filled = Math.round((value / max) * 10);
    return "▓".repeat(filled) + "░".repeat(10 - filled);
}

function generateMiniBar(value: number, total: number): string {
    if (total === 0) return "";
    const pct = Math.round((value / total) * 100);
    const filled = Math.round(pct / 20); // 5 segments
    return "▪".repeat(filled) + "▫".repeat(5 - filled);
}

// ══════════════ YANGI LEAD BILDIRISHNOMA ══════════════

export async function notifyNewLead(lead: {
    name: string;
    phone: string;
    goal?: string | null;
    siteId: string;
}) {
    const site = await prisma.site.findUnique({
        where: { id: lead.siteId },
        select: { domain: true, name: true, id: true },
    });

    if (!site) return;

    // notifyNewLead = true VA telegramChatId bor — FAQAT ruxsat berilganlar
    const users = await prisma.user.findMany({
        where: {
            notifyNewLead: true,
            telegramChatId: { not: null },
            isActive: true,
            OR: [
                { role: "TEAM_ADMIN" },
                { sites: { some: { siteId: site.id } } },
            ],
        },
    });

    if (users.length === 0) return;

    const now = new Date();
    const time = now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString("uz-UZ");

    const msg =
        `🆕 <b>YANGI LEAD!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🌐 Sayt: <b>${site.domain}</b>\n` +
        `👤 Ism: <b>${lead.name}</b>\n` +
        `📞 Tel: <code>${lead.phone}</code>\n` +
        (lead.goal ? `🎯 Maqsad: ${lead.goal}\n` : "") +
        `\n⏰ ${time}, ${date}`;

    // 🔥 Fire effect bilan yangi lead xabari
    await Promise.allSettled(
        users.map(u =>
            sendMessageWithEffect(u.telegramChatId!, msg, EFFECTS.fire)
        )
    );
}

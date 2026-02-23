// Telegram Bot API utility functions

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramMessage {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
    date: number;
}

interface TelegramCallbackQuery {
    id: string;
    from: { id: number; first_name: string; username?: string };
    message?: TelegramMessage;
    data?: string;
}

export interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
    callback_query?: TelegramCallbackQuery;
}

interface InlineButton {
    text: string;
    callback_data?: string;
    url?: string;
    icon_custom_emoji_id?: string; // Premium: tugmada custom emoji ikonka
}

// ══════════════ ASOSIY FUNKSIYALAR ══════════════

// Oddiy xabar yuborish (HTML)
export async function sendMessage(chatId: number | string, text: string, parseMode: string = "HTML") {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: parseMode,
        }),
    });
    return res.json();
}

// MarkdownV2 bilan xabar yuborish (custom emoji uchun)
export async function sendMarkdownV2(chatId: number | string, text: string) {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "MarkdownV2",
        }),
    });
    return res.json();
}

// Inline tugmalar bilan xabar yuborish
export async function sendKeyboard(
    chatId: number | string,
    text: string,
    buttons: InlineButton[][],
    parseMode: string = "HTML"
) {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: parseMode,
            reply_markup: { inline_keyboard: buttons },
        }),
    });
    return res.json();
}

// Reply keyboard (pastdagi tugmalar)
export async function sendReplyKeyboard(
    chatId: number | string,
    text: string,
    buttons: string[][],
    parseMode: string = "HTML"
) {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: parseMode,
            reply_markup: {
                keyboard: buttons.map(row => row.map(text => ({ text }))),
                resize_keyboard: true,
                one_time_keyboard: false,
            },
        }),
    });
    return res.json();
}

// Callback query javob berish
export async function answerCallback(callbackId: string, text?: string) {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            callback_query_id: callbackId,
            text: text || "",
        }),
    });
}

// Xabarni tahrirlash
export async function editMessage(
    chatId: number | string,
    messageId: number,
    text: string,
    buttons?: InlineButton[][],
    parseMode: string = "HTML"
) {
    const body: Record<string, unknown> = {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: parseMode,
    };
    if (buttons) {
        body.reply_markup = { inline_keyboard: buttons };
    }
    await fetch(`${TELEGRAM_API}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

// Keyboard o'chirish
export async function removeKeyboard(chatId: number | string, text: string) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            reply_markup: { remove_keyboard: true },
        }),
    });
}

// Webhook o'rnatish
export async function setWebhook(url: string) {
    const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
    });
    return res.json();
}

// Webhook ma'lumot olish
export async function getWebhookInfo() {
    const res = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    return res.json();
}

// ══════════════ PREMIUM FEATURES ══════════════

// Stiker yuborish (animated, video, static)
export async function sendSticker(chatId: number | string, sticker: string) {
    const res = await fetch(`${TELEGRAM_API}/sendSticker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, sticker }),
    });
    return res.json();
}

// Dice yuborish (🎯🎲🏀⚽🎳🎰)
export async function sendDice(chatId: number | string, emoji: string = "🎯") {
    const res = await fetch(`${TELEGRAM_API}/sendDice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, emoji }),
    });
    return res.json();
}

// Chat action (typing, upload_photo, etc.)
export async function sendChatAction(chatId: number | string, action: string = "typing") {
    await fetch(`${TELEGRAM_API}/sendChatAction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action }),
    });
}

// Bot komandalarini o'rnatish
export async function setMyCommands(commands: { command: string; description: string }[]) {
    const res = await fetch(`${TELEGRAM_API}/setMyCommands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commands }),
    });
    return res.json();
}

// Message effect bilan xabar yuborish (🎉🔥👍👎 animatsiyalar)
export async function sendMessageWithEffect(
    chatId: number | string,
    text: string,
    effectId: string,
    parseMode: string = "HTML"
) {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: parseMode,
            message_effect_id: effectId,
        }),
    });
    return res.json();
}

// Forum topic ikonka stikerlari olish (custom emoji ID lar)
export async function getForumTopicIconStickers() {
    const res = await fetch(`${TELEGRAM_API}/getForumTopicIconStickers`);
    return res.json();
}

// index.js
const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const SECRET_PATH = 'YOUR_SECRET_PATH'; // Add random string for webhook security
const START_PIC_URL = 'https://t.me/kajal_developer/59'; // Your start image URL

async function handleRequest(request) {
    const url = new URL(request.url);
    if (url.pathname !== `/${SECRET_PATH}`) {
        return new Response('Not found', { status: 404 });
    }

    if (request.method === 'POST') {
        const update = await request.json();
        return handleUpdate(update);
    }

    return new Response('Method not allowed', { status: 405 });
}

async function handleUpdate(update) {
    if (update.message && update.message.text === '/start') {
        return handleStartCommand(update.message);
    }
    return new Response('OK');
}

async function handleStartCommand(message) {
    const user = message.from;
    const name = user.first_name || user.username || 'User';
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔊 Updates', url: 'https://t.me/Madflix_Bots' },
                { text: '♻️ Support', url: 'https://t.me/MadflixBots_Support' }
            ],
            [
                { text: '❤️‍🩹 About', callback_data: 'about' },
                { text: '🛠️ Help', callback_data: 'help' }
            ],
            [
                { text: '👨‍💻 Developer', url: 'https://t.me/CallAdminRobot' }
            ]
        ]
    };

    const text = `👋 Hello ${name}!\n\nWelcome to the bot! Here's your start message.`;

    const payload = {
        chat_id: message.chat.id,
        text: text,
        reply_markup: keyboard,
        parse_mode: 'HTML'
    };

    if (START_PIC_URL) {
        // Send photo with caption and buttons
        return sendPhoto(message.chat.id, START_PIC_URL, text, keyboard);
    } else {
        return sendMessage(payload);
    }
}

async function sendPhoto(chatId, photoUrl, caption, replyMarkup) {
    const payload = {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        reply_markup: replyMarkup,
        parse_mode: 'HTML'
    };
    
    return sendTelegramRequest('sendPhoto', payload);
}

async function sendMessage(payload) {
    return sendTelegramRequest('sendMessage', payload);
}

async function sendTelegramRequest(method, payload) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`;
    
    const init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    };
    
    await fetch(url, init);
    return new Response('OK');
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

const BOT_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';

async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const update = await request.json();
            const message = update.message || update.callback_query.message;
            const chat_id = message.chat.id;
            const user = message.from;

            // Handle /start command
            if (message.text && message.text.startsWith('/start')) {
                // Delete the original /start message
                await deleteMessage(chat_id, message.message_id);
                
                // Send welcome message with photo
                return sendWelcomeMessage(chat_id, user);
            }

            return new Response('OK');

        } catch (error) {
            return new Response('Error processing request: ' + error.message, { status: 500 });
        }
    }
    return new Response('Method not allowed', { status: 405 });
}

async function deleteMessage(chat_id, message_id) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chat_id,
            message_id: message_id
        })
    });
}

async function sendWelcomeMessage(chat_id, user) {
    const photoUrl = "https://t.me/kajal_developer/59";
    const buttons = [
        [
            { text: "『MENU』", callback_data: "/2" }
        ],
        [
            { text: "Cʜᴀɴɴᴇʟ", url: "https://t.me/Teleservices_Api" },
            { text: "Cʜᴀɴɴᴇʟ", url: "https://t.me/Teleservices_Api" }
        ]
    ];

    const caption = `<b>👋 Welcome ${user.first_name}</b>\n\n⛔ ᴍᴜꜱᴛ ᴊᴏɪɴ ᴏᴜʀ ᴀʟʟ ᴄʜᴀɴɴᴇʟꜱ`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chat_id,
            photo: photoUrl,
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: buttons }
        })
    });
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
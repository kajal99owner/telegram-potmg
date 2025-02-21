const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'; // Store in Cloudflare Secrets

async function handleCommand(update) {
    const chatId = update.message.chat.id;
    const messageId = update.message.message_id;
    const command = update.message.text.split(' ')[0];
    const userId = update.message.from.id;

    try {
        if (command === '/start') {
            // Delete the original /start message
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteMessage`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId
                })
            });

            // Prepare welcome message
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

            // Send welcome message
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: chatId,
                    photo: photoUrl,
                    caption: `<b>👋 Welcome ${update.message.from.first_name}</b>\n\n⛔ ᴍᴜꜱᴛ ᴊᴏɪɴ ᴏᴜʀ ᴀʟʟ ᴄʜᴀɴɴᴇʟꜱ`,
                    parse_mode: "HTML",
                    reply_markup: { inline_keyboard: buttons }
                })
            });
        }
        else if (command === '/ping') {
            const startTime = Date.now();
            
            // Send initial ping message
            const pingMessage = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: chatId,
                    text: "Pinging...."
                })
            });
            
            const pingResult = await pingMessage.json();
            const endTime = Date.now();
            const latency = endTime - startTime;

            // Edit message with latency
            const photoUrl = "https://t.me/kajal_developer/59";
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageMedia`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: pingResult.result.message_id,
                    media: {
                        type: "photo",
                        media: photoUrl,
                        caption: `Ping 🔥!\n\n${latency} ms`,
                        parse_mode: "HTML"
                    }
                })
            });
        }
    } catch (error) {
        console.error('Error handling command:', error);
    }
}

export default {
    async fetch(request, env) {
        if (request.method === 'POST') {
            const update = await request.json();
            if (update.message && update.message.text) {
                await handleCommand(update);
            }
            return new Response('OK');
        }
        return new Response('Method not allowed', { status: 405 });
    }
};
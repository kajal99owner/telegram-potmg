async function handleCommand(update, env) { // Added env as parameter
    const chatId = update.message.chat.id;
    const messageId = update.message.message_id;
    const command = update.message.text.split(' ')[0];
    const userId = update.message.from.id;

    try {
        if (command === '/start') {
            // Delete the original /start message
            await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/deleteMessage`, { // Use env variable
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
                    { text: "Sᴜᴘᴘᴏʀᴛ", url: "https://t.me/Teleservices_Api_Group" } // Fixed duplicate URL
                ]
            ];

            // Send welcome message
            await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendPhoto`, { // Use env variable
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
            
            // Send initial ping message as photo
            const photoUrl = "https://t.me/kajal_developer/59";
            const pingMessage = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendPhoto`, { // Use env variable
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: chatId,
                    photo: photoUrl,
                    caption: "🔄 Pinging....",
                    parse_mode: "HTML"
                })
            });
            
            const pingResult = await pingMessage.json();
            const endTime = Date.now();
            const latency = endTime - startTime;

            // Cloudflare Workers doesn't provide system metrics
            const formatUptime = (seconds) => {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                return `${hours}h:${minutes}m:${secs}s`;
            };

            // Build status message
            const caption = `
<b>🏓 ᴩᴏɴɢ : ${latency}ᴍs</b>

↬ ᴜᴩᴛɪᴍᴇ : ${formatUptime(Math.floor(startTime / 1000))} 
↬ ᴡᴏʀᴋᴇʀ ᴇɴᴠ : Cloudflare Worker
            `.trim();

            // Edit message caption only
            await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/editMessageCaption`, { // Use env variable
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: pingResult.result.message_id,
                    caption: caption,
                    parse_mode: "HTML"
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
            
            // Handle callback queries
            if (update.callback_query) {
                const data = update.callback_query.data;
                const chatId = update.callback_query.message.chat.id;
                // Add callback query handling logic here
                // Example: if (data === '/2') { ... }
                return new Response('OK');
            }
            
            if (update.message && update.message.text) {
                await handleCommand(update, env); // Pass env to handler
            }
            return new Response('OK');
        }
        return new Response('Method not allowed', { status: 405 });
    }
};
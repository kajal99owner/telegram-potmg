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
                headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
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
            const photoUrl = "https://t.me/kajal_developer/59";

            // Send initial photo message with temporary caption
            const pingMessage = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    photo: photoUrl,
                    caption: "Pinging...."
                })
            });

            const pingResult = await pingMessage.json();
            const endTime = Date.now();
            const latency = endTime - startTime;

            // Edit the caption of the photo message
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageCaption`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: pingResult.result.message_id,
                    caption: `Ping 🔥!\n\n${latency} ms`
                })
            });
        }
    } catch (error) {
        console.error('Error handling command:', error);
    }
}
else if (command === '/ban') {
            // Check if message is a reply
            if (!update.message.reply_to_message) {
                await sendText(chatId, "❌ Please reply to the user's message to ban them.");
                return;
            }

            const targetUser = update.message.reply_to_message.from;
            const senderId = update.message.from.id;

            // Verify admin privileges
            const isAdmin = await checkAdmin(chatId, senderId);
            if (!isAdmin) {
                await sendText(chatId, "⛔ You must be an admin to use this command.");
                return;
            }

            // Permanent ban with 0 until_date
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/banChatMember`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: chatId,
                    user_id: targetUser.id,
                    until_date: 0, // Permanent ban
                    revoke_messages: true // Delete all messages
                })
            });

            // Confirmation message
            await sendText(chatId, `🚫 Banned ${targetUser.first_name} permanently!\n❌ They can't rejoin via group link.`);
        }
    } catch (error) {
        console.error('Error handling command:', error);
    }
}

// Helper function to check admin status
async function checkAdmin(chatId, userId) {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getChatAdministrators`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ chat_id: chatId })
    });
    
    const data = await response.json();
    return data.result.some(admin => admin.user.id === userId);
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
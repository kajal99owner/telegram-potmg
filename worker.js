const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'; // Use Cloudflare Secrets (env.TELEGRAM_TOKEN)

async function handleCommand(update) {
    const chatId = update.message.chat.id;
    const messageId = update.message.message_id;
    const command = update.message.text.split(' ')[0];
    const userId = update.message.from.id;

    try {
        if (command === '/start') {
            // ... existing /start code ...
        }
        else if (command === '/ping') {
            // ... existing /ping code ...
        }
        else if (command === '/ban') {
            // Check if message is a reply
            if (!update.message.reply_to_message) {
                await sendMessage(chatId, "❌ Please reply to the user's message to ban them.");
                return;
            }

            const targetUser = update.message.reply_to_message.from;
            const senderId = update.message.from.id;

            // Verify admin privileges
            const isAdmin = await checkAdmin(chatId, senderId);
            if (!isAdmin) {
                await sendMessage(chatId, "⛔ You must be an admin to use this command.");
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
                    revoke_messages: true
                })
            });

            // Confirmation message
            await sendMessage(chatId, `🚫 Banned ${targetUser.first_name} permanently!\n❌ They can't rejoin via group link.`);
        }
    } catch (error) {
        console.error('Error handling command:', error);
    }
}

// Helper function to send text messages
async function sendMessage(chatId, text) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: "HTML"
        })
    });
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

// ... remaining code ...
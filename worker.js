addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/webhook')) {
        const update = await request.json();
        const chatId = update.message.chat.id;
        const command = update.message.text;
        
        if (command === '/start') {
            await handleStart(chatId);
        } else if (command === '/help') {
            await handleHelp(chatId);
        } else if (command === '/about') {
            await handleAbout(chatId);
        } else if (command === '/ping') {
            await handlePing(chatId);
        } else {
            await sendMessage(chatId, "Unknown command. Type /help for assistance.");
        }
        return new Response('OK', { status: 200 });
    }
    return new Response('Invalid request', { status: 404 });
}

async function handleStart(chatId) {
    const message = "Welcome to the bot! Choose an option:";
    const options = {
        reply_markup: {
            keyboard: [
                ["🔊 Updates", "♻️ Support"],
                ["❤️‍🩹 About", "🛠️ Help"],
                ["👨‍💻 Developer code"]
            ],
            one_time_keyboard: true
        }
    };
    await sendMessage(chatId, message, options);
}

async function handleHelp(chatId) {
    const helpMessage = "Here are the commands you can use:\n- /start: Start the bot\n- /ping: Check the bot's uptime";
    await sendMessage(chatId, helpMessage);
}

async function handleAbout(chatId) {
    const aboutMessage = `╔════❰ ❱═❍ ║
    ╭━━━━━━━━━━━━━━━➣
    ║┣⪼🤖 ᴍʏ ɴᴀᴍᴇ : YourBotName
    ║┣⪼👦 ᴅᴇᴠᴇʟᴏᴘᴇʀ: YourName
    ║┣⪼❣️ ᴜᴘᴅᴀᴛᴇ : Latest Update Info
    ║┣⪼🗣️ ʟᴀɴɢᴜᴀɢᴇ : JS 💻
    ║┣⪼🧠 ʜᴏsᴛᴇᴅ : ᴄʟᴏᴜᴅғʟᴀʀᴇ⚡
    ║┣⪼📚 ᴜᴘᴅᴀᴛᴇᴅ : Last Updated Date
    ║┣⪼🗒️ ᴠᴇʀsɪᴏɴ : v1.0
    ║╰━━━━━━━━━━━━━━━➣
    ╚══════════════════❍`;
    await sendMessage(chatId, aboutMessage);
}

async function handlePing(chatId) {
    const uptime = process.uptime(); // Adjust this line if you're using a different method to track uptime
    const pingMessage = `❖ ᴜᴘᴛɪᴍᴇ ➥ ${uptime.toFixed(2)} ms`;
    await sendMessage(chatId, pingMessage);
}

async function sendMessage(chatId, text, options = {}) {
    const token = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'; // Replace with your bot token
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            ...options
        })
    });
    return response.json();
}
 

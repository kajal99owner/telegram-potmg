const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const VIDEO_LINKS = [
  "https://t.me/kajal_developer/7",
  "https://t.me/kajal_developer/7",
  "https://t.me/developer_64/28",
  "https://t.me/developer_64/29",
  "https://t.me/developer_64/30",
  "https://t.me/developer_64/31",
  "https://t.me/developer_64/32",
  "https://t.me/developer_64/33",
  "https://t.me/developer_64/34",
  "https://t.me/developer_64/35"
];

async function handleRequest(request) {
    if (request.method === 'POST') {
        const update = await request.json();
        return handleUpdate(update);
    }
    return new Response('OK');
}

async function handleUpdate(update) {
    if (update.callback_query) {
        const data = update.callback_query.data;
        const chatId = update.callback_query.message.chat.id;
        const messageId = update.callback_query.message.message_id;
        
        if (data === '/Commands') {
            await deleteMessage(chatId, messageId);
            await sendCommandsMenu(chatId);
        }
        return new Response('OK');
    }

    if (update.message) {
        const text = update.message.text;
        const chatId = update.message.chat.id;
        const user = update.message.from;

        if (text === '/start') {
            await sendWelcomeMessage(chatId, user);
        }
        else if (text === '/Commands') {
            await deleteMessage(chatId, update.message.message_id);
            await sendCommandsMenu(chatId);
        }
        else if (text === '/about') {
            await sendAboutMessage(chatId, user);
        }
        else if (text === '/VBMENU') {
            await sendVbMenu(chatId);
        }
        else if (text === 'video1') {
            await sendVideo1Series(chatId);
        }
        return new Response('OK');
    }

    return new Response('OK');
}

async function sendWelcomeMessage(chatId, user) {
    const videoUrl = "https://t.me/kajal_developer/57";
    const buttons = [
        [{ text: "menu", callback_data: "/Commands" }],
        [{ text: "DEV", url: "https://t.me/pornhub_Developer" }]
    ];

    const caption = `<b>👋 Welcome Back ${user.first_name}</b>\n\n🌥️ Bot Status: Alive 🟢\n\n💞 Dev: @pornhub_Developer`;

    await fetch(`${BASE_URL}/sendVideo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            video: videoUrl,
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: buttons },
            protect_content: true
        })
    });
}
//
async function sendCommandsMenu(chatId) {
    const videoUrl = "https://t.me/kajal_developer/57"; 
    const buttons = [
        [
            { text: "video 🌏", callback_data: "video1" },
            { text: "Tools", callback_data: "/tools" }
        ],
        [
            { text: "Channel", url: "https://t.me/pornhub_Developer" },
            { text: "DEV", url: "https://t.me/pornhub_Developer" }
        ],
        [
            { text: "◀️ Go Back", callback_data: "/start" }
        ]
    ];

    const caption = `<b>[𖤐] XS :</b>\n\n<b>[ϟ] video Tools :</b>\n\n<b>[ᛟ] video - 0</b>\n<b>[ᛟ] video - 0</b>\n<b>[ᛟ] Tools - 2</b>`;

    await fetch(`${BASE_URL}/sendVideo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            video: videoUrl,
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: buttons },
            protect_content: true
        })
    });
}
//
async function deleteMessage(chatId, messageId) {
    await fetch(`${BASE_URL}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            protect_content: true
        })
    });
}

// about
async function sendAboutMessage(chatId, user) {
    const aboutMessage = `
<b><blockquote>⍟───[ MY ᴅᴇᴛᴀɪʟꜱ ]───⍟</blockquote>

‣ ᴍʏ ɴᴀᴍᴇ : <a href="https://t.me/${user.username}">${user.first_name}</a>
‣ ᴍʏ ʙᴇsᴛ ғʀɪᴇɴᴅ : <a href='tg://settings'>ᴛʜɪs ᴘᴇʀsᴏɴ</a> 
‣ ᴅᴇᴠᴇʟᴏᴘᴇʀ : <a href='https://t.me/sumit_developer'>💫 Sx</a> 
‣ ʟɪʙʀᴀʀʏ : <a href='Cloudflare.com'>Cloudflare</a> 
‣ ʟᴀɴɢᴜᴀɢᴇ : <a href='JS 💻'>JS 💻</a> 
‣ ᴅᴀᴛᴀ ʙᴀsᴇ : <a href='Cloudflare.com'>Cloudflare</a> 
‣ ʙᴏᴛ sᴇʀᴠᴇʀ : <a href='ᴄʟᴏᴜᴅғʟᴀʀᴇ ⚡'>ᴄʟᴏᴜᴅғʟᴀʀᴇ ⚡</a> 
‣ ʙᴜɪʟᴅ sᴛᴀᴛᴜs : v1.0 [sᴛᴀʙʟᴇ]</b>
    `;

    await fetch(`${BASE_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: aboutMessage,
            parse_mode: 'HTML',
            protect_content: true
        })
    });
}

//
async function sendVbMenu(chatId) {
    const keyboard = {
        keyboard: [
            ["🌺 CP", "🇮🇳 Desi"],
            ["🇬🇧 Forener", "🐕‍🦺 Animal"],
            ["💕 Webseries", "💑 Gay Cp"],
            ["💸 𝘽𝙐𝙔 𝙑𝙄𝙋 💸"]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    };

    await fetch(`${BASE_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: "🤗 Welcome to Lx Bot 🌺",
            reply_markup: keyboard,
            protect_content: true
        })
    });
}

// Video1
async function sendVideo1Series(chatId) {
  // Send all videos
  for (let i = 0; i < VIDEO_LINKS.length; i++) {
    await sendVideo(chatId, VIDEO_LINKS[i], `#${i + 1}`);
  }

  // Send developer button
  const buttons = [[{ text: "⚡ Developer", url: DEVELOPER_LINK }]];
  await sendMessage(chatId, "👇", buttons);
}

async function sendVideo(chatId, videoUrl, caption) {
  await fetch(`${BASE_URL}/sendVideo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      video: videoUrl,
      caption: caption,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
}
//

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

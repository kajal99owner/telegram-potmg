const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const TXT = {
  START_TXT: `Hello {} 👋 

➻ 


<b>Bot Is Made By :</b> @Madflix_Bots`,

  ABOUT_TXT: `
╭───────────────⍟
├<b>🤖 My Name</b> : {}
├<b>🖥️ Developer</b> : <a href="https://t.me/Madflix_Bots">Madflix Botz</a> 
├<b>👨‍💻 Programer</b> : <a href="https://t.me/MadflixOfficials">Jishu Developer</a>
├<b>📕 Library</b> : <a href="</a>
├<b>✏️ Language</b> : <a href="></a>
├<b>📊 Build Version</b> : <a href="">v1.0.0</a></b>     
╰───────────────⍟`,

  HELP_TXT: "Your help text here",
  DONATE_TXT: "Your donate text here"
};

async function handleRequest(request) {
  try {
    const update = await request.json();
    
    if (update.message) {
      await handleMessage(update.message);
    }
    else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
    
    return new Response('OK');
  } catch (error) {
    return new Response(error.stack, { status: 200 });
  }
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';
  
  if (text.startsWith('/start')) {
    await sendStartMessage(chatId, message.from);
  }
  else if (text.startsWith('/donate') || text.startsWith('/d')) {
    await sendDonateMessage(chatId);
  }
}

async function sendStartMessage(chatId, user) {
  const buttons = {
    inline_keyboard: [
      [
        { text: '🔊 Updates', url: 'https://t.me/Madflix_Bots' },
        { text: '♻️ Sᴜᴩᴩᴏʀᴛ', url: 'https://t.me/MadflixBots_Support' }
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

  const formattedText = TXT.START_TXT.replace('{}', user.first_name);

  if (START_PIC) {
    await sendPhoto(chatId, START_PIC, formattedText, buttons);
  } else {
    await sendMessage(chatId, formattedText, buttons);
  }
}

async function handleCallbackQuery(query) {
  const message = query.message;
  const data = query.data;
  
  if (data === 'start') {
    await editMessage(message, TXT.START_TXT.replace('{}', query.from.first_name), getStartButtons());
  }
  else if (data === 'help') {
    await editMessage(message, TXT.HELP_TXT, {
      inline_keyboard: [
        [{ text: '⚡ 4GB Rename Bot', url: 'https://t.me/FileRenameXProBot' }],
        [
          { text: '🔒 Close', callback_data: 'close' },
          { text: '◀️ Back', callback_data: 'start' }
        ]
      ]
    });
  }
  else if (data === 'about') {
    await editMessage(message, TXT.ABOUT_TXT.replace('{}', BOT_NAME), {
      inline_keyboard: [
        [{ text: '🤖 More Bots', url: 'https://t.me/Madflix_Bots/7' }],
        [
          { text: '🔒 Cʟᴏꜱᴇ', callback_data: 'close' },
          { text: '◀️ Bᴀᴄᴋ', callback_data: 'start' }
        ]
      ]
    });
  }
  else if (data === 'close') {
    await deleteMessage(message.chat.id, message.message_id);
  }
}

async function sendDonateMessage(chatId) {
  const buttons = {
    inline_keyboard: [
      [
        { text: '🦋 Admin', url: 'https://t.me/CallAdminRobot' },
        { text: '✖️ Close', callback_data: 'close' }
      ]
    ]
  };
  
  await sendMessage(chatId, TXT.DONATE_TXT, buttons);
}

// Helper functions
async function sendMessage(chatId, text, replyMarkup) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: replyMarkup
  };

  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

async function sendPhoto(chatId, photo, caption, replyMarkup) {
  const payload = {
    chat_id: chatId,
    photo: photo,
    caption: caption,
    parse_mode: 'HTML',
    reply_markup: replyMarkup
  };

  await fetch(`${TELEGRAM_API}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

async function editMessage(message, text, replyMarkup) {
  const payload = {
    chat_id: message.chat.id,
    message_id: message.message_id,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: replyMarkup
  };

  await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

async function deleteMessage(chatId, messageId) {
  await fetch(`${TELEGRAM_API}/deleteMessage?chat_id=${chatId}&message_id=${messageId}`);
}

export default {
  async fetch(request, env) {
    BOT_TOKEN = env.BOT_TOKEN;
    START_PIC = env.START_PIC;
    return handleRequest(request);
  }
};
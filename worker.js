const START_PIC = "https://t.me/kajal_developer/59"; // Replace with your image URL
const BOT_TOKEN = "7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM"; // Set in Cloudflare Secrets

const Txt = {
  START_TXT: `Hello {} 👋 

➻ 

➻

➻ 

➻

<b>Bot Is Made By :</b> @Madflix_Bots`,

  ABOUT_TXT: `
╭───────────────⍟
├<b>🤖 My Name</b> : {0}
├<b>🖥️ Developer</b> : <a href="https://t.me/Madflix_Bots">Madflix Botz</a> 
├<b>👨‍💻 Programer</b> : <a href="https://t.me/MadflixOfficials">Jishu Developer</a>
├<b>📕 Library</b> : <a href="#">Pyrogram</a>
├<b>✏️ Language</b> : <a href="#">Python 3</a>
├<b>📊 Build Version</b> : <a href="#">v1.0.0</a></b>     
╰───────────────⍟`,

  HELP_TXT: "Your help text here...",
  DONATE_TXT: "Your donate text here..."
};

const makeKeyboard = (buttons) => ({
  inline_keyboard: buttons
});

async function handleUpdate(request) {
  const update = await request.json();
  
  if (update.message) {
    const { chat, text } = update.message;
    
    if (text?.startsWith('/start')) {
      const buttons = makeKeyboard([
        [
          { text: '🔊 Updates', url: 'https://t.me/Madflix_Bots' },
          { text: '♻️ Sᴜᴩᴩᴏʀᴛ', url: 'https://t.me/MadflixBots_Support' }
        ],
        [
          { text: '❤️‍🩹 About', callback_data: 'about' },
          { text: '🛠️ Help', callback_data: 'help' }
        ],
        [{ text: '👨‍💻 Developer', url: 'https://t.me/CallAdminRobot' }]
      ]);

      const params = new URLSearchParams({
        chat_id: chat.id,
        text: Txt.START_TXT.replace("{}", `<a href="tg://user?id=${chat.id}">${chat.first_name}</a>`),
        reply_markup: JSON.stringify(buttons),
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      if (START_PIC) {
        await sendPhoto(chat.id, START_PIC, params);
      } else {
        await sendMessage(params);
      }
    }
  }

  if (update.callback_query) {
    const { data, message, from } = update.callback_query;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    switch (data) {
      case 'start':
        await editMessage({
          chat_id: chatId,
          message_id: messageId,
          text: Txt.START_TXT.replace("{}", `<a href="tg://user?id=${from.id}">${from.first_name}</a>`),
          reply_markup: makeKeyboard([/* same as start keyboard */]),
          parse_mode: 'HTML'
        });
        break;

      case 'help':
        // Similar structure for help menu
        break;

      case 'about':
        const botInfo = await getBotInfo();
        await editMessage({
          chat_id: chatId,
          message_id: messageId,
          text: Txt.ABOUT_TXT.replace("{0}", botInfo.username),
          reply_markup: makeKeyboard([/* about keyboard */]),
          parse_mode: 'HTML'
        });
        break;

      case 'close':
        await deleteMessage(chatId, messageId);
        break;
    }
  }

  return new Response('OK');
}

// Telegram API helpers
async function sendMessage(params) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?${params}`);
}

async function sendPhoto(chatId, photo, params) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('photo', photo);
  formData.append('caption', params.get('text'));
  formData.append('parse_mode', 'HTML');
  formData.append('reply_markup', params.get('reply_markup'));
  
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    body: formData
  });
}

async function editMessage(params) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
}

async function deleteMessage(chatId, messageId) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage?chat_id=${chatId}&message_id=${messageId}`);
}

async function getBotInfo() {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
  const data = await response.json();
  return data.result;
}

export default {
  async fetch(request, env) {
    BOT_TOKEN = env.BOT_TOKEN || BOT_TOKEN; // Use environment variable
    return handleUpdate(request);
  }
};
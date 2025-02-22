const TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;
const WEBHOOK = '/endpoint';

addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname === WEBHOOK) {
    event.respondWith(handleWebhook(event));
  } else if (url.pathname === '/registerWebhook') {
    event.respondWith(registerWebhook(event));
  } else if (url.pathname === '/unRegisterWebhook') {
    event.respondWith(unRegisterWebhook(event));
  } else {
    event.respondWith(new Response('Not found', { status: 404 }));
  }
});

async function handleWebhook(event) {
  const request = event.request;
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  
  // Validate secret token from environment variables
  if (secret !== SECRET) {
    return new Response('Unauthorized', { status: 403 });
  }

  try {
    const update = await request.json();
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const messageId = update.message.message_id;
      const command = update.message.text.split(' ')[0];

      if (command === '/start') {
        // Delete the /start message
        await fetch(`${BASE_URL}/deleteMessage`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId
          })
        });

        // Send welcome message
        await sendWelcomeMessage(chatId);
      }
      else if (command === '/ping') {
        await handlePingCommand(chatId);
      }
    }
    return new Response('OK');
  } catch (error) {
    console.error('Error:', error);
    return new Response('Server Error', { status: 500 });
  }
}

async function sendWelcomeMessage(chatId) {
  const photoUrl = "https://t.me/kajal_developer/59";
  const buttons = [
    [{ text: "『MENU』", callback_data: "/2" }],
    [
      { text: "Cʜᴀɴɴᴇʟ", url: "https://t.me/Teleservices_Api" },
      { text: "Cʜᴀɴɴᴇʟ", url: "https://t.me/Teleservices_Api" }
    ]
  ];

  return fetch(`${BASE_URL}/sendPhoto`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: `<b>👋 Welcome</b>\n\n⛔ ᴍᴜꜱᴛ ᴊᴏɪɴ ᴏᴜʀ ᴀʟʟ ᴄʜᴀɴɴᴇʟꜱ`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons }
    })
  });
}

async function handlePingCommand(chatId) {
  const startTime = Date.now();
  
  // Send initial ping message
  const pingResponse = await fetch(`${BASE_URL}/sendMessage`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      chat_id: chatId,
      text: "🔄 Pinging...."
    })
  });
  
  const pingResult = await pingResponse.json();
  const endTime = Date.now();
  const latency = endTime - startTime;

  // Cloudflare Workers doesn't provide system metrics
  const statusMessage = `
<b>🏓 ᴩᴏɴɢ : ${latency}ᴍs</b>

↬ ᴜᴩᴛɪᴍᴇ : Not available in Workers
↬ ʀᴀᴍ : Not available in Workers
↬ ᴄᴩᴜ : Not available in Workers
↬ ᴅɪsᴋ : Not available in Workers
  `.trim();

  return fetch(`${BASE_URL}/editMessageText`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      chat_id: chatId,
      message_id: pingResult.result.message_id,
      text: statusMessage,
      parse_mode: "HTML"
    })
  });
}

async function registerWebhook(event) {
  const webhookUrl = `${new URL(event.request.url).origin}${WEBHOOK}`;
  const response = await fetch(`${BASE_URL}/setWebhook`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: SECRET
    })
  });
  return new Response(await response.text());
}

async function unRegisterWebhook(event) {
  const response = await fetch(`${BASE_URL}/deleteWebhook`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ drop_pending_updates: true })
  });
  return new Response(await response.text());
}
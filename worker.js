const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const ADMIN_CACHE = new Map();

async function handleRequest(request) {
  if (request.method === 'POST') {
    const update = await request.json();
    
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallback(update.callback_query);
    }
    
    return new Response('OK');
  }
  return new Response('Not Found', { status: 404 });
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const user = message.from;
  const isGroup = message.chat.type !== 'private';

  try {
    if (text.startsWith('/start')) {
      await handleStart(chatId, user);
    } else if (text.startsWith('/ping')) {
      await handlePing(chatId);
    } else if (text.startsWith('/reload')) {
      await handleReload(chatId, user.id);
    } else if (text.startsWith('/ban') || text.startsWith('/kick') || 
               text.startsWith('/mute') || text.startsWith('/unban')) {
      await handleModeration(chatId, user.id, text, message.reply_to_message);
    } else if (text.startsWith('/info')) {
      await handleInfo(chatId, message.reply_to_message?.from || user);
    } else if (text.startsWith('/infopvt')) {
      await handleInfo(user.id, user);
    } else if (text.startsWith('/staff')) {
      await handleStaff(chatId);
    } else if (text.startsWith('/settings')) {
      await handleSettings(chatId);
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
}

async function handleCallback(callback) {
  const message = callback.message;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  if (callback.data === '/2') {
    await deleteMessage(chatId, messageId);
    await answerCallback(callback.id);
  }
}

async function handleStart(chatId, user) {
  const photoUrl = "https://t.me/kajal_developer/59";
  const buttons = [
    [{ text: "『MENU』", callback_data: "/2" }],
    [
      { text: "Cʜᴀɴɴᴇʟ", url: "https://t.me/Teleservices_Api" },
      { text: "Cʜᴀɴɴᴇʟ", url: "https://t.me/Teleservices_Api" }
    ]
  ];
  
  await sendPhoto(
    chatId,
    photoUrl,
    `<b>👋 Welcome ${user.first_name}</b>\n\n⛔ ᴍᴜꜱᴛ ᴊᴏɪɴ ᴏᴜʀ ᴀʟʟ ᴄʜᴀɴɴᴇʟꜱ`,
    { inline_keyboard: buttons }
  );
}

async function handlePing(chatId) {
  const start = Date.now();
  const sent = await sendMessage(chatId, "Pinging...");
  const latency = Date.now() - start;
  await editMessage(chatId, sent.result.message_id, `Ping 🔥!\n\n${latency}ms`);
}

async function handleReload(chatId, userId) {
  if (!await isAdmin(chatId, userId)) return;
  
  ADMIN_CACHE.delete(chatId);
  await sendMessage(chatId, "Admins list refreshed!");
}

async function handleModeration(chatId, userId, command, reply) {
  if (!await isAdmin(chatId, userId)) return;

  const target = reply?.from;
  if (!target) {
    await sendMessage(chatId, "Reply to a message to moderate user!");
    return;
  }

  const action = command.split(' ')[0].slice(1);
  const actions = {
    ban: { method: 'banChatMember', params: {} },
    kick: { method: 'banChatMember', params: { revoke_messages: true } },
    mute: { method: 'restrictChatMember', params: { permissions: { can_send_messages: false } } },
    unban: { method: 'unbanChatMember', params: { only_if_banned: true } }
  };

  await callApi(actions[action].method, { 
    chat_id: chatId, 
    user_id: target.id, 
    ...actions[action].params 
  });
  
  await sendMessage(chatId, `User ${target.first_name} ${action}ned!`);
}

async function handleInfo(chatId, user) {
  const info = [
    `ID: ${user.id}`,
    `Name: ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
    `Username: @${user.username || 'none'}`
  ].join('\n');
  
  await sendMessage(chatId, `<b>User Info:</b>\n\n${info}`);
}

async function handleStaff(chatId) {
  const admins = await getAdmins(chatId);
  const staffList = admins.map(a => `- ${a.user.first_name} (${a.status})`).join('\n');
  await sendMessage(chatId, `<b>Group Staff:</b>\n\n${staffList}`);
}

async function handleSettings(chatId) {
  const buttons = [[
    { text: "Anti-Spam", callback_data: "settings_antispam" },
    { text: "Welcome Message", callback_data: "settings_welcome" }
  ]];
  await sendMessage(chatId, "<b>Group Settings:</b>", { inline_keyboard: buttons });
}

// Utility functions
async function isAdmin(chatId, userId) {
  const admins = await getAdmins(chatId);
  return admins.some(a => a.user.id === userId);
}

async function getAdmins(chatId) {
  if (!ADMIN_CACHE.has(chatId)) {
    const admins = await callApi('getChatAdministrators', { chat_id: chatId });
    ADMIN_CACHE.set(chatId, admins.result);
  }
  return ADMIN_CACHE.get(chatId);
}

async function callApi(method, params) {
  return fetch(`${TELEGRAM_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }).then(r => r.json());
}

async function sendMessage(chatId, text, markup) {
  return callApi('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: markup
  });
}

async function sendPhoto(chatId, photo, caption, markup) {
  return callApi('sendPhoto', {
    chat_id: chatId,
    photo: photo,
    caption: caption,
    parse_mode: 'HTML',
    reply_markup: markup
  });
}

async function editMessage(chatId, msgId, text) {
  return callApi('editMessageText', {
    chat_id: chatId,
    message_id: msgId,
    text: text,
    parse_mode: 'HTML'
  });
}

async function deleteMessage(chatId, msgId) {
  return callApi('deleteMessage', { chat_id: chatId, message_id: msgId });
}

async function answerCallback(callbackId) {
  return callApi('answerCallbackQuery', { callback_query_id: callbackId });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
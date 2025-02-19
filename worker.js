const BOT_TOKEN = "7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM";

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method === 'POST') {
    const body = await request.json()
    const message = body.message || body.callback_query
    const chatId = message.chat.id
    const text = message.text || message.data

    if (text === '/start') {
      return handleStartCommand(chatId)
    } else if (text === '/join') {
      return handleJoinCommand(chatId, message)
    } else {
      return new Response('OK', { status: 200 })
    }
  }
  return new Response('OK', { status: 200 })
}

async function handleStartCommand(chatId) {
  const buttons = [
    [{ text: "👨‍💻 Developer", url: "tg://openmessage?user_id=6449612223" }],
    [{ text: "🔊 Updates", url: "https://t.me/addlist/P9nJIi98NfY3OGNk" }],
    [{ text: "✅", callback_data: "/join" }]
  ]

  const messageText = "⭐️ To Usᴇ Tʜɪs Bᴏᴛ Yᴏᴜ Nᴇᴇᴅ Tᴏ Jᴏɪɴ Aʟʟ Cʜᴀɴɴᴇʟs -"
  const photoUrl = "https://t.me/kajal_developer/9"

  const response = await fetch(`https://api.telegram.org/bot${YOUR_BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: messageText,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: buttons
      }
    })
  })

  return new Response('OK', { status: 200 })
}

async function handleJoinCommand(chatId, message) {
  const messageId = message.message_id

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId
    })
  })

  const userId = message.from.id
  const channel = "@kajal_developer"

  const chatMember = await fetch(`https://api.telegram.org/bot${YOUR_BOT_TOKEN}/getChatMember`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: channel,
      user_id: userId
    })
  })

  const chatMemberData = await chatMember.json()
  const status = chatMemberData.result.status

  if (status === "member" || status === "administrator" || status === "creator") {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🤗 Welcome to Lx Bot 🌺",
        reply_markup: {
          keyboard: [
            ["🌺 CP", "🇮🇳 Desi"],
            ["🇬🇧 Forener", "🐕‍🦺 Animal"],
            ["💕 Webseries", "💑 Gay Cp"],
            ["💸 𝘽𝙐𝙔 𝙑𝙄𝙋 💸"]
          ],
          resize_keyboard: true
        }
      })
    })
  } else {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: "❌ Must join all channel\n @kajal_developer"
      })
    })
  }

  return new Response('OK', { status: 200 })
}

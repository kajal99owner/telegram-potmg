addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const body = await request.json();

  if (body.message) {
    const chat_id = body.message.chat.id;
    const message_text = body.message.text;
    
    if (message_text === "/start") {
      await sendWelcomeMessage(chat_id, body.message);
    } else if (message_text === "/ping") {
      await sendPingResponse(chat_id);
    }
  }

  return new Response("OK", { status: 200 });
}

async function sendWelcomeMessage(chat_id, message) {
  const photoUrl = "https://t.me/kajal_developer/59";
  const caption = `<b>👋 Welcome ${message.from.first_name}</b>\n\n⛔ ᴍᴜꜱᴛ ᴊᴏɪɴ ᴏᴜʀ ᴀʟʟ ᴄʜᴀɴɴᴇʟꜱ`;
  const button = {
    inline_keyboard: [
      [{ text: "『MENU』", callback_data: "/2" }],
      [
        { text: "Cʜᴀɴɴᴇʟ", url: "https://t.me/Teleservices_Api" },
        { text: "Cʜᴀɴɴᴇʟ", url: "https://t.me/Teleservices_Api" }
      ]
    ]
  };

  // Delete the received message first
  await deleteMessage(chat_id, message.message_id);

  // Send the welcome message with a photo
  await sendPhoto(chat_id, photoUrl, caption, button);
}

async function sendPingResponse(chat_id) {
  const startTime = Date.now();
  const message = await sendMessage(chat_id, "Pinging....");
  const endTime = Date.now();
  const timeTaken = endTime - startTime;
  await editMessage(chat_id, message.message_id, `Ping 🔥!\n\n${timeTaken} ms`);
}

async function sendPhoto(chat_id, photo, caption, reply_markup) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, photo, caption, parse_mode: "HTML", reply_markup })
  });
}

async function sendMessage(chat_id, text) {
  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text })
  });
  return response.json();
}

async function editMessage(chat_id, message_id, text) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, message_id, text })
  });
}

async function deleteMessage(chat_id, message_id) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/deleteMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, message_id })
  });
}

const TOKEN = "7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM";

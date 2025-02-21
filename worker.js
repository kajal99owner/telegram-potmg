// Import the deepseek-chat library (assuming it's available as an ES module)
import { DeepSeekChat } from 'deepseek-chat';

// Initialize the Telegram bot token
const TELEGRAM_BOT_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Initialize DeepSeekChat
const deepseek = new DeepSeekChat();

// Handle incoming requests
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === 'POST') {
    const update = await request.json();
    await handleTelegramUpdate(update);
    return new Response('OK', { status: 200 });
  }
  return new Response('Not Found', { status: 404 });
}

// Handle Telegram updates
async function handleTelegramUpdate(update) {
  const chatId = update.message.chat.id;
  const text = update.message.text;

  // Use DeepSeekChat to generate a response
  const response = await deepseek.generateResponse(text);

  // Send the response back to Telegram
  await sendMessage(chatId, response);
}

// Send a message to Telegram
async function sendMessage(chatId, text) {
  const url = `${TELEGRAM_API_URL}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: text,
  };

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

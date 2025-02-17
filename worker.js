// Telegram bot using Cloudflare Worker with social media downloader
const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const RAPIDAPI_KEY = 'db42e4f68fmshe9a243ed929713ap1fa72ajsnb431ef7a74ac';

async function handleRequest(request) {
  try {
    const { method, url } = request;
    if (method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const update = await request.json();
    const message = update.message || update.channel_post;
    if (!message || !message.text) return new Response('OK');

    const chatId = message.chat.id;
    const inputUrl = message.text.trim();

    // Validate URL format
    if (!isValidUrl(inputUrl)) {
      await sendTelegramMessage(chatId, '⚠️ Please send a valid URL');
      return new Response('OK');
    }

    // Process social media URL
    const downloadInfo = await getSocialMediaInfo(inputUrl);
    await sendTelegramMessage(chatId, formatResponse(downloadInfo));

    return new Response('OK');
  } catch (error) {
    console.error('Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function getSocialMediaInfo(url) {
  const apiUrl = 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink';
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com'
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

async function sendTelegramMessage(chatId, text) {
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  
  await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    })
  });
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function formatResponse(data) {
  let response = `<b>✅ Download Information:</b>\n\n`;
  if (data.title) response += `<b>Title:</b> ${data.title}\n`;
  if (data.duration) response += `<b>Duration:</b> ${data.duration}s\n`;
  if (data.play_url) response += `<a href="${data.play_url}">🔗 Video URL</a>\n`;
  return response;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

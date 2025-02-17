const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const API_HOST = 'social-download-all-in-one.p.rapidapi.com';
const RAPIDAPI_KEY = 'db42e4f68fmshe9a243ed929713ap1fa72ajsnb431ef7a74ac';

async function handleRequest(request) {
  if (request.method === 'POST') {
    const update = await request.json();
    const message = update.message;
    if (message && message.text) {
      const chatId = message.chat.id;
      const url = message.text;
      
      try {
        // Call Social Download API
        const apiResponse = await fetch('https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink', {
          method: 'POST',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': API_HOST,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url })
        });
        
        const data = await apiResponse.json();
        
        if (data.result && data.result.video) {
          // Send video
          await sendTelegramMessage({
            chat_id: chatId,
            video: data.result.video,
            supports_streaming: true
          }, 'sendVideo');
          
        } else if (data.result && data.result.images) {
          // Send first photo
          await sendTelegramMessage({
            chat_id: chatId,
            photo: data.result.images[0]
          }, 'sendPhoto');
          
        } else {
          await sendTextMessage(chatId, 'No media found in response');
        }
        
      } catch (error) {
        await sendTextMessage(chatId, `Error: ${error.message}`);
      }
    }
    return new Response('OK');
  }
  return new Response('Not Found', { status: 404 });
}

async function sendTelegramMessage(params, method) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
}

async function sendTextMessage(chatId, text) {
  return sendTelegramMessage({
    chat_id: chatId,
    text: text
  }, 'sendMessage');
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

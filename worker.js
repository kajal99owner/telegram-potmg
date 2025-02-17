addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method === 'POST') {
    const BOT_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
    const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
    const RAPIDAPI_KEY = 'db42e4f68fmshe9a243ed929713ap1fa72ajsnb431ef7a74ac';
    
    try {
      const update = await request.json();
      const message = update.message || update.channel_post;
      
      if (message && message.text && message.text.startsWith('/url')) {
        const instaUrl = message.text.split(' ')[1];
        const chatId = message.chat.id;
        
        if (!instaUrl) {
          await sendMessage(chatId, 'Please provide an Instagram URL after /url command\nExample: /url https://www.instagram.com/p/CxLWFNksXOE/', TELEGRAM_API);
          return new Response('OK');
        }

        const apiResponse = await fetchInstagramData(instaUrl, RAPIDAPI_KEY);
        
        if (apiResponse.media) {
          if (apiResponse.media.match(/\.mp4\b/)) {
            await sendVideo(chatId, apiResponse.media, TELEGRAM_API);
          } else {
            await sendPhoto(chatId, apiResponse.media, TELEGRAM_API);
          }
        } else {
          await sendMessage(chatId, 'Failed to download media. Please check the URL and try again.', TELEGRAM_API);
        }
      }
      return new Response('OK');
    } catch (error) {
      console.error('Error:', error);
      return new Response('Error processing request', { status: 500 });
    }
  }
  return new Response('Method not allowed', { status: 405 });
}

async function fetchInstagramData(url, apiKey) {
  const encodedUrl = encodeURIComponent(url);
  const response = await fetch(
    `https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert?url=${encodedUrl}`,
    {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36'
      }
    }
  );
  return await response.json();
}

async function sendMessage(chatId, text, telegramApi) {
  await fetch(`${telegramApi}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
}

async function sendPhoto(chatId, photoUrl, telegramApi) {
  await fetch(`${telegramApi}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl
    })
  });
}

async function sendVideo(chatId, videoUrl, telegramApi) {
  await fetch(`${telegramApi}/sendVideo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      video: videoUrl
    })
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method === 'POST') {
    const update = await request.json()
    
    // Verify it's a message with /url command
    if (update.message && update.message.text.startsWith('/url')) {
      const chatId = update.message.chat.id
      const instagramUrl = update.message.text.split(' ')[1]
      
      if (!instagramUrl) {
        return sendTelegramMessage(chatId, 'Please provide an Instagram URL after /url command')
      }

      try {
        // Call Instagram API
        const apiResponse = await fetchInstagramData(instagramUrl)
        const mediaUrl = apiResponse.media || apiResponse[0]?.url // Handle carousel posts
        
        if (mediaUrl) {
          await sendTelegramMessage(chatId, `Here's your download link: ${mediaUrl}`)
        } else {
          await sendTelegramMessage(chatId, 'No media found in this post')
        }
        
      } catch (error) {
        await sendTelegramMessage(chatId, `Error: ${error.message}`)
      }
    }
    return new Response('OK')
  }
  return new Response('Method not allowed', { status: 405 })
}

async function fetchInstagramData(url) {
  const apiUrl = `https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert?url=${encodeURIComponent(url)}`
  
  const response = await fetch(apiUrl, {
    headers: {
      'x-rapidapi-key': 'db42e4f68fmshe9a243ed929713ap1fa72ajsnb431ef7a74ac',
      'x-rapidapi-host': 'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36'
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch Instagram data')
  return response.json()
}

async function sendTelegramMessage(chatId, text) {
  const botToken = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
  
  await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    })
  })
}

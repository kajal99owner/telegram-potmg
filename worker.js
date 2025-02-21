// Replace with your Telegram Bot API token
const BOT_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const YOUTUBE_DL_PROXY_API = 'https://api.githubcopilot.com/youtube_dl_proxy?url='; // Replace with your proxy
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB Telegram limit (adjust as needed)
const MAX_REQUESTS_PER_MINUTE = 10; // Basic rate limiting (adjust as needed)
const requestCounts = new Map();

async function handleStartCommand(chatId) {
    const text = 'Welcome! Send me a YouTube video URL using the /url command.  For example: `/url https://www.youtube.com/watch?v=dQw4w9WgXcQ`';
    await sendMessage(chatId, text);
}


async function handleURLCommand(chatId, messageId, url) {
    // Basic URL validation
    if (!url || !url.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//)) {
        await sendMessage(chatId, 'Please provide a valid YouTube URL.');
        return;
    }

    // Rate limiting (basic)
    const now = Date.now();
    const userRequests = requestCounts.get(chatId) || [];
    const recentRequests = userRequests.filter(ts => now - ts < 60000); // Within the last minute
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
        await sendMessage(chatId, 'You have reached the request limit. Please try again later.');
        return;
    }
    requestCounts.set(chatId, [...recentRequests, now]);


    // Send initial processing message and store its ID
    const processingMessage = await sendMessage(chatId, '⌛️ Your request is processing...', null, messageId);
    const processingMessageId = processingMessage.result.message_id;


    try {
        // Fetch download info from the proxy
        const proxyResponse = await fetch(`${YOUTUBE_DL_PROXY_API}${encodeURIComponent(url)}`);
        if (!proxyResponse.ok) {
            throw new Error(`Proxy API error: ${proxyResponse.status} - ${await proxyResponse.text()}`);
        }
        const videoInfo = await proxyResponse.json();

        if (!videoInfo || !videoInfo.formats || videoInfo.formats.length === 0) {
          await editMessage(chatId, processingMessageId, '❌ No downloadable formats found.');
          return;
      }
        // Filter formats (optional - customize as needed)
        const filteredFormats = videoInfo.formats.filter(format =>
            (format.ext === 'mp4' || format.ext === 'webm' || format.ext === 'm4a')
        );

        // Create inline keyboard buttons
        const keyboard = {
            inline_keyboard: filteredFormats.map(format => [{
                text: `${format.format_note || format.ext} (${format.filesize ? format.filesize : 'Unknown Size'})`,
                callback_data: `download:${format.url}:${format.ext}:${format.filesize}:${videoInfo.title}`
            }])
        };

        // Edit the processing message to show download options
        await editMessage(chatId, processingMessageId, 'Download formats ↓', keyboard);

    } catch (error) {
        console.error(error);
        await editMessage(chatId, processingMessageId, `❌ An error occurred: ${error.message}`);
    }
}

async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  if (data.startsWith('download:')) {
      const [, downloadUrl, ext, filesize, title] = data.split(':');
      const decodedTitle = decodeURIComponent(title); // Decode the title

      // Check file size before attempting to send
      const fileSizeNum = parseInt(filesize, 10);
        if (!isNaN(fileSizeNum) && fileSizeNum > MAX_FILE_SIZE) {
          await editMessage(chatId, messageId, `File is too large to send via Telegram.  Direct link:\n${downloadUrl}`);
          return;
      }
      await editMessage(chatId, messageId, '⬇️ Downloading...');


      try {
          // Fetch the video content
        const videoResponse = await fetch(downloadUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36'
              }
          });
          if (!videoResponse.ok) {
            throw new Error(`Download failed: ${videoResponse.status}`);
          }
           const arrayBuffer = await videoResponse.arrayBuffer();
            const blob = new Blob([arrayBuffer]);

          // Send the video/audio
          if (ext === 'mp4' || ext === 'webm') {
              await sendVideo(chatId, blob, `${decodedTitle}.${ext}`);
          } else if (ext === 'm4a') {
              await sendAudio(chatId, blob, `${decodedTitle}.${ext}`);
          } else {
            await editMessage(chatId, messageId, `Unsupported file type: ${ext}`);
            return;
          }


          await editMessage(chatId, messageId, '✅ Download successful!');

      } catch (error) {
          console.error(error);
          await editMessage(chatId, messageId, `❌ Download failed: ${error.message}`);
      }
  }
}


async function handleMessage(message) {
    const chatId = message.chat.id;
    const messageId = message.message_id;
    const text = message.text;

    if (text === '/start') {
        await handleStartCommand(chatId);
    } else if (text && text.startsWith('/url ')) {
        const url = text.substring(5).trim();
        await handleURLCommand(chatId, messageId, url);
    } else {
        await sendMessage(chatId, 'I don\'t understand that command. Use /start or /url.');
    }
}

async function sendMessage(chatId, text, replyMarkup = null, replyToMessageId = null) {
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown', // Use Markdown for formatting
    };
    if (replyMarkup) {
        body.reply_markup = replyMarkup;
    }
    if (replyToMessageId) {
      body.reply_to_message_id = replyToMessageId;
    }
    return fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
}


async function editMessage(chatId, messageId, text, replyMarkup = null) {
  const body = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown',
  };
  if (replyMarkup) {
      body.reply_markup = replyMarkup;
  }

  return fetch(`${TELEGRAM_API}/editMessageText`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
  });
}


async function sendVideo(chatId, videoBlob, filename) {
  const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('video', videoBlob, filename);

    return fetch(`${TELEGRAM_API}/sendVideo`, {
        method: 'POST',
        body: formData,
    });
}

async function sendAudio(chatId, audioBlob, filename) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('audio', audioBlob, filename);

  return fetch(`${TELEGRAM_API}/sendAudio`, {
      method: 'POST',
      body: formData,
  });
}


async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const update = await request.json();
            if (update.message) {
                await handleMessage(update.message);
            } else if (update.callback_query) {
                await handleCallbackQuery(update.callback_query);
            }
            return new Response('OK');
        } catch (error) {
            console.error(error);
            return new Response('Error processing update', { status: 500 });
        }
    } else if (request.method === 'GET') {
        // Simple health check for monitoring
        return new Response('Bot is running');
    }

    return new Response('Method not allowed', { status: 405 });
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

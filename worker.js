// Cloudflare Worker Telegram Bot with YouTube Downloader

// --- Configuration ---
const BOT_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'; // Replace with your bot's token
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const YTDL_API_URL = 'https://yt-download.org/api/widget/analyze'; // Example API (Use with caution and respect their terms)
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3';

// --- Utility Functions ---

// Function to send a Telegram API request
async function telegramApi(method, params = {}) {
  const url = `${BASE_URL}/${method}`;
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  };
  const response = await fetch(url, options);
  return response.json();
}

// Function to send a message to a chat
async function sendMessage(chat_id, text, reply_markup = null, parse_mode = 'Markdown') {
  const params = {
    chat_id,
    text,
    parse_mode,
  };
  if (reply_markup) {
    params.reply_markup = reply_markup;
  }
  return telegramApi('sendMessage', params);
}

// Function to edit a message
async function editMessage(chat_id, message_id, text, reply_markup = null, parse_mode = 'Markdown') {
  const params = {
    chat_id,
    message_id,
    text,
    parse_mode,
  };
  if (reply_markup) {
    params.reply_markup = reply_markup;
  }
  return telegramApi('editMessageText', params);
}


// Function to delete a message
async function deleteMessage(chat_id, message_id) {
  const params = {
    chat_id,
    message_id,
  };
  return telegramApi('deleteMessage', params);
}


// Function to generate download buttons
function generateDownloadButtons(formats) {
  const buttons = [];
  for (const format of formats) {
      if (format.ext === 'mp4' || format.ext === 'webm' || format.ext === 'mp3') { // Filter based on desired extensions
          buttons.push({
              text: `Download ${format.ext.toUpperCase()} - ${format.quality || format.resolution || format.abr || 'Unknown'}`, // Include quality/resolution/abr
              callback_data: `download_${format.url}`
          });
      }
  }

  if (buttons.length === 0) {
      return null; // No suitable formats found
  }

  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    const row = buttons.slice(i, i + 2);
    rows.push(row);
  }

  return {
    inline_keyboard: rows,
  };
}

// Function to process the YouTube URL and fetch download links
async function processYouTubeURL(chat_id, message_id, youtubeUrl) {
    try {
        await editMessage(chat_id, message_id, "⌛️ Your request is processing..."); // Initial processing message

        const ytDownloadResponse = await fetch(YTDL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': USER_AGENT,
            },
            body: `url=${encodeURIComponent(youtubeUrl)}`,
        });

        if (!ytDownloadResponse.ok) {
            console.error('Error from yt-download API:', await ytDownloadResponse.text());
            await editMessage(chat_id, message_id, "❌ Error processing the YouTube URL. Please check the URL or try again later.");
            return;
        }

        const ytDownloadData = await ytDownloadResponse.json();

        if (!ytDownloadData || !ytDownloadData.links) {
            console.error('Invalid response from yt-download API:', ytDownloadData);
            await editMessage(chat_id, message_id, "❌ Could not find download links for this video.");
            return;
        }

        const downloadButtons = generateDownloadButtons(ytDownloadData.links);

        if (!downloadButtons) {
            await editMessage(chat_id, message_id, "❌ No suitable download formats found for this video.");
            return;
        }

        await editMessage(chat_id, message_id, `Download formats ↓`, {
            reply_markup: downloadButtons
        });

    } catch (error) {
        console.error('Error processing YouTube URL:', error);
        await editMessage(chat_id, message_id, "❌ An error occurred while processing your request.  Please try again.");
    }
}




// --- Event Handler ---
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === 'POST') {
    const body = await request.json();

    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id;
      const text = message.text;

      if (text && text.startsWith('/url ')) {
          const youtubeUrl = text.substring(5).trim(); // Extract URL

          if (!youtubeUrl) {
              await sendMessage(chatId, "Please provide a YouTube URL after the /url command.");
              return new Response(null, {status: 200});
          }

          const processingMessage = await sendMessage(chatId, "⌛️ Your request is processing...");
          const processingMessageId = processingMessage.result.message_id;
          await processYouTubeURL(chatId, processingMessageId, youtubeUrl);
          return new Response(null, {status: 200});
      }
    } else if (body.callback_query) {
        const callbackQuery = body.callback_query;
        const callbackData = callbackQuery.data;
        const message = callbackQuery.message;
        const chatId = message.chat.id;
        const messageId = message.message_id;

        if (callbackData && callbackData.startsWith('download_')) {
            const downloadUrl = callbackData.substring(9);  // Extract URL
            await telegramApi('answerCallbackQuery', { callback_query_id: callbackQuery.id }); // Acknowledge the button press

            try {
              // Send the video/audio
              await telegramApi('sendChatAction', { chat_id: chatId, action: 'upload_document' });
                const downloadResponse = await fetch(downloadUrl, {
                  headers: {
                      'User-Agent': USER_AGENT,
                  }
                });

                if (!downloadResponse.ok) {
                    console.error('Error downloading file:', await downloadResponse.text());
                    await editMessage(chatId, messageId, "❌ Error downloading the file.");
                    return;
                }

                const contentType = downloadResponse.headers.get('content-type');
                const filename =  decodeURIComponent(new URL(downloadUrl).pathname.split('/').pop()); //Extract Filename

                if (contentType.startsWith('video/')) {
                    await telegramApi('sendVideo', {
                        chat_id: chatId,
                        video: await downloadResponse.blob(),
                        filename: filename,
                        supports_streaming: true //For streaming
                    });
                } else if (contentType.startsWith('audio/')) {
                    await telegramApi('sendAudio', {
                        chat_id: chatId,
                        audio: await downloadResponse.blob(),
                        filename: filename,
                    });
                } else {
                    await telegramApi('sendDocument', {
                        chat_id: chatId,
                        document: await downloadResponse.blob(),
                        filename: filename,
                    });
                }
               await deleteMessage(chatId, messageId);

            } catch (error) {
                console.error('Error sending file:', error);
                await editMessage(chatId, messageId, "❌ An error occurred while sending the file.");
            }
        }

        return new Response(null, { status: 200 });
    }
  }
  return new Response('OK', { status: 200 });
}

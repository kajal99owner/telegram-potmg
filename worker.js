// Cloudflare Worker Code

// --- Configuration ---
const TELEGRAM_BOT_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'; // Replace with your bot token
const INSTAGRAM_API_BASE_URL = 'https://www.instagram.com/p/'; // Base URL, we'll append the shortcode
const WEBHOOK_PATH = '/webhook'; // Optional:  Set a custom path for the webhook
const WORKER_URL = 'https://tetegram-potmg.bjplover94.workers.dev'; // Replace with YOUR deployed worker URL!


// --- Helper Functions ---

/**
 * Sends a message to Telegram.
 * @param {number} chatId The chat ID to send the message to.
 * @param {string} text The text of the message.
 * @param {object} [options] Additional options for the sendMessage method (e.g., reply_markup).
 */
async function sendMessage(chatId, text, options = {}) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML', // Use HTML for bold, italic, etc.
        ...options, // Spread additional options (like reply_markup)
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram API error: ${response.status} - ${errorText}`);
      // Handle error appropriately, e.g., retry, log, notify user
    }
    return await response.json(); // return response result
}

/**
 * Edits an existing Telegram message.
 * @param {number} chatId
 * @param {number} messageId
 * @param {string} text
 * @param {object} [options]
 */
async function editMessage(chatId, messageId, text, options = {}) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
    const payload = {
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML',
        ...options,
    };
     const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
             'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram API error: ${response.status} - ${errorText}`);
    }
    return await response.json();
}


/**
 * Extracts the Instagram shortcode from a URL.
 * @param {string} url The Instagram URL.
 * @returns {string|null} The shortcode (e.g., "C0f1e2g3h4j") or null if not found.
 */
function extractInstagramShortcode(url) {
    try {
        const parsedUrl = new URL(url);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean); // Split and remove empty segments
        if (pathSegments.length >= 2 && pathSegments[0] === 'p') {
            return pathSegments[1]; // The shortcode is the segment after "p"
        }

      if (pathSegments.length >= 2 && pathSegments[0] === 'reels' || pathSegments[0] === 'reel') {
            return pathSegments[1]; // Reels
        }

    } catch (error) {
        console.error("Invalid URL:", error);
        return null; // Invalid URL or shortcode not found
    }
    return null; //Shortcode not found
}


/**
 *  Fetches Instagram media data. This is a simplified example and might need adjustments.
 *  @param {string} shortcode
 */
async function fetchInstagramMedia(shortcode) {
    try {
        const url = `${INSTAGRAM_API_BASE_URL}${shortcode}/?__a=1&__d=dis`; //?__a=1&__d=dis  Important for JSON response
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36', // Simulate a mobile browser
                 // 'Cookie': 'YOUR_INSTAGRAM_COOKIES',  //  If needed for private posts (HIGHLY discouraged, see security notes)
            },
        });


        if (!response.ok) {
            const errorText = await response.text();

            if (response.status === 404) {
              throw new Error(`Instagram post not found (404). Shortcode: ${shortcode}`);
            } else if (response.status === 429) {
               throw new Error(`Rate limited by Instagram.  Consider implementing delays or using a proxy.`);
            }
            else {
                throw new Error(`Instagram API error: ${response.status} - ${errorText}`);
            }
        }

        const data = await response.json();

      //New graphql method
      if (data && data.graphql && data.graphql.shortcode_media) {
           const media = data.graphql.shortcode_media;
           let videoUrl = null;
           let audioUrl = null; // We'll try to extract audio separately

           if (media.video_url) {
             videoUrl = media.video_url;
           } else if (media.is_video && media.video_versions && media.video_versions.length > 0) {
              //Sometimes video_url does not exist, but is_video: true, so we check the versions
             videoUrl = media.video_versions[0].url; // Take the first video version
           } else if (media.display_url) {
                // If it's not a video, return the display_url (likely an image)
                return {
                    type: 'photo',
                    url: media.display_url
                }
           } else {
             throw new Error("No media URL found in the response.");
           }


           if (videoUrl) {
               return { type: 'video', url: videoUrl, audioUrl: audioUrl }; // Return both video and (potentially) audio URLs
           } else{
              throw new Error("No video or image media URL found in the response.");
           }
      }
       // Old items method
       else if (data && data.items && data.items[0]) {
            const item = data.items[0];
            if (item.video_versions) {
                // Prioritize the highest quality video
                const videoUrl = item.video_versions[0].url;
                return { type: 'video', url: videoUrl };
            } else if (item.image_versions2) {
                // Handle images (if video isn't available)
                const imageUrl = item.image_versions2.candidates[0].url;
                return { type: 'photo', url: imageUrl };
            } else {
                throw new Error("No media URL found in the response.");
            }
        } else {
            throw new Error("Unexpected response format from Instagram API.");
        }

    } catch (error) {
        console.error("Error fetching Instagram media:", error);
        throw error; // Re-throw the error so the caller can handle it
    }
}



/**
 * Handles the /start command.
 * @param {number} chatId
 */
async function handleStartCommand(chatId) {
    const welcomeMessage = `
<b>Welcome to the Instagram Downloader Bot!</b>

Send me an Instagram post link (e.g., <code>https://www.instagram.com/p/C0f1e2g3h4j/</code>) and I'll help you download it.

Use the /url command followed by the Instagram link.
    `;
    await sendMessage(chatId, welcomeMessage);
}

/**
 * Handles the /url command.
 * @param {number} chatId
 * @param {string} text The message text containing the command and URL.
 */
async function handleUrlCommand(chatId, text, messageId) {
  const url = text.substring(5).trim(); // Extract URL after /url command, remove extra whitespace


  if (!url) {
     await sendMessage(chatId, "Please provide an Instagram URL after the /url command.");
     return;
  }

   const shortcode = extractInstagramShortcode(url);
   if (!shortcode) {
        await sendMessage(chatId, "Invalid Instagram URL. Please provide a valid link to a post or reel.");
        return;
    }

    // Send "processing" message *and store its message ID*
    const processingMessage = await sendMessage(chatId, "⌛️ Your request is processing.");
    const processingMessageId = processingMessage.result.message_id;


    try {
        const media = await fetchInstagramMedia(shortcode);

        // Create inline keyboard
        const inlineKeyboard = {
          inline_keyboard: [
            [
                { text: 'Video ↓', callback_data: `download:${shortcode}:video` },
               // { text: 'Audio ↓', callback_data: `download:${shortcode}:audio` }, // Add if you can reliably extract audio
            ],
          ],
        };


        if (media.type === 'video') {
          //Edit Message
          await editMessage(chatId, processingMessageId, "Download formats ↓", {
             reply_markup: inlineKeyboard,
           });

        } else if (media.type === 'photo') {
            // Send the photo
            await editMessage(chatId, processingMessageId, "✅ Successfully Downloaded!"); //Edit Processing to successfully
            await sendPhoto(chatId, media.url);
        } else {
            await editMessage(chatId, processingMessageId, "Unsupported media type.");
        }

    } catch (error) {
        console.error(error);  // Log the error for debugging
        await editMessage(chatId, processingMessageId, `An error occurred: ${error.message}`);
    }
}


/**
 * Sends a video using Telegram's sendVideo method.
 * @param {number} chatId
 * @param {string} videoUrl
 */
async function sendVideo(chatId, videoUrl) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`;
    const payload = {
        chat_id: chatId,
        video: videoUrl,
        supports_streaming: true, // Add this! Important for larger videos
    };
     const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
             'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram API error: ${response.status} - ${errorText}`);
       throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }
    return await response.json();

}


/**
 * Sends a photo using Telegram's sendPhoto method.
 * @param {number} chatId
 * @param {string} photoUrl
 */
async function sendPhoto(chatId, photoUrl) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const payload = {
        chat_id: chatId,
        photo: photoUrl,
    };

     const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
             'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram API error: ${response.status} - ${errorText}`);
       throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }
    return await response.json();
}

/**
 * Handles callback queries (button presses).
 * @param {object} callbackQuery
 */
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data; // The callback_data we set earlier (e.g., "download:C0f1e2g3h4j:video")


  if (data.startsWith('download:')) {
    const [, shortcode, format] = data.split(':');  // Destructure the data

     try {
        const media = await fetchInstagramMedia(shortcode);

        if (format === 'video') {
          if (media.type === 'video') {
            await editMessage(chatId, messageId, "✅ Successfully Downloaded!");
            await sendVideo(chatId, media.url);
          } else {
            await editMessage(chatId, messageId, "This post does not contain a video.");
          }
        } /* else if (format === 'audio') {  // Implement this if you extract audio
             if (media.audioUrl) {
                 await editMessage(chatId, messageId, "✅ Successfully Downloaded!");
                 await sendAudio(chatId, media.audioUrl); // You'll need a sendAudio function
             } else {
                 await editMessage(chatId, messageId, "Could not extract audio from this post.");
             }
        } */

    } catch (error) {
      await editMessage(chatId, messageId, `Error processing download: ${error.message}`);
    }
  }

    // Always answer the callback query, even if it's an error.
    await answerCallbackQuery(callbackQuery.id);
}

/**
 * Answers a callback query.  This is REQUIRED to stop the loading indicator on the button.
 * @param {string} callbackQueryId
 */
async function answerCallbackQuery(callbackQueryId) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    const payload = {
        callback_query_id: callbackQueryId,
        // text: '✅ Done',  // Optional: Show a notification to the user
        // show_alert: false, // Optional: Set to true for an alert-style notification
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
             'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram API error: ${response.status} - ${errorText}`);
    }
    return await response.json();
}

async function setWebhook() {
    const webhookUrl = `${WORKER_URL}${WEBHOOK_PATH}`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

    const response = await fetch(url);
    const data = await response.json();
     console.log('Set Webhook:', data);

    if (!response.ok || !data.ok) {
        console.error('Error setting webhook:', data);
        return new Response(`Error setting webhook: ${JSON.stringify(data)}`, { status: 500 });
    }
    return new Response('Webhook set successfully!', { status: 200 });
}


// --- Main Request Handler ---
async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const update = await request.json();

            // Handle different update types
            if (update.message) {
                const chatId = update.message.chat.id;
                const text = update.message.text;
                const messageId = update.message.message_id;


                if (text === '/start') {
                    await handleStartCommand(chatId);
                } else if (text.startsWith('/url ')) {
                    await handleUrlCommand(chatId, text, messageId);
                } else {
                    await sendMessage(chatId, "I don't understand that command. Use /start or /url.");
                }
            } else if (update.callback_query) {
                await handleCallbackQuery(update.callback_query);
            }

            return new Response('OK', { status: 200 }); // Acknowledge the update

        } catch (error) {
            console.error("Error processing update:", error);
            return new Response('Error processing update', { status: 500 });
        }

    } else if (request.method === 'GET' && request.url.endsWith('/setWebhook')) {
        // Set the webhook (only needs to be done once, or when your worker URL changes)
        return await setWebhook();
    }
    else {
        return new Response('Hello, this is your Instagram downloader bot!', { status: 200 }); // Default response for GET requests
    }
}

// --- Event Listener ---
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const RAPIDAPI_KEY = 'c7e2fc48e0msh077ba9d1e502feep11ddcbjsn4653c738de70';
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36';

async function handleRequest(request) {
    try {
        const url = new URL(request.url);
        if (url.pathname === '/url' && request.method === 'POST') {
            return handleTelegramUpdate(await request.json());
        }
        return new Response('OK');
    } catch (error) {
        return new Response(error.stack, { status: 500 });
    }
}

async function handleTelegramUpdate(update) {
    if (!update.message) return new Response('OK');
    
    const chatId = update.message.chat.id;
    const messageId = update.message.message_id;
    const text = update.message.text || '';
    
    if (text.startsWith('/url')) {
        return handleUrlCommand(chatId, messageId, text);
    }
    
    return new Response('OK');
}

async function handleUrlCommand(chatId, messageId, text) {
    // Send processing message
    const processingMessage = await sendTelegramMessage(chatId, '⌛️ Your request is processing.');
    
    try {
        const videoUrl = text.split(' ')[1];
        if (!videoUrl) throw new Error('No URL provided');
        
        const mediaInfo = await fetchMediaInfo(videoUrl);
        const buttons = createFormatButtons(mediaInfo);
        
        // Delete processing message
        await deleteTelegramMessage(chatId, processingMessage.result.message_id);
        
        // Send media options
        return sendTelegramMessage(chatId, 'Download formats ↓', buttons);
    } catch (error) {
        await deleteTelegramMessage(chatId, processingMessage.result.message_id);
        return sendTelegramMessage(chatId, `❌ Error: ${error.message}`);
    }
}

function createFormatButtons(mediaInfo) {
    return {
        inline_keyboard: [
            [{
                text: '🎥 Video',
                callback_data: `format:video:${mediaInfo.videoUrl}`
            }],
            [{
                text: '🎧 Audio',
                callback_data: `format:audio:${mediaInfo.audioUrl}`
            }]
        ]
    };
}

async function fetchMediaInfo(url) {
    const apiUrl = 'https://youtube-media-downloader.p.rapidapi.com/v2/misc/list-items';
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'User-Agent': USER_AGENT,
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'youtube-media-downloader.p.rapidapi.com',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ url })
    });

    if (!response.ok) throw new Error('Failed to fetch media info');
    
    const data = await response.json();
    // Parse response and extract video/audio URLs
    return {
        videoUrl: data.videoStreams[0].url,
        audioUrl: data.audioStreams[0].url
    };
}

async function sendTelegramMessage(chatId, text, buttons = null) {
    const payload = {
        chat_id: chatId,
        text,
        reply_markup: buttons
    };

    return fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT
        },
        body: JSON.stringify(payload)
    });
}

async function deleteTelegramMessage(chatId, messageId) {
    return fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT
        },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId
        })
    });
}

export default {
    fetch: handleRequest
};

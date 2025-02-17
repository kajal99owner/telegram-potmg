const USER_AGENT = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    if (request.method === 'OPTIONS') {
        return handleOptions();
    }
    
    const url = new URL(request.url);
    const ytUrl = url.searchParams.get('url');
    
    if (!ytUrl) {
        return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const videoId = getVideoId(ytUrl);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }

        const info = await getVideoInfo(videoId);
        return new Response(JSON.stringify(info), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

async function getVideoInfo(videoId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
    });
    
    if (!response.ok) throw new Error('Failed to fetch video page');
    
    const html = await response.text();
    const playerResponse = getPlayerResponse(html);
    
    if (!playerResponse) throw new Error('Failed to extract video data');
    
    const { videoDetails, streamingData } = playerResponse;
    const formats = [...streamingData.formats, ...streamingData.adaptiveFormats]
        .filter(format => format.url)
        .map(format => ({
            url: format.url,
            mimeType: format.mimeType,
            quality: format.qualityLabel || format.audioQuality,
            bitrate: format.bitrate,
            contentLength: format.contentLength,
            audioSampleRate: format.audioSampleRate
        }));

    return {
        title: videoDetails.title,
        author: videoDetails.author,
        lengthSeconds: videoDetails.lengthSeconds,
        viewCount: videoDetails.viewCount,
        formats: formats
    };
}

function getPlayerResponse(html) {
    const patterns = [
        /var ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var|<\/script)/,
        /ytInitialPlayerResponse\s*=\s*({.+?})\s*;/
    ];
    
    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
            try {
                return JSON.parse(match[1]);
            } catch (e) {
                continue;
            }
        }
    }
    return null;
}

function getVideoId(url) {
    const patterns = [
        /v=([^&#]+)/,
        /youtu\.be\/([^?#]+)/,
        /embed\/([^?#]+)/,
        /\/live\/([^?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
}

function handleOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}

// Cloudflare Worker (ES Modules syntax)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const params = url.searchParams;
    const userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";

    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // Route handlers
    try {
      if (path === "/info") {
        const videoUrl = params.get("url");
        if (!videoUrl) return new Response("Missing URL", { status: 400 });
        
        const videoId = getVideoId(videoUrl);
        if (!videoId) return new Response("Invalid URL", { status: 400 });
        
        const info = await getVideoInfo(videoId, userAgent);
        return Response.json(info, { headers });
      }

      if (path === "/mp3" || path === "/mp4") {
        const videoUrl = params.get("url");
        if (!videoUrl) return new Response("Missing URL", { status: 400 });
        
        const videoId = getVideoId(videoUrl);
        if (!videoId) return new Response("Invalid URL", { status: 400 });
        
        const { format, type } = path === "/mp3" 
          ? { format: "audio", type: "audio/mpeg" }
          : { format: "video", type: "video/mp4" };

        const streamUrl = await getStreamUrl(videoId, format, userAgent);
        
        // Proxy the media stream
        const mediaResponse = await fetch(streamUrl, {
          headers: { "User-Agent": userAgent }
        });

        return new Response(mediaResponse.body, {
          headers: {
            ...headers,
            "Content-Type": type,
            "Content-Disposition": `attachment; filename="video.${format === 'audio' ? 'mp3' : 'mp4'}"`
          }
        });
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      return new Response(error.message, { status: 500, headers });
    }
  }
};

// Helper functions
function getVideoId(url) {
  const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:&|\/|$)/);
  return match ? match[1] : null;
}

async function getVideoInfo(videoId, userAgent) {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": userAgent }
  });
  const html = await response.text();
  
  const jsonStr = html.match(/var ytInitialPlayerResponse\s*=\s*({.+?});<\/script>/is)?.[1];
  if (!jsonStr) throw new Error("Could not extract video info");
  
  const data = JSON.parse(jsonStr);
  return {
    title: data.videoDetails.title,
    thumbnail: data.videoDetails.thumbnail.thumbnails.pop().url
  };
}

async function getStreamUrl(videoId, format, userAgent) {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": userAgent }
  });
  const html = await response.text();
  
  const jsonStr = html.match(/var ytInitialPlayerResponse\s*=\s*({.+?});<\/script>/is)?.[1];
  if (!jsonStr) throw new Error("Could not extract stream data");
  
  const data = JSON.parse(jsonStr);
  const formats = data.streamingData.adaptiveFormats || [];
  
  const targetFormats = formats.filter(f => 
    format === 'audio' 
      ? f.mimeType.includes('audio/mp4') 
      : f.mimeType.includes('video/mp4')
  );
  
  if (targetFormats.length === 0) throw new Error("No formats found");
  
  const bestFormat = targetFormats.sort((a, b) => 
    (b.bitrate || 0) - (a.bitrate || 0)
  )[0];
  
  return bestFormat.url || bestFormat.signatureCipher?.url || bestFormat.cipher?.url;
}

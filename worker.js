addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const userAgent = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return new Response('Please add ?url=YOUTUBE_URL parameter', { status: 400 });
  }

  try {
    const videoId = getVideoId(videoUrl);
    if (!videoId) return new Response('Invalid YouTube URL', { status: 400 });

    const apiUrl = `https://yt.lemnoslife.com/videos?part=format&id=${videoId}`;
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': userAgent }
    });
    
    const data = await response.json();
    const formats = data.items[0].format;
    
    let html = `<h1>Available Formats:</h1>`;
    formats.forEach(format => {
      html += `<a href="${format.url}" target="_blank">${format.mimeType} - ${format.qualityLabel}</a><br>`;
    });

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}

function getVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

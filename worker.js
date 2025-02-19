// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const url = new URL(request.url)
    const fbUrl = url.searchParams.get('url')

    if (!fbUrl) {
      return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!isValidFacebookUrl(fbUrl)) {
      return new Response(JSON.stringify({ error: 'Invalid Facebook URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch(fbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    const html = await response.text()
    const videoUrl = extractVideoUrl(html)

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      video_url: videoUrl,
      download_url: `${url.origin}/download?url=${encodeURIComponent(videoUrl)}`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  }
}

function isValidFacebookUrl(url) {
  return /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch|fb.watch)\/.+/.test(url)
}

function extractVideoUrl(html) {
  // Try different parsing methods
  const metaTagMatch = html.match(/<meta property="og:video:url" content="(.*?)"/i)
  if (metaTagMatch) return metaTagMatch[1]

  const jsonDataMatch = html.match(/\["video","([^"]+\.mp4)/)
  if (jsonDataMatch) return jsonDataMatch[1]

  const hdSrcMatch = html.match(/"hd_src":"(https?:\\\/\\\/[^"]+?)"/)
  if (hdSrcMatch) return JSON.parse(`"${hdSrcMatch[1]}"`)

  return null
}

// Optional download proxy endpoint
addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (url.pathname === '/download') {
    event.respondWith(handleDownload(event.request))
  }
})

async function handleDownload(request) {
  const videoUrl = new URL(request.url).searchParams.get('url')
  const response = await fetch(videoUrl)
  return new Response(response.body, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': 'attachment; filename="facebook_video.mp4"'
    }
  })
)

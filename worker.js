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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    })

    const html = await response.text()
    const videoData = extractVideoData(html)

    return new Response(JSON.stringify(videoData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

function isValidFacebookUrl(url) {
  const facebookDomains = [
    'facebook.com',
    'www.facebook.com',
    'm.facebook.com',
    'fb.watch',
    'web.facebook.com'
  ]
  return facebookDomains.some(domain => url.includes(domain))
}

function extractVideoData(html) {
  const sdRegex = /sd_src:"([^"]+)"/g
  const hdRegex = /hd_src:"([^"]+)"/g
  const titleRegex = /<title[^>]*>([^<]+)<\/title>/g

  const sdMatch = sdRegex.exec(html)
  const hdMatch = hdRegex.exec(html)
  const titleMatch = titleRegex.exec(html)

  return {
    title: titleMatch ? titleMatch[1].replace(' | Facebook', '') : 'Untitled',
    sd_url: sdMatch ? sdMatch[1] : null,
    hd_url: hdMatch ? hdMatch[1] : null
  }
}

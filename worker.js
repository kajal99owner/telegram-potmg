// cloudflare-worker.js
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
        return new Response('Missing URL parameter', { status: 400 })
    }

    try {
        const downloadUrl = await getDownloadLink(url)
        return Response.redirect(downloadUrl, 302)
    } catch (error) {
        return new Response(error.message, { status: 500 })
    }
}

async function getDownloadLink(url) {
    // Parse input URL
    const parsedUrl = new URL(url)
    const domain = parsedUrl.hostname
    const surl = parsedUrl.searchParams.get('surl')
    
    // Configure headers
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': `https://${domain}/sharing/link?surl=${surl}`,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
    }

    // Add cookies from environment variables
    const cookieString = [
        `COOKIE1=${COOKIE1}`,
        `COOKIE2=${COOKIE2}`,
        // Add more cookies as needed
    ].join('; ')

    const apiUrl = `https://www.terabox.com/share/list?app_id=250528&shorturl=${surl}&root=1`
    
    const response = await fetch(apiUrl, {
        headers: {
            ...headers,
            'Cookie': cookieString
        }
    })

    if (!response.ok) {
        throw new Error('API request failed')
    }

    const data = await response.json()
    
    if (!data.list || !data.list[0]?.dlink) {
        throw new Error('Failed to extract download link')
    }

    return data.list[0].dlink
      }

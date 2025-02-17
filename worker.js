addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new Response('URL parameter is missing', { status: 400 })
  }

  try {
    const apiUrl = `https://www.instagram.com/oembed/?url=${url}`
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
      }
    })
    const apiData = await apiResponse.json()
    const mediaUrl = apiData.thumbnail_url

    const mediaResponse = await fetch(mediaUrl)
    const mediaBlob = await mediaResponse.blob()

    return new Response(mediaBlob, {
      headers: {
        'Content-Type': mediaResponse.headers.get('Content-Type')
      }
    })
  } catch (error) {
    return new Response('Failed to fetch media', { status: 500 })
  }
}

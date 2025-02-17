addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')

    if (!fileUrl) {
      return new Response('Missing URL parameter', { status: 400 })
    }

    const response = await fetchTeraboxData(fileUrl)
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function fetchTeraboxData(url) {
  const apiUrl = new URL('https://terabox-downloader-tool.p.rapidapi.com/api')
  apiUrl.searchParams.set('url', url)

  const options = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36',
      'x-rapidapi-key': 'db42e4f68fmshe9a243ed929713ap1fa72ajsnb431ef7a74ac',
      'x-rapidapi-host': 'terabox-downloader-tool.p.rapidapi.com'
    }
  }

  const response = await fetch(apiUrl.toString(), options)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }
  return response.json()
}

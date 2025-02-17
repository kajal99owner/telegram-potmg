addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Set CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  })

  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  // Get URL parameter
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
      status: 400,
      headers
    })
  }

  // API request configuration
  const apiUrl = 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink'
  const apiHeaders = {
    'x-rapidapi-key': 'db42e4f68fmshe9a243ed929713ap1fa72ajsnb431ef7a74ac',
    'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36'
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({ url })
    })

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers,
      status: response.status
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers
    })
  }
}

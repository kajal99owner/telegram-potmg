addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  try {
    // Get URL from query parameters or request body
    const url = new URL(request.url)
    let targetUrl = url.searchParams.get('url')

    if (!targetUrl && request.method === 'POST') {
      const body = await request.json()
      targetUrl = body.url
    }

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    // API request options
    const apiOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36',
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com'
      },
      body: JSON.stringify({ url: targetUrl })
    }

    // Make API request
    const response = await fetch('https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink', apiOptions)
    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  }
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

const userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"

async function handleRequest(request) {
    const url = new URL(request.url)
    const videoUrl = url.searchParams.get('url')
    const quality = url.searchParams.get('quality') || 'highest'

    if (!videoUrl) {
        return new Response('Missing URL parameter', { status: 400 })
    }

    if (!/^https:\/\/(\w{1,3}\.)?pornhub\.com\/view_video\.php\?viewkey=\w+$/i.test(videoUrl)) {
        return new Response('Invalid URL format', { status: 400 })
    }

    try {
        const response = await fetch(videoUrl, {
            headers: { 'User-Agent': userAgent }
        })

        if (!response.ok) {
            return new Response(`Failed to fetch video page: ${response.status}`, { status: response.status })
        }

        const html = await response.text()
        const videoSources = extractVideoSources(html)
        
        if (videoSources.length === 0) {
            return new Response('No video sources found', { status: 404 })
        }

        const selectedSource = selectQuality(videoSources, quality)
        if (!selectedSource) {
            return new Response(`Requested quality (${quality}) not available`, { status: 404 })
        }

        const videoResponse = await fetch(selectedSource.url, {
            headers: { 'User-Agent': userAgent }
        })

        return new Response(videoResponse.body, {
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Disposition': `attachment; filename="${generateFileName(selectedSource)}"`
            }
        })
    } catch (error) {
        return new Response(error.message, { status: 500 })
    }
}

function extractVideoSources(html) {
    const matches = html.match(/\*\/\w+/g) || []
    const sources = []
    let currentUrl = ''

    matches.forEach(match => {
        const varName = match.replace(/\W/g, '')
        const regex = new RegExp(`${varName}=".*?";`, 'g')
        const result = html.match(regex)?.[0]?.split(';')?.[0]?.replace(`${varName}=`, '') || ''
        const value = result.replace(/["+ ]/g, '')

        if (value.startsWith('https')) {
            if (currentUrl) sources.push(currentUrl)
            currentUrl = value
        } else {
            currentUrl += value
        }
    })

    return [...new Set(sources)]
        .filter(url => !url.includes('master'))
        .map(url => ({
            url,
            quality: url.match(/\d+P/)?.[0] || 'unknown'
        }))
}

function selectQuality(sources, quality) {
    const qualityOrder = ['1080p', '720p', '480p', '240p']
    const sorted = [...sources].sort((a, b) => 
        qualityOrder.indexOf(b.quality) - qualityOrder.indexOf(a.quality)
    )

    switch (quality.toLowerCase()) {
        case 'highest': return sorted[0]
        case 'lowest': return sorted[sorted.length - 1]
        default: return sorted.find(s => s.quality === quality)
    }
}

function generateFileName(source) {
    const quality = source.quality || 'unknown'
    const id = source.url.match(/\d+K_\d+\.mp4/)?.[0]?.replace('.mp4', '') || Date.now()
    return `${quality}_${id}.mp4`
 }

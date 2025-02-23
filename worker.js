// index.js (Cloudflare Worker)
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pinterest Media Downloader</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .gradient-bg {
            background: linear-gradient(120deg, #f093fb 0%, #f5576c 100%);
        }
        .card-blur {
            backdrop-filter: blur(16px) saturate(180%);
            background-color: rgba(255, 255, 255, 0.75);
        }
        .media-container {
            transition: opacity 0.3s ease;
        }
    </style>
</head>
<body class="gradient-bg min-h-screen">
    <div class="container mx-auto px-4 py-16">
        <div class="max-w-2xl mx-auto card-blur rounded-2xl shadow-xl p-8">
            <h1 class="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Pinterest Media Downloader
            </h1>
            
            <div class="space-y-6">
                <input 
                    type="text" 
                    id="urlInput" 
                    placeholder="Enter Pinterest URL" 
                    class="w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                >
                
                <button 
                    onclick="downloadMedia()" 
                    class="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-transform transform hover:scale-105 active:scale-95"
                >
                    Download Now
                </button>
                
                <div id="result" class="mt-6 space-y-4 hidden">
                    <div id="previewContainer" class="aspect-w-1 aspect-h-1 bg-gray-100 rounded-xl overflow-hidden"></div>
                    <a id="downloadBtn" class="inline-block w-full px-6 py-3 text-center bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-transform transform hover:scale-105">
                        Download HD Quality
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function downloadMedia() {
            const url = document.getElementById('urlInput').value;
            const resultDiv = document.getElementById('result');
            const previewContainer = document.getElementById('previewContainer');
            const downloadBtn = document.getElementById('downloadBtn');

            if (!url) {
                alert('Please enter a Pinterest URL');
                return;
            }

            try {
                previewContainer.innerHTML = '<div class="media-container opacity-0">Loading...</div>';
                resultDiv.classList.remove('hidden');
                
                const response = await fetch('/api/download?url=' + encodeURIComponent(url));
                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                previewContainer.innerHTML = '';
                let mediaElement;

                if (data.type === 'video') {
                    mediaElement = document.createElement('video');
                    mediaElement.controls = true;
                    mediaElement.className = 'object-cover w-full h-full';
                } else {
                    mediaElement = document.createElement('img');
                    mediaElement.className = 'object-cover w-full h-full opacity-0';
                    mediaElement.onload = () => {
                        mediaElement.classList.add('opacity-100');
                        mediaElement.classList.remove('opacity-0');
                    };
                }

                mediaElement.src = data.mediaUrl;
                previewContainer.appendChild(mediaElement);
                downloadBtn.href = data.mediaUrl + '&download=true';
                
                resultDiv.classList.remove('hidden');
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
    </script>
</body>
</html>
`;

async function extractMediaUrl(html) {
    const metaPatterns = {
        video: [
            /<meta\s+property="og:video"\s+content="([^"]*)"/i,
            /<meta\s+property="twitter:player:stream"\s+content="([^"]*)"/i
        ],
        image: [
            /<meta\s+property="og:image"\s+content="([^"]*)"/i,
            /<meta\s+property="twitter:image:src"\s+content="([^"]*)"/i
        ]
    };

    for (const regex of metaPatterns.video) {
        const match = html.match(regex);
        if (match) return { url: match[1], type: 'video' };
    }

    for (const regex of metaPatterns.image) {
        const match = html.match(regex);
        if (match) return { url: match[1], type: 'image' };
    }

    throw new Error('No media found in the page');
}

async function handleMediaRequest(pinterestUrl, request) {
    try {
        const response = await fetch(pinterestUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.pinterest.com/'
            }
        });
        
        const html = await response.text();
        const { url: mediaUrl, type } = await extractMediaUrl(html);
        const finalResponse = await fetch(mediaUrl);
        const finalUrl = finalResponse.url;

        return {
            mediaUrl: `${new URL(request.url).origin}/api/proxy?url=${encodeURIComponent(finalUrl)}`,
            type
        };
    } catch (error) {
        return { error: error.message };
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        if (url.pathname === '/api/download') {
            const pinterestUrl = url.searchParams.get('url');
            const result = await handleMediaRequest(pinterestUrl, request);
            return new Response(JSON.stringify(result), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        if (url.pathname === '/api/proxy') {
            const mediaUrl = url.searchParams.get('url');
            return fetch(mediaUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://www.pinterest.com/'
                }
            }).then(res => {
                const headers = new Headers(res.headers);
                headers.set('Access-Control-Allow-Origin', '*');
                
                if (url.searchParams.has('download')) {
                    const ext = mediaUrl.includes('.mp4') ? 'mp4' : 'jpg';
                    headers.set('Content-Disposition', `attachment; filename="pinterest-media.${ext}"`);
                }

                return new Response(res.body, {
                    status: res.status,
                    headers
                });
            });
        }

        return new Response(htmlContent, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
};
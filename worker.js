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
                    <div class="aspect-w-1 aspect-h-1 bg-gray-100 rounded-xl overflow-hidden">
                        <img id="previewImage" class="object-cover w-full h-full" alt="Preview">
                    </div>
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
            const previewImage = document.getElementById('previewImage');
            const downloadBtn = document.getElementById('downloadBtn');

            if (!url) {
                alert('Please enter a Pinterest URL');
                return;
            }

            try {
                const response = await fetch('/api/download?url=' + encodeURIComponent(url));
                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                previewImage.src = data.mediaUrl;
                downloadBtn.href = data.mediaUrl;
                resultDiv.classList.remove('hidden');
                previewImage.onload = () => {
                    previewImage.classList.remove('opacity-0');
                };
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
    </script>
</body>
</html>
`;

async function handleMediaRequest(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract media URL from meta tags
        const metaImage = doc.querySelector('meta[property="og:image"]') || 
                          doc.querySelector('meta[property="twitter:image:src"]');
        
        // For video content
        const metaVideo = doc.querySelector('meta[property="og:video"]') || 
                         doc.querySelector('meta[property="twitter:player:stream"]');

        const mediaUrl = metaVideo ? metaVideo.content : metaImage.content;

        // Handle Pinterest CDN redirects
        const finalResponse = await fetch(mediaUrl);
        const finalUrl = finalResponse.url;

        return new Response(JSON.stringify({
            mediaUrl: finalUrl,
            type: metaVideo ? 'video' : 'image'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to fetch media. Make sure the URL is valid.'
        }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        if (url.pathname === '/api/download') {
            const pinterestUrl = url.searchParams.get('url');
            return handleMediaRequest(pinterestUrl);
        }
        
        return new Response(htmlContent, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
};
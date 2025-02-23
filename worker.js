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
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .gradient-bg {
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradient 15s ease infinite;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .hover-scale {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-scale:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body class="gradient-bg min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-2xl glass-card rounded-2xl shadow-2xl p-8">
        <h1 class="text-5xl font-black text-center mb-8 bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
            Pinterest Download Pro
        </h1>
        
        <div class="space-y-8">
            <div class="relative">
                <input 
                    type="text" 
                    id="urlInput" 
                    placeholder="Enter Pinterest URL" 
                    class="w-full px-6 py-4 text-lg rounded-xl border-2 border-white/30 bg-white/20 placeholder-white/50 text-white focus:outline-none focus:border-white/50 focus:bg-white/30"
                >
            </div>
            
            <button 
                onclick="downloadMedia()" 
                id="downloadButton"
                class="w-full px-8 py-4 bg-white/30 hover:bg-white/40 text-white text-xl font-bold rounded-xl hover-scale flex items-center justify-center gap-2"
            >
                <span id="buttonText">Download Now</span>
                <svg id="spinner" class="animate-spin h-6 w-6 text-white hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </button>
            
            <div id="result" class="mt-8 space-y-6 hidden">
                <div class="relative group">
                    <div class="aspect-w-1 aspect-h-1 rounded-2xl overflow-hidden shadow-xl bg-white/10">
                        <img id="previewImage" class="object-cover w-full h-full transition-opacity duration-300 opacity-0" alt="Preview">
                        <video id="previewVideo" class="object-cover w-full h-full hidden" controls></video>
                        <div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="text-white text-lg font-semibold">Preview</span>
                        </div>
                    </div>
                </div>
                
                <a 
                    id="downloadBtn" 
                    class="inline-block w-full px-8 py-4 text-center bg-white/30 hover:bg-white/40 text-white text-xl font-bold rounded-xl hover-scale"
                >
                    Download HD Content
                </a>
            </div>
        </div>
    </div>

    <script>
        async function downloadMedia() {
            const urlInput = document.getElementById('urlInput');
            const url = urlInput.value;
            const resultDiv = document.getElementById('result');
            const downloadButton = document.getElementById('downloadButton');
            const buttonText = document.getElementById('buttonText');
            const spinner = document.getElementById('spinner');

            if (!url) {
                alert('Please enter a Pinterest URL');
                return;
            }

            try {
                downloadButton.disabled = true;
                buttonText.textContent = 'Processing...';
                spinner.classList.remove('hidden');

                const response = await fetch('/api/info?url=' + encodeURIComponent(url));
                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                // Handle media preview
                if (data.type === 'video') {
                    document.getElementById('previewVideo').classList.remove('hidden');
                    document.getElementById('previewImage').classList.add('hidden');
                    document.getElementById('previewVideo').src = data.mediaUrl;
                } else {
                    document.getElementById('previewImage').classList.remove('hidden');
                    document.getElementById('previewVideo').classList.add('hidden');
                    document.getElementById('previewImage').src = data.mediaUrl;
                    document.getElementById('previewImage').onload = () => {
                        document.getElementById('previewImage').classList.remove('opacity-0');
                    };
                }

                // Update download button
                const downloadBtn = document.getElementById('downloadBtn');
                downloadBtn.href = '/api/download?url=' + encodeURIComponent(url);
                downloadBtn.download = data.type === 'video' ? 'pinterest-video.mp4' : 'pinterest-image.jpg';
                downloadBtn.textContent = data.type === 'video' 
                    ? 'Download HD Video (MP4)' 
                    : 'Download HD Image (JPEG)';

                resultDiv.classList.remove('hidden');
            } catch (error) {
                alert('Error: ' + error.message);
                resultDiv.classList.add('hidden');
            } finally {
                downloadButton.disabled = false;
                buttonText.textContent = 'Download Now';
                spinner.classList.add('hidden');
            }
        }
    </script>
</body>
</html>
`;

async function getMediaInfo(pinterestUrl) {
    try {
        const response = await fetch(pinterestUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://pinterest.com/'
            }
        });
        const finalUrl = response.url;
        const html = await response.text();

        // Extract media URL using regex patterns
        const mediaPatterns = [
            { type: 'video', regex: /<meta property="og:video" content="(.*?)"/i },
            { type: 'video', regex: /<meta property="twitter:player:stream" content="(.*?)"/i },
            { type: 'image', regex: /<meta property="og:image" content="(.*?)"/i },
            { type: 'image', regex: /<meta property="twitter:image:src" content="(.*?)"/i }
        ];

        for (const pattern of mediaPatterns) {
            const match = html.match(pattern.regex);
            if (match && match[1]) {
                // Resolve final media URL
                const mediaResponse = await fetch(match[1]);
                return {
                    mediaUrl: mediaResponse.url,
                    type: pattern.type,
                    sourceUrl: finalUrl
                };
            }
        }

        throw new Error('No media found in the provided URL');
    } catch (error) {
        throw new Error('Failed to process URL: ' + error.message);
    }
}

async function handleDownloadRequest(pinterestUrl) {
    try {
        const { mediaUrl, type } = await getMediaInfo(pinterestUrl);
        const mediaResponse = await fetch(mediaUrl);
        
        // Create downloadable response
        const headers = new Headers(mediaResponse.headers);
        headers.set('Content-Disposition', 
            `attachment; filename="pinterest-${Date.now()}${type === 'video' ? '.mp4' : '.jpg'}"`
        );
        headers.set('Access-Control-Allow-Origin', '*');

        return new Response(mediaResponse.body, {
            headers,
            status: mediaResponse.status
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        if (url.pathname === '/api/info') {
            try {
                const pinterestUrl = url.searchParams.get('url');
                const { mediaUrl, type, sourceUrl } = await getMediaInfo(pinterestUrl);
                return new Response(JSON.stringify({ mediaUrl, type, sourceUrl }), {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Cache-Control': 'max-age=3600'
                    }
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        if (url.pathname === '/api/download') {
            const pinterestUrl = url.searchParams.get('url');
            return handleDownloadRequest(pinterestUrl);
        }

        return new Response(htmlContent, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
};
// index.js (Cloudflare Worker)

// HTML content for the webpage
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
         /* New Styles */
        .neon-button {
            position: relative;
            display: inline-block;
            padding: 10px 20px;
            color: #fff;
            font-size: 16px;
            text-decoration: none;
            text-transform: uppercase;
            overflow: hidden;
            transition: .5s;
            letter-spacing: 4px
        }
        
        .neon-button:hover {
            background: #03e9f4;
            color: #fff;
            border-radius: 5px;
            box-shadow: 0 0 5px #03e9f4,
                        0 0 25px #03e9f4,
                        0 0 50px #03e9f4,
                        0 0 100px #03e9f4;
        }
        
        .neon-button span {
            position: absolute;
            display: block;
        }
        
        .neon-button span:nth-child(1) {
            top: 0;
            left: -100%;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #03e9f4);
            animation: animate1 1s linear infinite;
        }
        
        @keyframes animate1 {
            0% {
                left: -100%;
            }
            50%,100% {
                left: 100%;
            }
        }
        
        .neon-button span:nth-child(2) {
            top: -100%;
            right: 0;
            width: 2px;
            height: 100%;
            background: linear-gradient(180deg, transparent, #03e9f4);
            animation: animate2 1s linear infinite;
            animation-delay: .25s
        }
        
        @keyframes animate2 {
            0% {
                top: -100%;
            }
            50%,100% {
                top: 100%;
            }
        }
        
        .neon-button span:nth-child(3) {
            bottom: 0;
            right: -100%;
            width: 100%;
            height: 2px;
            background: linear-gradient(270deg, transparent, #03e9f4);
            animation: animate3 1s linear infinite;
            animation-delay: .5s
        }
        
        @keyframes animate3 {
            0% {
                right: -100%;
            }
            50%,100% {
                right: 100%;
            }
        }
        
        .neon-button span:nth-child(4) {
            bottom: -100%;
            left: 0;
            width: 2px;
            height: 100%;
            background: linear-gradient(360deg, transparent, #03e9f4);
            animation: animate4 1s linear infinite;
            animation-delay: .75s
        }
        
        @keyframes animate4 {
            0% {
                bottom: -100%;
            }
            50%,100% {
                bottom: 100%;
            }
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
                
               <!-- Button with Neon Effect -->
               <a href="#" class="neon-button" onclick="downloadMedia()">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    Download Now
                </a>
                
                <div id="result" class="mt-6 space-y-4 hidden">
                    <div class="aspect-w-1 aspect-h-1 bg-gray-100 rounded-xl overflow-hidden">
                        <img id="previewImage" class="object-cover w-full h-full" alt="Preview">
                    </div>
                     <!-- Download Link with Neon Effect -->
                    <a id="downloadBtn" class="neon-button inline-block w-full px-6 py-3 text-center  font-semibold rounded-lg transition-transform transform hover:scale-105">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
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
                downloadBtn.download = 'pinterest_media'; // Suggest a filename
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

// Function to handle the media request and extract the download URL
async function handleMediaRequest(url) {
    try {
        const response = await fetch(url, {
            redirect: 'follow', // Important to follow redirects
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Try different selectors to find the media URL
        let mediaUrl = null;

        //1. Look for "og:video" or "twitter:player:stream" for videos.
        let metaVideo = doc.querySelector('meta[property="og:video"]') || doc.querySelector('meta[property="twitter:player:stream"]');
        if(metaVideo){
            mediaUrl = metaVideo.content;
        } else {
           //2. If no video, look for "og:image" or "twitter:image" for images
            const metaImage = doc.querySelector('meta[property="og:image"]') || doc.querySelector('meta[name="twitter:image"]');
            if (metaImage) {
                mediaUrl = metaImage.content;
            } else {
               //3. Try a more generic selector if the above fail (sometimes Pinterest changes things)
               const imageSrc = doc.querySelector('img[src*="pinimg.com"]');
                if(imageSrc){
                    mediaUrl = imageSrc.src;
                }
            }
        }


        if (!mediaUrl) {
            throw new Error('Could not extract media URL from the page.');
        }

        // Resolve any potential CDN redirects for better reliability.
        const finalResponse = await fetch(mediaUrl, { redirect: 'follow' });
        const finalUrl = finalResponse.url; // Get the resolved URL

        return new Response(JSON.stringify({
            mediaUrl: finalUrl,
            type: metaVideo ? 'video' : 'image'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error during media extraction:", error); // Log the error for debugging
        return new Response(JSON.stringify({
            error: `Failed to fetch media: ${error.message}`
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}


export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Route the request based on the path
        if (url.pathname === '/api/download') {
            const pinterestUrl = url.searchParams.get('url');

             //Basic validation of the URL
             if (!pinterestUrl || (!pinterestUrl.startsWith('https://in.pinterest.com/') && !pinterestUrl.startsWith('https://pin.it/'))) {
                return new Response(JSON.stringify({ error: 'Invalid Pinterest URL' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return handleMediaRequest(pinterestUrl); // Call the media handling function
        }

        // Serve the HTML content for the base URL
        return new Response(htmlContent, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
};
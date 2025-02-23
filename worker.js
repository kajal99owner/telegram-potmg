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
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%);
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            border-radius: 15px;
            background: rgba(255, 255, 255, 0.7);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }
        h1 {
            text-align: center;
            font-size: 2.5rem;
            font-weight: 700;
            color: #553c9a;
            margin-bottom: 1.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        input[type="text"] {
            width: 100%;
            padding: 0.75rem 1rem;
            margin-bottom: 1rem;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            outline: none;
            transition: border-color 0.3s ease;
        }
        input[type="text"]:focus {
            border-color: #553c9a;
        }
        button {
            display: block;
            width: 100%;
            padding: 0.75rem 1rem;
            background-color: #553c9a;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.3s ease, transform 0.2s ease;
        }
        button:hover {
            background-color: #443280;
             transform: translateY(-2px); /* Slight lift effect */
        }

        #result {
            margin-top: 1.5rem;
            text-align: center;
        }

        #previewImage {
            max-width: 100%;
            max-height: 400px;  /* Limit height for better display */
            border-radius: 8px;
            margin-bottom: 1rem;
             box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        #downloadBtn {
            display: inline-block; /* or block, depending on layout needs */
            padding: 0.75rem 1.5rem;
            background-color: #28a745;
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: background-color 0.3s ease;
        }

        #downloadBtn:hover {
            background-color: #218838;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Pinterest Media Downloader</h1>
        <input type="text" id="urlInput" placeholder="Enter Pinterest URL (https://in.pinterest.com/... or https://pin.it/...)">
        <button onclick="downloadMedia()">Download Now</button>
        <div id="result" class="hidden">
            <img id="previewImage" alt="Preview">
            <a id="downloadBtn" href="#" target="_blank" rel="noopener noreferrer">Download HD</a>
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

            // Show loading indicator (optional, but good UX)
            resultDiv.classList.remove('hidden'); // Make sure result div is visible (even if empty)
            previewImage.src = ""; // Clear previous image
            downloadBtn.textContent = "Loading..."; // Change button text
            downloadBtn.href = "#"; // Disable the link while loading
            downloadBtn.style.pointerEvents = 'none'; // Prevent clicking while loading.


            try {
                const response = await fetch('/api/download?url=' + encodeURIComponent(url));
                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                previewImage.src = data.mediaUrl;
                downloadBtn.href = data.mediaUrl;
                downloadBtn.textContent = "Download HD";
                downloadBtn.style.pointerEvents = 'auto'; // Re-enable link

                // Optional:  Handle image/video-specific display
                if (data.type === 'video') {
                     // If it's a video, consider using a <video> element instead
                    previewImage.outerHTML = `<video id="previewImage" controls><source src="${data.mediaUrl}" type="video/mp4">Your browser does not support the video tag.</video>`;
                }

                resultDiv.classList.remove('hidden');

            } catch (error) {
                alert('Error: ' + error.message);
                 downloadBtn.textContent = "Download Now"; // Reset to original text on error
                 downloadBtn.style.pointerEvents = 'auto'; // Re-enable click after error.

            }
        }
    </script>
</body>
</html>
`;

async function handleMediaRequest(url) {
    try {
        // URL Validation and Normalization
        let pinterestUrl = url;
        if (!pinterestUrl.startsWith("https://")) {
            return new Response(JSON.stringify({ error: "Invalid URL.  Must start with https://" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        if (pinterestUrl.startsWith("https://pin.it/")) {
          // Follow redirects for short URLs.  Crucially, follow *all* redirects.
          let res = await fetch(pinterestUrl, {redirect: "follow"});
          pinterestUrl = res.url;
        }

        if (!pinterestUrl.startsWith("https://www.pinterest.com/") && !pinterestUrl.startsWith("https://in.pinterest.com/")) {
            return new Response(JSON.stringify({ error: "Invalid Pinterest URL.  Must be a pinterest.com or in.pinterest.com link." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }


        const response = await fetch(pinterestUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // More robust meta tag extraction, handling different cases.
        let metaImage = doc.querySelector('meta[property="og:image"]');
        let metaVideo = doc.querySelector('meta[property="og:video"]');

        // Fallback to other meta tags if og:image/og:video are not found
        if (!metaImage) {
             metaImage = doc.querySelector('meta[name="twitter:image:src"]') || doc.querySelector('meta[name="pinterest:media"]');
        }

         if (!metaVideo) {
           metaVideo = doc.querySelector('meta[property="twitter:player:stream"]');
         }
        
        if (!metaImage && !metaVideo) {
          return new Response(JSON.stringify({ error: "No media found on this Pinterest page." }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        let mediaUrl = metaVideo ? metaVideo.content : metaImage.content;

        if (!mediaUrl) {
            return new Response(JSON.stringify({ error: 'Could not extract media URL.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }


        // Handle potential relative URLs (rare, but good practice)
        if (mediaUrl.startsWith("//")) {
            mediaUrl = "https:" + mediaUrl;
        } else if (mediaUrl.startsWith("/")) {
            mediaUrl = new URL(mediaUrl, pinterestUrl).href; // Construct absolute URL
        }

        // Handle Pinterest CDN redirects (and any other redirects) reliably
        const finalResponse = await fetch(mediaUrl, { redirect: "follow" }); // Follow *all* redirects
        const finalUrl = finalResponse.url;

        return new Response(JSON.stringify({
            mediaUrl: finalUrl,
            type: metaVideo ? 'video' : 'image'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error in handleMediaRequest:", error); // Log the full error for debugging
        return new Response(JSON.stringify({
            error: 'Failed to fetch media.  The URL may be invalid, or Pinterest may have changed its structure.'
        }), {
            status: 500, // Use 500 for internal server errors
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/api/download') {
            const pinterestUrl = url.searchParams.get('url');
            if (!pinterestUrl) {
                return new Response(JSON.stringify({ error: "Missing 'url' parameter." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
            return handleMediaRequest(pinterestUrl);
        }

        return new Response(htmlContent, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
};
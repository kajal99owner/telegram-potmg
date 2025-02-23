import { JSDOM } from 'jsdom'; // You'll need to bundle this (see bundling section)
import { instagramGetUrl } from 'instagram-url-direct'; // You'll need to bundle this
//import { URLSearchParams } from 'url';  // Already built in

// Helper function to expand shortened Pinterest URLs
async function expandURL(shortenURL) {
  try {
    const response = await fetch(shortenURL, {
      method: 'HEAD',
      redirect: 'manual', // Prevent automatic redirection
    });

    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('location');
      return location;
    } else {
      console.warn(`Unexpected status code: ${response.status}`);
      return shortenURL; // Return the original if no redirect
    }
  } catch (error) {
    console.error('Error expanding URL:', error);
    return null; // Or handle the error as needed
  }
}

// Basic HTML template for the UI
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <title>Media Downloader</title>
  <style>
  body { font-family: sans-serif; }
  input[type="text"] { width: 80%; padding: 8px; margin-bottom: 10px; }
  button { padding: 8px 16px; cursor: pointer; }
  #result { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Media Downloader</h1>
  <label for="url">Enter URL:</label><br>
  <input type="text" id="url" name="url"><br>
  <button id="pinterestButton">Download from Pinterest</button>
  <button id="instagramButton">Download from Instagram</button>

  <div id="result"></div>

  <script>
    const pinterestButton = document.getElementById('pinterestButton');
    const instagramButton = document.getElementById('instagramButton');
    const resultDiv = document.getElementById('result');

    pinterestButton.addEventListener('click', async () => {
      const url = document.getElementById('url').value;
      const data = await fetchData('/pinterest?url=' + encodeURIComponent(url));
      displayResult(data);
    });

    instagramButton.addEventListener('click', async () => {
      const url = document.getElementById('url').value;
      const data = await fetchData('/instagram?url=' + encodeURIComponent(url));
      displayResult(data);
    });

    async function fetchData(endpoint) {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(\`HTTP error! Status: \${response.status}\`);
        }
        return await response.json();
      } catch (error) {
        console.error('Fetch error:', error);
        return { error: error.message };
      }
    }

    function displayResult(data) {
      if (data.error) {
        resultDiv.innerHTML = \`<p>Error: \${data.error}</p>\`;
      } else if (data.url) {
        let content = '';
        if (data.type === 'video') {
          content = \`<video width="400" controls><source src="\${data.url}" type="video/mp4">Your browser does not support HTML5 video.</video>\`;
        } else {
          content = \`<img src="\${data.url}" alt="Downloaded Image" width="400">\`;
        }

        let titleText = data.titleURL ? \`<p>Title: \${data.titleURL}</p>\` : '';
        let descText = data.decsURL ? \`<p>Description: \${data.decsURL}</p>\` : '';
        resultDiv.innerHTML = content + titleText + descText;

      } else {
        resultDiv.innerHTML = "<p>No result found.</p>";
      }
    }
  </script>
</body>
</html>
`;


export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === '/') {
      // Serve the HTML page
      return new Response(HTML_TEMPLATE, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (pathname === '/pinterest') {
      try {
        const pinterestUrl = url.searchParams.get('url');
        if (!pinterestUrl) {
          return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        let expandedUrl = pinterestUrl;
        if (pinterestUrl.includes('pin.it')) {
          expandedUrl = await expandURL(pinterestUrl);
          if (!expandedUrl) {
            return new Response(JSON.stringify({ error: 'Failed to expand Pinterest URL' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }

        const { hostname, pathname: pinterestPathname } = new URL(expandedUrl);
        const finalUrl = `https://${hostname}${pinterestPathname.replace('/sent/', '')}`;

        const response = await fetch(finalUrl);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const body = await response.text();
        let outUrl;
        let type = 'video';

        try {
          const video = new JSDOM(body).window.document.getElementsByTagName('video')[0].src;
          outUrl = video.replace('/hls/', '/720p/').replace('.m3u8', '.mp4');
        } catch (_) {
          const img = new JSDOM(body).window.document.getElementsByTagName('img')[0];
          outUrl = img ? img.src : null;
          type = 'image';
        }

        let title = '';
        try {
          const titleElement = new JSDOM(body).window.document.querySelector('div[data-test-id="pinTitle"] h1');
          title = titleElement ? titleElement.innerHTML : '';
        } catch (err) {
          console.error("Error extracting title:", err);
        }

        let desc = '';
        try {
          const descElement = new JSDOM(body).window.document.querySelector('div[data-test-id="truncated-description"] div div span');
          desc = descElement ? descElement.innerHTML : '';
        } catch (err) {
          console.warn("Description not found:", err);
        }
        console.log('Pinterest Download URL:', outUrl);
        return new Response(
          JSON.stringify({
            url: outUrl,
            title: pinterestUrl.includes('pin.it') ? 'Pinterest shorten url' : 'Pinterest full url',
            type: type,
            titleURL: title,
            decsURL: desc,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

      } catch (error) {
        console.error('Pinterest Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (pathname === '/instagram') {
      try {
        const instagramUrl = url.searchParams.get('url');
        if (!instagramUrl) {
          return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (instagramUrl.includes('instagram.com')) {
          const rsd = await instagramGetUrl(instagramUrl);
          const uri = rsd.url_list[0];

          return new Response(JSON.stringify({ url: uri, title: 'Instagram shorten url' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ error: 'Not a valid Instagram URL' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('Instagram Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Return a 404 for any other route
    return new Response('Not Found', { status: 404 });
  },
};
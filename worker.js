import { JSDOM } from 'jsdom'; // Import JSDOM
import { instagramGetUrl } from 'instagram-url-direct'; // Import instagram-url-direct

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  if (pathname === '/pinterest') {
    return pinterestHandler(searchParams);
  } else if (pathname === '/instagram') {
    return instagramHandler(searchParams);
  } else {
    // Default response:  Simple welcome message or instructions.
    return new Response(
      'Welcome to the Media Downloader API. Use /pinterest?url=... or /instagram?url=...',
      {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      }
    );
  }
}

async function pinterestHandler(searchParams) {
  const url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let finalUrl = url;
    if (url.match("pin.it")) {
      finalUrl = await expandURL(url);
      if (!finalUrl) {
        return new Response(JSON.stringify({ error: 'Failed to expand URL' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const { hostname, pathname } = new URL(finalUrl);
    const path = pathname.replace("/sent/", "");
    const pinterestURL = `https://${hostname}${path}`;

    const response = await fetch(pinterestURL);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const body = await response.text();
    let outUrl;
    let type = "video";

    try {
      const video = new JSDOM(body).window.document.getElementsByTagName(
          "video"
      )[0].src;
      outUrl = video.replace("/hls/", "/720p/").replace(".m3u8", ".mp4");
    } catch (_) {
      outUrl = new JSDOM(body).window.document.getElementsByTagName(
          "img"
      )[0].src;
      type = "image";
    }

    let title;
    try {
      title = new JSDOM(body).window.document.querySelector('div[data-test-id="pinTitle"] h1').innerHTML;
    } catch (_) {
      title = "No title found";
    }

    let desc;
    try {
      // Description may not be available
      desc = new JSDOM(body).window.document.querySelector('div[data-test-id="truncated-description"] div div span').innerHTML;
    } catch (_) {
      desc = "No description found";
    }

    console.log(outUrl);  // Log to Cloudflare Worker logs

    return new Response(
      JSON.stringify({
        url: outUrl,
        title: url.match("pin.it") ? "Pinterest shorten url" : "Pinterest full url",
        type: type,
        titleURL: title,
        decsURL: desc
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function instagramHandler(searchParams) {
  const url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (url.match("instagram.com")) {
      const rsd = await instagramGetUrl(url);

      const uri = rsd.url_list[0];

      return new Response(
        JSON.stringify({
          url: uri,
          title: "Instagram shorten url",
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(JSON.stringify({ error: "Not a valid url" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


async function expandURL(shortenURL) {
  const uri = new URL(shortenURL);
  const path = uri.pathname;
  const finalUrl = `https://api.pinterest.com/url_shortener${path}/redirect/`;
  try {
    let response = await fetch(finalUrl, {
      method: "HEAD",
      redirect: "manual",
    });
    let location = response.headers.get("location");
    return location;
  } catch (error) {
    console.error(error);
    return null;
  }
}
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

const BOT_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'; // Replace with your bot token (ideally, use a Cloudflare Secret)
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function handleRequest(event) {
  try {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method === 'POST') {
      const update = await request.json();
      if (update.message && update.message.text) {
        return await handleMessage(update.message);
      }
    }
    return new Response('OK', { status: 200 }); // Respond to webhook pings
  } catch (error) {
    console.error('Error:', error); // Log the error to Cloudflare Workers logs
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;

  if (text.startsWith('/gate')) {
    return await handleGateCommand(chatId, text);
  } else {
    // Handle other commands or default message
    return await sendMessage(chatId, 'I only know the /gate command right now.');
  }
}

async function handleGateCommand(chatId, text) {
  const domain = extractDomain(text); // Implement extractDomain function (see below)

  if (!domain) {
    return await sendMessage(chatId, 'Please provide a domain. Example: /gate example.com');
  }

  const startTime = performance.now(); // Start timer

  const securityInfo = await getSecurityInfo(domain); // Implement getSecurityInfo function (see below)

  const endTime = performance.now(); // End timer
  const timeTaken = (endTime - startTime).toFixed(3);

  const messageText = `
┏━━━━『 𝓖𝓪𝓽𝓮𝔀𝓪𝔂 𝓡𝓮𝓼𝓾𝓵𝓽𝓼 』━━━━┓

🔍 𝗗𝗼𝗺𝗮𝗶𝗻: ${domain}
💳 𝗚𝗮𝘁𝗲𝘄𝗮𝘆𝘀:  (Not Implemented Yet)

🛡️ 𝗦𝗲𝗰𝘂𝗿𝗶𝘁𝘆:
   ├─ 𝗖𝗮𝗽𝘁𝗰𝗵𝗮: ${securityInfo.captcha ? '✅' : '⛔'}
   └─ 𝗖𝗹𝗼𝘂𝗱𝗳𝗹𝗮𝗿𝗲: ${securityInfo.cloudflare ? '✅' : '⛔'}

⏱️ 𝗧𝗶𝗺𝗲: ${timeTaken}s

┗━━━━『 @${'YOUR_BOT_USERNAME'} 』━━━━`;  // Replace with your bot username

  return await sendMessage(chatId, messageText);
}

// Helper function to extract the domain from the command
function extractDomain(text) {
  const parts = text.split(' ');
  if (parts.length > 1) {
    return parts[1].trim();
  }
  return null;
}

// Helper function to get security information (simulated for now)
async function getSecurityInfo(domain) {
  // In a real implementation, you would use APIs or libraries to check for
  // Captcha and Cloudflare presence.  This is just a placeholder.

  // Simulate checking for Cloudflare and Captcha using random values.
  const cloudflare = Math.random() < 0.5;
  const captcha = Math.random() < 0.5;

  return {
    cloudflare: cloudflare,
    captcha: captcha,
  };
}


async function sendMessage(chatId, text) {
  const url = `${API_URL}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown', // Enable Markdown for formatting
    }),
  });

  if (!response.ok) {
    console.error('Error sending message:', response.status, await response.text());
  }

  return new Response('OK', { status: 200 });
}

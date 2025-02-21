import { URLSearchParams } from 'url';
import fetch from 'node-fetch'; // Or use the built-in 'fetch' if you prefer.
import _ from 'lodash';

const BOT_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'; // Replace with your actual token
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const update = await request.json();
            if (update.message) {
                await handleMessage(update.message);
            }
        } catch (error) {
            console.error('Error processing update:', error);
            return new Response('Error processing update', { status: 500 });
        }
    } else {
        return new Response(
            'This is a Telegram bot worker. Send POST requests with Telegram updates.',
            { status: 200 }
        );
    }
    return new Response('OK', { status: 200 });
}

async function handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text;

    if (text && text.startsWith('/gate')) {
        const domain = text.substring(5).trim(); // Extract domain after /gate
        if (!domain) {
            await sendMessage(chatId, 'Please provide a domain after /gate (e.g., /gate example.com)');
            return;
        }

        await processGateCommand(chatId, domain);
    } else if (text === '/start') {
        await sendMessage(chatId, 'Welcome! Use /gate <domain> to check gateway information.');
    } else {
        // You can add more commands here
        // await sendMessage(chatId, 'Unknown command. Try /gate <domain>.');
    }
}

async function processGateCommand(chatId, domain) {
    try {
        const startTime = Date.now();

        // Basic domain validation (you can add more robust validation)
        if (!isValidDomain(domain)) {
            await sendMessage(chatId, 'Invalid domain format.');
            return;
        }

        // 1. Fetch website (This is where you'd check for Captcha/Cloudflare)
        let response;
        try {
            response = await fetch(`https://${domain}`, {
                redirect: 'manual', // prevent redirect so we can check response status first
            });
        } catch (fetchError) {
            console.error("Fetch error: ", fetchError);
            await sendMessage(chatId, `Error fetching ${domain}: ${fetchError.message}`);
            return;
        }

        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000; // in seconds

        // 2. Analyze Response
        const isCloudflare = response.headers.get('server')?.includes('cloudflare');
        const hasCaptcha = response.status === 503 && response.headers.get('server')?.includes('cloudflare'); // Example check, adjust as needed

        // 3. Collect Gateway Info (This is where you might query databases, APIs, etc.)
        const gateways = await getGatewaysForDomain(domain); // Implement this function

        // 4. Build the Response Message
        let message = `┏━━━━『 𝓖𝓪𝓽𝓮𝔀𝓪𝔂 𝓡𝓮𝓼𝓾𝓵𝓽𝓼 』━━━━┓\n\n`;
        message += `🔍 𝗗𝗼𝗺𝗮𝗶𝗻: ${domain}\n`;
        message += `💳 𝗚𝗮𝘁𝗲𝘄𝗮𝘆𝘀: ${gateways.length > 0 ? gateways.join(', ') : 'N/A'}\n\n`;
        message += `🛡️ 𝗦𝗲𝗰𝘂𝗿𝗶𝘁𝘆:\n`;
        message += `   ├─ 𝗖𝗮𝗽𝘁𝗰𝗵𝗮: ${hasCaptcha ? '⛔' : '✅'}\n`;
        message += `   └─ 𝗖𝗹𝗼𝘂𝗱𝗳𝗹𝗮𝗿𝗲: ${isCloudflare ? '✅' : '⛔'}\n\n`;
        message += `⏱️ 𝗧𝗶𝗺𝗲: ${timeTaken.toFixed(2)}s\n`;
        message += `┗━━━━『 @YourBotUsername 』━━━━`;  // Replace YourBotUsername

        await sendMessage(chatId, message);

    } catch (error) {
        console.error('Error processing /gate command:', error);
        await sendMessage(chatId, `Error processing command: ${error.message}`);
    }
}

async function getGatewaysForDomain(domain) {
    // **IMPORTANT:** Replace this with your actual gateway data retrieval logic.
    // This could involve querying a database, an API, or a static list.
    // For example, if you had a simple mapping:
    const gatewayMap = {
        'example.com': ['Stripe', 'PayPal'],
        'cloudflare.com': ['Cloudflare Gateway'],
    };

    return gatewayMap[domain] || []; // Returns an array of gateways or an empty array if not found.
}

async function sendMessage(chatId, text) {
    const params = new URLSearchParams();
    params.append('chat_id', chatId);
    params.append('text', text);
    params.append('parse_mode', 'Markdown'); // Optional: Enable Markdown formatting

    try {
        const response = await fetch(`${API_URL}/sendMessage`, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (!response.ok) {
            console.error('Error sending message:', response.status, response.statusText);
            const errorBody = await response.text(); // Get the error message from Telegram
            console.error('Error body:', errorBody);
            throw new Error(`Telegram API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const json = await response.json();
        if (!json.ok) {
            console.error('Telegram API error (JSON):', json);
            throw new Error(`Telegram API error (JSON): ${JSON.stringify(json)}`);
        }

        return json;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error; // Re-throw the error to be handled by the caller.
    }
}

function isValidDomain(domain) {
    // Basic domain validation using a regular expression.
    //  You can use more strict validation if required.
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
    return domainRegex.test(domain);
}

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request);
    },
};

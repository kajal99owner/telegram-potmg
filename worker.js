// Environment Variables (Configure in Cloudflare Worker Settings)
const TELEGRAM_BOT_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'; // Replace with your bot token
const BINLIST_API_URL = "https://lookup.binlist.net/"; // Replace with the API URL (if needed)

async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const update = await request.json();
            if (update.message) {
                await handleMessage(update.message);
            }
        } catch (error) {
            console.error('Error processing request:', error);
            return new Response('Error', { status: 500 });
        }
    } else if (request.method === 'GET') {
        //Basic health check
        return new Response('OK', { status: 200 });
    }
    return new Response('OK', { status: 200 });
}

async function handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text;

    if (text) {
        if (text.startsWith('/start')) {
            await sendMessage(chatId, "Welcome to the bot! Use /help to see available commands.");
        }
        else if (text.startsWith('/help')) {
            await sendMessage(chatId, "Available commands:\n/gen - Generate card numbers.\n/chk - Check a card.\n/bin - Get BIN info.");
        }
        else if (text.startsWith('/gen')) {
            await handleGenCommand(chatId, text);
        } else if (text.startsWith('/chk')) {
            await handleChkCommand(chatId, text);
        } else if (text.startsWith('/bin')) {
            await handleBinCommand(chatId, text);
        } else {
            await sendMessage(chatId, "Invalid command. Use /help to see available commands.");
        }
    }
}

// GEN Command
async function handleGenCommand(chatId, text) {
    // Expected input: /gen\nBIN ⇾ 123456\nAmount ⇾ 10
    const lines = text.split('\n');
    if (lines.length < 3) {
        return sendMessage(chatId, "Invalid format. Use:\n/gen\nBIN ⇾ [BIN]\nAmount ⇾ [Amount]");
    }

    const binLine = lines[1].trim();
    const amountLine = lines[2].trim();

    if (!binLine.startsWith('BIN ⇾') || !amountLine.startsWith('Amount ⇾')) {
        return sendMessage(chatId, "Invalid format. Use:\n/gen\nBIN ⇾ [BIN]\nAmount ⇾ [Amount]");
    }

    const bin = binLine.substring(5).trim();
    const amount = parseInt(amountLine.substring(8).trim());

    if (!bin || isNaN(amount) || amount <= 0) {
        return sendMessage(chatId, "Invalid BIN or Amount.");
    }

    await sendMessage(chatId, "⏳ Processing your request..."); // Added processing message

    // Generate card numbers (PLACEHOLDER - IMPLEMENT CARD GENERATION LOGIC)
    const generatedCards = generateCards(bin, amount);

    if (generatedCards.length > 0) {
        let responseText = "Generated Cards:\n";
        generatedCards.forEach(card => {
            responseText += card + "\n"; //This will output the generated cards
        });

        await sendMessage(chatId, responseText);
    } else {
        await sendMessage(chatId, "Failed to generate cards.");
    }
}

// CHK Command
async function handleChkCommand(chatId, text) {
    // Expected input: /chk\nCard: 1234567890123456
    const lines = text.split('\n');
    if (lines.length < 2) {
        return sendMessage(chatId, "Invalid format. Use:\n/chk\nCard: [Card Number]");
    }

    const cardLine = lines[1].trim();

    if (!cardLine.startsWith('Card:')) {
        return sendMessage(chatId, "Invalid format. Use:\n/chk\nCard: [Card Number]");
    }

    const cardNumber = cardLine.substring(5).trim();

    if (!cardNumber) {
        return sendMessage(chatId, "Invalid Card Number.");
    }

    await sendMessage(chatId, "⏳ Processing your request..."); // Added processing message

    // Card Checking Logic (PLACEHOLDER - IMPLEMENT CARD CHECKING LOGIC)
    const checkResult = await checkCard(cardNumber);

    let responseText = "";

    if (checkResult.approved) {
        responseText += "𝗔𝗽𝗽𝗿𝗼𝘃𝗲𝗱 ✅\n\n";
    } else {
        responseText += "𝗗𝗲𝗰𝗹𝗶𝗻𝗲𝗱 ❌\n\n";
    }

    responseText += `𝗖𝗮𝗿𝗱: ${cardNumber}\n`;
    responseText += `𝐆𝐚𝐭𝐞𝐰𝐚𝐲: ${checkResult.gateway || 'N/A'}\n`;
    responseText += `𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞: ${checkResult.response || 'N/A'}\n\n`;
    responseText += `𝗜𝗻𝗳𝗼: ${checkResult.info || 'N/A'} - ${checkResult.cvv || 'N/A'} - ${checkResult.expiry || 'N/A'}\n`;
    responseText += `𝐈𝐬𝐬𝐮𝐞𝐫: ${checkResult.issuer || 'N/A'}\n`;
    responseText += `𝐂𝐨𝐮𝐧𝐭𝐫𝐲: ${checkResult.country || 'N/A'}\n\n`;
    responseText += `𝗧𝗶𝗺𝗲: ${checkResult.time || 'N/A'} seconds`;

    await sendMessage(chatId, responseText);
}

// BIN Command
async function handleBinCommand(chatId, text) {
    const bin = text.substring(4).trim();  // Removes "/bin" from the message

    if (!bin) {
        return sendMessage(chatId, "Please provide a BIN. Example: /bin 123456");
    }

    await sendMessage(chatId, "⏳ Processing your request...");

    const binInfo = await getBinInfo(bin);

    if (binInfo) {
        let responseText = "𝐕𝐚𝐥𝐢𝐝 𝐁𝐈𝐍 ✅\n\n";
        responseText += `𝐁𝐈𝐍 ➜ ${bin}\n\n`;
        responseText += `𝐁𝐈𝐍 𝐈𝐧𝐟𝐨 ➜ ${binInfo.scheme || 'N/A'} ${binInfo.type || 'N/A'}\n`;
        responseText += `𝐁𝐚𝐧𝐤 ➜ ${binInfo.bank?.name || 'N/A'}\n`;  // Use optional chaining
        responseText += `𝐂𝐨𝐮𝐧𝐭𝐫𝐲 ➜ ${binInfo.country?.name || 'N/A'} (${binInfo.country?.alpha2 || 'N/A'})\n`; // Use optional chaining

        await sendMessage(chatId, responseText);
    } else {
        await sendMessage(chatId, "Invalid BIN or could not retrieve information.");
    }
}

// Card Generation Placeholder
function generateCards(bin, amount) {
    // IMPORTANT:  Replace this with your actual card generation logic.
    // This is a placeholder and does not generate valid card numbers.
    const generated = [];
    for (let i = 0; i < amount; i++) {
        generated.push(bin + "XXXXXXX"); //In reality, you would need to generate the full number and check it.
    }
    return generated;
}

// Card Checking Placeholder
async function checkCard(cardNumber) {
    // IMPORTANT:  Replace this with your actual card checking logic using a third-party API.
    // This is a placeholder and does not perform real card checks.

    //Simulated response
    const random = Math.random();
    const approved = random > 0.5;
    const timeTaken = Math.random() * 2;

    return {
        approved: approved,
        gateway: "ExampleGateway",
        response: approved ? "Approved" : "Declined",
        info: "Example Info",
        issuer: "ExampleBank",
        country: "USA",
        time: timeTaken.toFixed(2)
    };
}

// BIN Lookup Function
async function getBinInfo(bin) {
    try {
        const response = await fetch(`${BINLIST_API_URL}${bin}`, {
            headers: {
                'Accept-Version': '3'
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('BIN lookup failed:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error fetching BIN info:', error);
        return null;
    }
}

// Function to send messages to Telegram
async function sendMessage(chatId, text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: text
        })
    });

    if (!response.ok) {
        console.error('Error sending message:', response.status, response.statusText);
    }
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

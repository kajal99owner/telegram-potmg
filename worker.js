// --- Configuration ---
const BOT_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'; // Replace with your bot token
const BINLIST_API_URL = 'https://lookup.binlist.net/';

// --- Utility Functions ---

// Luhn Algorithm Check
function isValidLuhn(cardNumber) {
    let sum = 0;
    let alt = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let n = parseInt(cardNumber.substring(i, i + 1));
        if (alt) {
            n *= 2;
            if (n > 9) {
                n = (n % 10) + 1;
            }
        }
        sum += n;
        alt = !alt;
    }
    return (sum % 10) == 0;
}

// Generate a single card number
function generateCard(bin, length = 16) {
    let cardNumber = bin;
    // Generate random digits until length - 1
    while (cardNumber.length < length - 1) {
        cardNumber += Math.floor(Math.random() * 10);
    }

    // Calculate the check digit
    let checkDigit = 0;
    let sum = 0;
    let alt = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let n = parseInt(cardNumber.substring(i, i + 1));
        if (alt) {
            n *= 2;
            if (n > 9) {
                n = (n % 10) + 1;
            }
        }
        sum += n;
        alt = !alt;
    }
    checkDigit = (10 - (sum % 10)) % 10;

    cardNumber += checkDigit;
    return cardNumber;
}

// Format date (MM/YY)
function generateExpiryDate() {
    const year = new Date().getFullYear() + Math.floor(Math.random() * 5) + 1; // +1 to +5 years
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return `${month}/${year.toString().slice(-2)}`;
}

// Generate CVV
function generateCVV() {
    return String(Math.floor(Math.random() * 900) + 100); // 3-digit CVV
}

// --- Command Handlers ---

async function handleGen(message) {
    const parts = message.text.split(' ');
    if (parts.length < 3) {
        return 'Usage: /gen BIN Amount';
    }

    const bin = parts[1];
    const amount = parseInt(parts[2]);

    if (isNaN(amount) || amount <= 0) {
        return 'Invalid amount.';
    }
      if (amount > 100) {
    return 'You can only generate a maximum of 100 cards at once.';
    }

    if (!/^\d{6,8}$/.test(bin)) { //Basic BIN validation
        return 'Invalid BIN format.  Must be 6-8 digits.';
    }
    let cards = '';
    for (let i = 0; i < amount; i++) {
        const cardNumber = generateCard(bin);
        const expiryDate = generateExpiryDate();
        const cvv = generateCVV();
      const cardinfo = `
${cardNumber}|${expiryDate}|${cvv}
`
        cards += cardinfo;
    }

    const response = `
𝗕𝗜𝗡 ⇾ ${bin}
𝗔𝗺𝗼𝘂𝗻𝘁 ⇾ ${amount}

${cards}

| | |

𝗜𝗻𝗳𝗼:  -  - 
𝐈𝐬𝐬𝐮𝐞𝐫: 
𝗖𝗼𝘂𝗻𝘁𝗿𝘆: 
    `;
    return response;
}


async function handleChk(message) {
    const card = message.text.split(' ')[1];

    if (!card) {
        return 'Usage: /chk [card number]';
    }
    if (!/^\d{13,19}$/.test(card)) { // Basic card number validation
        return 'Invalid card number format.';
    }

   // Placeholder for a *REAL* card checker (DO NOT IMPLEMENT ILLEGAL CHECKERS)
    const isValid = isValidLuhn(card); // Replace with a call to a *legitimate* payment gateway simulator
    const startTime = Date.now();
     await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network latency
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000; // in seconds


    const response = isValid
        ? `𝐀𝐩𝐩𝐫𝐨𝐯𝐞𝐝 ✅\n\n` +
          `𝗖𝗮𝗿𝗱: ${card}\n` +
          `𝐆𝐚𝐭𝐞𝐰𝐚𝐲:  Simulator\n`+
          `𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞:  Approved (Simulated)\n\n` +
          `𝗜𝗻𝗳𝗼:  -  -\n` +
          `𝐈𝐬𝐬𝐮𝐞𝐫: \n` +
          `𝐂𝐨𝐮𝐧𝐭𝐫𝐲: \n\n` +
          `𝗧𝗶𝗺𝗲: ${timeTaken.toFixed(2)} 𝐬𝐞𝐜𝐨𝐧𝐝𝐬`
        : `𝐃𝐞𝐜𝐥𝐢𝐧𝐞𝐝 ❌\n\n` +
          `𝗖𝗮𝗿𝗱: ${card}\n` +
           `𝐆𝐚𝐭𝐞𝐰𝐚𝐲:  Simulator\n`+
          `𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞:  Declined (Simulated)\n\n` +
          `𝗜𝗻𝗳𝗼:  -  -\n` +
          `𝐈𝐬𝐬𝐮𝐞𝐫: \n` +
          `𝐂𝐨𝐮𝐧𝐭𝐫𝐲:  \n\n` +
          `𝗧𝗶𝗺𝗲: ${timeTaken.toFixed(2)} 𝐬𝐞𝐜𝐨𝐧𝐝𝐬`;

    return response;
}


async function handleBin(message) {
    const bin = message.text.split(' ')[1];

    if (!bin) {
        return 'Usage: /bin [BIN]';
    }

    try {
        const response = await fetch(`${BINLIST_API_URL}${bin}`, {
            headers: { 'Accept-Version': '3' },
        });

        if (!response.ok) {
            if (response.status === 404) {
              return `Invalid BIN ❌\n\nBIN ➜ ${bin}\n\nBIN Info ➜ Not Found`;
            } else {
               return `Error fetching BIN info: ${response.status}`;
            }

        }

        const data = await response.json();
        const bankName = data.bank ? (data.bank.name || 'N/A') : 'N/A';

        const binInfoResponse = `𝐕𝐚𝐥𝐢𝐝 𝐁𝐈𝐍 ✅\n\n` +
            `𝐁𝐈𝐍 ➜ ${bin}\n\n` +
            `𝐁𝐈𝐍 𝐈𝐧𝐟𝐨 ➜ ${data.scheme || 'N/A'} ${data.type || 'N/A'} ${data.brand || 'N/A'}\n` +
            `𝐁𝐚𝐧𝐤 ➜ ${bankName}\n` +
            `𝐂𝐨𝐮𝐧𝐭𝐫𝐲 ➜ ${data.country ? (data.country.name || 'N/A') : 'N/A'} ${data.country ? (data.country.emoji || '') : ''}`;

        return binInfoResponse;

    } catch (error) {
        console.error('Error in /bin:', error);
        return 'An error occurred while fetching BIN info.';
    }
}


// --- Main Request Handler ---

async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const update = await request.json();

            if (update.message && update.message.text) {
                const message = update.message;
                const chatId = message.chat.id;
                let responseText = '';

                if (message.text.startsWith('/gen')) {
                    responseText = await handleGen(message);
                } else if (message.text.startsWith('/chk')) {
                    responseText = await handleChk(message);
                } else if (message.text.startsWith('/bin')) {
                    responseText = await handleBin(message);
                } else if (message.text.startsWith('/start')) {
                    responseText = 'Welcome! Use /gen, /chk, or /bin commands.';
                }
                else {
                    responseText = 'Invalid command.';
                }

                // Send the response
                const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: responseText,
                        parse_mode: 'Markdown', // Or 'HTML' if you prefer
                    }),
                });

                return new Response('OK', { status: 200 });
            }
        } catch (error) {
            console.error('Error processing request:', error);
            return new Response('Error', { status: 500 });
        }
    }

    return new Response('Hello, this is your Telegram bot!', { status: 200 });
}


// --- Event Listener ---
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

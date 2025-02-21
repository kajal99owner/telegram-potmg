// --- Configuration ---
const BOT_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'; // Replace with your bot token
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// --- Helper Functions ---

/**
 * Sends a message to Telegram.
 *
 * @param {number} chatId The chat ID to send the message to.
 * @param {string} text The text of the message.
 * @param {object} [options] Optional parameters (e.g., parse_mode, reply_markup).
 * @returns {Promise<Response>} The fetch response.
 */
async function sendMessage(chatId, text, options = {}) {
  const body = JSON.stringify({
    chat_id: chatId,
    text: text,
    ...options,
  });

  return fetch(`${API_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body,
  });
}


/**
 * Generates a random Luhn-valid credit card number.
 *
 * @param {string} bin The Bank Identification Number (first 6 digits).
 * @param {number} length The total length of the card number (usually 16).
 * @returns {string} The generated card number.
 */
function generateCardNumber(bin, length = 16) {
    if (bin.length > length -1) {
        return "BIN too long. BIN length + generated digits must be equal to or less than requested length."
    }

  let cardNumber = bin;
  const remainingDigits = length - bin.length - 1; // -1 for checksum digit

  // Generate random digits
  for (let i = 0; i < remainingDigits; i++) {
    cardNumber += Math.floor(Math.random() * 10).toString();
  }

  // Calculate Luhn checksum digit
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
  const checksumDigit = (10 - (sum % 10)) % 10;
  cardNumber += checksumDigit.toString();

  return cardNumber;
}

/**
 * Generates multiple card numbers.
 *
 * @param {string} bin The BIN.
 * @param {number} count The number of cards to generate.
 * @param {number} length
 * @returns {string[]} An array of generated card numbers.
 */
function generateMultipleCards(bin, count, length = 16) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    cards.push(generateCardNumber(bin, length));
  }
  return cards;
}

/**
 * Formats the card generation output.
 *
 * @param {string[]} cards An array of card numbers.
 * @returns {string} The formatted output string.
 */
function formatCardOutput(cards) {
  return cards.join('\n'); // Simple newline separation.  Improved below.
}

// --- Command Handlers ---

/**
 * Handles the /start command.
 */
async function handleStart(chatId) {
  const welcomeMessage = `
Welcome to the Card Generator Bot!

Use the /gen command to generate credit card numbers.  
Example: /gen 414747 10  (generates 10 cards with BIN 414747)
Example: /gen 510510 5 15 (generates 5 cards with BIN 510510 with length of 15)
`;
  await sendMessage(chatId, welcomeMessage);
}


/**
 * Handles the /gen command.
 *
 * @param {number} chatId The chat ID.
 * @param {string} text The message text (including the command).
 */
async function handleGen(chatId, text) {
    const parts = text.split(/\s+/); // Split by spaces

    if (parts.length < 2) {
        await sendMessage(chatId, "Invalid command. Usage: /gen <BIN> <count> [length]");
        return;
    }

    const bin = parts[1];

    if (!/^\d+$/.test(bin)) { //Basic check if bin contain only digits
      await sendMessage(chatId, "BIN must contain only digits.");
      return;
    }

    const count = parseInt(parts[2] || '1');
    const length = parseInt(parts[3] || '16');

    if (isNaN(count) || count <= 0) {
        await sendMessage(chatId, "Invalid count. Please provide a positive number.");
        return;
    }
    if (isNaN(length) || length <= 0) {
        await sendMessage(chatId, "Invalid length. Please provide a positive number.");
        return;
    }

    if (count > 100) { // Limit the number of cards to generate at once
        await sendMessage(chatId, "You can generate a maximum of 100 cards at a time.");
        return;
    }


    const cards = generateMultipleCards(bin, count, length);
    const formattedOutput = formatCardOutput(cards);

    // Improved formatting for the output:
    let responseText = `
<b>Card Generator Results</b>

<b>BIN:</b> <code>${bin}</code>
<b>Count:</b> <code>${count}</code>
<b>Length:</b> <code>${length}</code>

<b>Generated Cards:</b>
<pre>${formattedOutput}</pre>
`;


    await sendMessage(chatId, responseText, { parse_mode: 'HTML' }); // Use HTML for bold and code
}


// --- Main Request Handler ---

async function handleRequest(request) {
  if (request.method === 'POST') {
    try {
      const update = await request.json();

      if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        if (text.startsWith('/start')) {
          await handleStart(chatId);
        } else if (text.startsWith('/gen')) {
          await handleGen(chatId, text);
        } else {
            await sendMessage(chatId, "Unknown command. Use /start to see available commands.");
        }
      }

      return new Response('OK', { status: 200 }); // Acknowledge the request
    } catch (error) {
      console.error('Error processing request:', error);
      return new Response('Error', { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 }); // Handle non-POST requests
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

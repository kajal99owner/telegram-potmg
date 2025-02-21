// cloudflare-worker.js
const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const MAILTM_API = 'https://api.mail.tm';
const KV_NAMESPACE = 'mailtm_bot_kv'; // Create in Cloudflare KV

async function handleRequest(request) {
    const url = new URL(request.url);
    if (url.pathname === `/${TELEGRAM_TOKEN}` && request.method === 'POST') {
        return handleTelegramUpdate(await request.json());
    }
    return new Response('Not Found', { status: 404 });
}

async function handleTelegramUpdate(update) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    
    // Command router
    if (text.startsWith('/start')) {
        return sendMessage(chatId, `📧 Welcome to TempMail Bot!\n\nAvailable commands:\n/create - Generate new email\n/inbox - Check messages\n/read [id] - Read message\n/help - Show help`);
    }
    
    if (text.startsWith('/create')) {
        return createAccount(chatId);
    }
    
    if (text.startsWith('/inbox')) {
        return getInbox(chatId);
    }
    
    if (text.startsWith('/read')) {
        const messageId = text.split(' ')[1];
        return getMessage(chatId, messageId);
    }
    
    if (text.startsWith('/help')) {
        return sendMessage(chatId, `🛠 Commands:\n\n/create - Create new temporary email\n/inbox - List recent messages\n/read [id] - Show message content\n/help - Show this help`);
    }
    
    return sendMessage(chatId, '❌ Unknown command. Use /help for available commands');
}

// Mail.tm API Operations
async function createAccount(chatId) {
    try {
        // Get available domains
        const domains = await fetch(`${MAILTM_API}/domains`).then(r => r.json());
        const domain = domains['hydra:member'][0].domain;
        
        // Generate credentials
        const username = Math.random().toString(36).substring(2, 12) + domain;
        const password = Math.random().toString(36).substring(2, 16);
        
        // Create account
        const account = await fetch(`${MAILTM_API}/accounts`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ address: username, password })
        });
        
        if (!account.ok) throw new Error('Account creation failed');
        
        // Get token
        const token = await fetch(`${MAILTM_API}/token`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ address: username, password })
        }).then(r => r.json());
        
        // Store in KV
        await KV_NAMESPACE.put(chatId, JSON.stringify({
            email: username,
            password,
            token: token.token
        }));
        
        return sendMessage(chatId, `✅ New email created:\n📧 ${username}\n🔑 ${password}\n\nAccount will expire after 10 minutes of inactivity.`);
    } catch (e) {
        return sendMessage(chatId, `❌ Error creating account: ${e.message}`);
    }
}

async function getInbox(chatId) {
    try {
        const userData = JSON.parse(await KV_NAMESPACE.get(chatId));
        if (!userData) return sendMessage(chatId, '❌ No active session. Use /create first');
        
        const messages = await fetch(`${MAILTM_API}/messages`, {
            headers: { Authorization: `Bearer ${userData.token}` }
        }).then(r => r.json());
        
        let response = `📥 Inbox (${messages['hydra:totalItems']} messages):\n\n`;
        messages['hydra:member'].forEach(msg => {
            response += `🔸 ${msg.subject}\nFrom: ${msg.from.address}\nID: ${msg.id}\n\n`;
        });
        
        return sendMessage(chatId, response || 'No messages found');
    } catch (e) {
        return sendMessage(chatId, `❌ Error fetching inbox: ${e.message}`);
    }
}

async function getMessage(chatId, messageId) {
    if (!messageId) return sendMessage(chatId, '❌ Please provide message ID (e.g., /read 123)');
    
    try {
        const userData = JSON.parse(await KV_NAMESPACE.get(chatId));
        if (!userData) return sendMessage(chatId, '❌ No active session');
        
        const message = await fetch(`${MAILTM_API}/messages/${messageId}`, {
            headers: { Authorization: `Bearer ${userData.token}` }
        }).then(r => r.json());
        
        const response = `📨 Message:\n\nSubject: ${message.subject}\nFrom: ${message.from.address}\n\n${message.text}`;
        return sendMessage(chatId, response.slice(0, 4096)); // Telegram message limit
    } catch (e) {
        return sendMessage(chatId, `❌ Error fetching message: ${e.message}`);
    }
}

// Telegram API Helper
async function sendMessage(chatId, text) {
    return fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'Markdown'
        })
    });
}

// Cloudflare Worker setup
export default {
    async fetch(request, env) {
        KV_NAMESPACE = env.MAILTM_BOT_KV; // Bind KV namespace
        return handleRequest(request);
    }
};
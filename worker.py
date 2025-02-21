from js import Response
import json
import time
import asyncio
from pyodide.ffi import create_proxy

BOT_TOKEN = "7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM"
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

async def send_request(method, data):
    return await fetch(f"{TELEGRAM_API}/{method}", {
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(data)
    })

async def handle_start_command(chat_id, user):
    welcome_text = f"""👋 Hello {user['first_name']}!
    
📁 I'm a file renaming bot with:
- Custom thumbnail support
- Video ⇄ File conversion
- Advanced renaming features

📚 Use /help for commands guide"""
    
    buttons = {
        "inline_keyboard": [
            [
                {"text": "📢 Channel", "url": "https://t.me/YourChannel"},
                {"text": "💬 Support", "url": "https://t.me/YourSupport"}
            ],
            [
                {"text": "🆘 Help", "callback_data": "help"},
                {"text": "📈 Status", "callback_data": "status"}
            ]
        ]
    }
    
    await send_request("sendMessage", {
        "chat_id": chat_id,
        "text": welcome_text,
        "parse_mode": "HTML",
        "reply_markup": buttons
    })

async def handle_ping(chat_id):
    start = time.time()
    msg = await (await send_request("sendMessage", {
        "chat_id": chat_id,
        "text": "🏓 Pinging..."
    })).json()
    
    latency = (time.time() - start) * 1000
    await send_request("editMessageText", {
        "chat_id": chat_id,
        "message_id": msg["result"]["message_id"],
        "text": f"⏱️ Bot Latency: {latency:.2f}ms"
    })

async def handle_update(update):
    if "message" in update:
        message = update["message"]
        command = message.get("text", "").split()[0].lower()
        chat_id = message["chat"]["id"]
        
        if command == "/start":
            await handle_start_command(chat_id, message["from"])
        elif command == "/ping":
            await handle_ping(chat_id)
    
    return Response.new("OK")

async def on_fetch(request):
    if request.method == "POST":
        update = await request.json()
        return await handle_update(update)
    return Response.new("Bot Online - Send /start to begin")

def add_event_listener():
    from pyodide.ffi import create_proxy
    self.addEventListener("fetch", create_proxy(on_fetch))

add_event_listener()

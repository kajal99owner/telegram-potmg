import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { MongoDBAdapter } from "@grammyjs/storage-mongodb";
import { MongoClient } from "mongodb";

// Initialize MongoDB connection
const client = new MongoClient(environment.DATABASE_URL);
const db = client.db();
const users = db.collection("users");

// Create bot instance
const bot = new Bot(environment.TELEGRAM_BOT_TOKEN);

// Handle /start command
bot.command("start", async (ctx) => {
  const buttons = new InlineKeyboard()
    .url("👨‍💻 Developer", "tg://openmessage?user_id=6449612223")
    .row()
    .url("🔊 Updates", "https://t.me/addlist/P9nJIi98NfY3OGNk")
    .row()
    .text("✅", "/join");

  await ctx.replyWithPhoto("https://t.me/kajal_developer/9", {
    caption: "⭐️ To Usᴇ Tʜɪs Bᴏᴛ Yᴏᴜ Nᴇᴇᴅ Tᴏ Jᴏɪɴ Aʟʟ Cʜᴀɴɴᴇʟs -",
    reply_markup: buttons,
    parse_mode: "Markdown",
  });
});

// Handle /join callback
bot.callbackQuery("/join", async (ctx) => {
  await ctx.deleteMessage();
  const userId = ctx.from.id;
  
  // Check if user is banned
  const user = await users.findOne({ _id: userId });
  if (user?.status === "ban") {
    return ctx.reply("You're Ban From Using The Bot ❌");
  }

  // Check channel membership
  const member = await ctx.api.getChatMember("@kajal_developer", userId);
  if (["member", "administrator", "creator"].includes(member.status)) {
    await users.updateOne(
      { _id: userId },
      { $set: { group: "user" } },
      { upsert: true }
    );
    return ctx.reply("🤗 Welcome to Lx Bot 🌺", {
      reply_markup: new Keyboard()
        .text("🌺 CP").text("🇮🇳 Desi").row()
        .text("🇬🇧 Forener").text("🐕‍🦺 Animal").row()
        .text("💕 Webseries").text("💑 Gay Cp").row()
        .text("💸 𝘽𝙐𝙔 𝙑𝙄𝙋 💸")
        .resized()
    });
  }

  return ctx.reply("❌ Must join all channel\n@kajal_developer");
});

// Handle ban check middleware
bot.use(async (ctx, next) => {
  const user = await users.findOne({ _id: ctx.from.id });
  if (user?.status === "ban") {
    return ctx.reply("You're Ban From Using The Bot ❌");
  }
  return next();
});

// Handle other commands
bot.command("vmenu", (ctx) => ctx.reply("Main menu text..."));

// Start the bot
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === "POST") {
    const update = await request.json();
    await bot.handleUpdate(update);
    return new Response("OK");
  }
  return new Response("Method not allowed", { status: 405 });
}

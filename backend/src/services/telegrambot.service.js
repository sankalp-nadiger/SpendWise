import TelegramBot from "node-telegram-bot-api";
import Transaction from "../models/transaction.js"; 
import { categorizeExpense } from "../utils/categorization.js"; 

const TOKEN = process.env.TELEGRAM_BOT_API_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase();

  if (text === "/start") {
    bot.sendMessage(chatId, "Welcome! Send a message like: 'Spent ₹500 on food' to log expenses.");
    return;
  }

  const { amount, category } = categorizeExpense(text);

  if (!amount) {
    bot.sendMessage(chatId, "Couldn't detect amount. Try: 'Spent ₹500 on groceries'");
    return;
  }

  try {
    const transaction = new Transaction({
      type: "expense",
      amount,
      category,
      user: chatId, 
      createdBy: chatId,
    });
    await transaction.save();

    bot.sendMessage(chatId, `✅ Added: ₹${amount} under *${category}*`, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Error saving expense. Try again!");
  }
});

export default bot;

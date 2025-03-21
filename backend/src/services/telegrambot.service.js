// bot.js
import TelegramBot from "node-telegram-bot-api";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Expense from "../models/expense.model.js";
import Income from "../models/income.model.js";
import { categorizeTransaction } from "../utils/categorization.js";
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  let text = msg.text?.trim().toLowerCase();
  
  if (!text) return;
  
  // Check if user is replying to a transaction message
  const replyMessage = msg.reply_to_message?.text;
  let transactionId = null;
  
  if (replyMessage) {
    const match = replyMessage.match(/Transaction ID: ([a-f0-9]+)/i);
    if (match) {
      transactionId = match[1]; // Extract transaction ID
    }
  }
  
  // Help commands: if user asks to see data
  if (text.includes("tell me") || text.includes("show me") || text.includes("my expenses") || text.includes("my income")) {
    bot.sendMessage(chatId, "To view your transaction history, please visit our website.");
    return;
  }
  
  // Command to start/link account
  if (text === "/start") {
    const user = await User.findOne({ telegramChatId: chatId });
    if (user) {
      bot.sendMessage(chatId, `Welcome back, ${user.name}! You can add expenses or income by sending a message.`);
    } else {
      bot.sendMessage(chatId, "Welcome! To link your account, please reply with your registered email.");
    }
    return;
  }
  
  // Linking account using email
  if (text.includes("@")) {
    const existingUser = await User.findOne({ email: text });
    if (existingUser) {
      if (!existingUser.telegramChatId) {
        if (existingUser.usageType !== "personal") {
          bot.sendMessage(chatId, "Sorry, only personal users can access the Telegram bot.");
          return;
        }
        existingUser.telegramChatId = chatId;
        await existingUser.save();
        bot.sendMessage(chatId, `✅ Linked your Telegram to ${existingUser.email}. Now you can log transactions.`);
      } else {
        bot.sendMessage(chatId, "Your Telegram is already linked.");
      }
    } else {
      bot.sendMessage(chatId, "Email not found. Please enter your registered email.");
    }
    return;
  }
  
  // Ensure the Telegram ID is linked to a registered, personal user.
  const user = await User.findOne({ telegramChatId: chatId });
  if (!user) {
    bot.sendMessage(chatId, "Your Telegram is not linked to any account. Please send your registered email.");
    return;
  }
  if (user.usageType !== "personal") {
    bot.sendMessage(chatId, "Sorry, only personal users can access the Telegram bot.");
    return;
  }
  
  // Handle DELETE transaction (via direct command or reply)
  if (text.startsWith("delete")) {
    // If replying to a transaction message, use that ID
    if (transactionId) {
      // Process deletion using the transaction ID from the reply
      let transaction = await Expense.findOneAndDelete({ _id: transactionId, createdBy: user._id });
      if (!transaction) {
        transaction = await Income.findOneAndDelete({ _id: transactionId, createdBy: user._id });
      }
      
      if (transaction) {
        bot.sendMessage(chatId, `✅ Transaction ${transactionId} deleted successfully.`);
      } else {
        bot.sendMessage(chatId, `Transaction ${transactionId} not found or you are not authorized to delete it.`);
      }
    } else {
      // Direct command format: "delete <transactionId>"
      const parts = text.split(" ");
      if (parts.length < 2) {
        bot.sendMessage(chatId, "Please provide the transaction ID or reply to the transaction message. Example: delete 615d6f...");
        return;
      }
      
      const cmdTransactionId = parts[1];
      let transaction = await Expense.findOneAndDelete({ _id: cmdTransactionId, createdBy: user._id });
      if (!transaction) {
        transaction = await Income.findOneAndDelete({ _id: cmdTransactionId, createdBy: user._id });
      }
      
      if (transaction) {
        bot.sendMessage(chatId, `✅ Transaction ${cmdTransactionId} deleted successfully.`);
      } else {
        bot.sendMessage(chatId, `Transaction ${cmdTransactionId} not found or you are not authorized to delete it.`);
      }
    }
    return;
  }
  
  // Handle EDIT or ADD TO transaction (via direct command or reply)
  if (text.startsWith("edit") || text.startsWith("add")) {
    // If replying to a transaction message, use that ID
    if (transactionId) {
      let parts = text.split(" ");
      let field, newValue;
      
      if (text.startsWith("add")) {
        // Handle "add it to category transport" format
        const toIndex = parts.indexOf("to");
        if (toIndex !== -1 && toIndex + 1 < parts.length) {
          field = parts[toIndex + 1]; 
          newValue = parts.slice(toIndex + 2).join(" "); 
        } else {
          bot.sendMessage(chatId, "Please use format: 'add to [field] [value]'. Example: add to category transport");
          return;
        }
      } else {
        // Standard edit format: "edit [field] [value]"
        if (parts.length < 3) {
          bot.sendMessage(chatId, "Usage: edit [field] [value]. Example: edit category transport");
          return;
        }
        field = parts[1];
        newValue = parts.slice(2).join(" ");
      }
      
      // Validate that the field is editable
      const editableFields = ["category", "title", "description", "amount"];
      if (!editableFields.includes(field)) {
        bot.sendMessage(chatId, `Editable fields are: ${editableFields.join(", ")}`);
        return;
      }
      
      // Find the transaction
      let transaction = await Expense.findOne({ _id: transactionId, createdBy: user._id });
      let transactionType = "expense";
      if (!transaction) {
        transaction = await Income.findOne({ _id: transactionId, createdBy: user._id });
        transactionType = "income";
      }
      
      if (!transaction) {
        bot.sendMessage(chatId, `Transaction ${transactionId} not found or you are not authorized to edit it.`);
        return;
      }
      
      // For amount, convert the new value to a number
      if (field === "amount") {
        const amt = parseFloat(newValue);
        if (isNaN(amt)) {
          bot.sendMessage(chatId, "Invalid amount provided.");
          return;
        }
        transaction[field] = amt;
      } else {
        transaction[field] = newValue;
      }
      
      try {
        await transaction.save();
        bot.sendMessage(chatId, `✅ ${transactionType} updated successfully. Field "${field}" is now "${newValue}".`);
      } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "Error updating transaction. Please try again!");
      }
    } else {
      // Direct command format without replying
      // Expected format: "edit <transactionId> <field> <newValue>"
      const parts = text.split(" ");
      if (parts.length < 4) {
        bot.sendMessage(chatId, "Usage: edit <transactionId> <field> <newValue> or reply to a transaction message with 'edit <field> <newValue>'");
        return;
      }
      
      const cmdTransactionId = parts[1];
      const field = parts[2];
      const newValue = parts.slice(3).join(" ");
      
      // Validate that the field is editable
      const editableFields = ["category", "title", "description", "amount"];
      if (!editableFields.includes(field)) {
        bot.sendMessage(chatId, `Editable fields are: ${editableFields.join(", ")}`);
        return;
      }
      
      // Find the transaction
      let transaction = await Expense.findOne({ _id: cmdTransactionId, createdBy: user._id });
      let transactionType = "expense";
      if (!transaction) {
        transaction = await Income.findOne({ _id: cmdTransactionId, createdBy: user._id });
        transactionType = "income";
      }
      
      if (!transaction) {
        bot.sendMessage(chatId, `Transaction ${cmdTransactionId} not found or you are not authorized to edit it.`);
        return;
      }
      
      // For amount, convert the new value to a number
      if (field === "amount") {
        const amt = parseFloat(newValue);
        if (isNaN(amt)) {
          bot.sendMessage(chatId, "Invalid amount provided.");
          return;
        }
        transaction[field] = amt;
      } else {
        transaction[field] = newValue;
      }
      
      try {
        await transaction.save();
        bot.sendMessage(chatId, `✅ ${transactionType} ${cmdTransactionId} updated successfully.`);
      } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "Error updating transaction. Please try again!");
      }
    }
    return;
  }
  
  // -------- Process New Transaction (Expense or Income) --------
  // Determine the transaction type by keywords
  let transactionType = null;
  if (text.includes("spent")) {
    transactionType = "expense";
  } else if (text.includes("earned") || text.includes("received")) {
    transactionType = "income";
  } else {
    bot.sendMessage(chatId, "Please start your message with 'spent' to add an expense or 'earned/received' to add income.");
    return;
  }
  
  // Get amount and category based on the transaction type
  const { amount, category } = categorizeTransaction(text, user.usageType, transactionType);
  if (!amount) {
    bot.sendMessage(chatId, `Couldn't detect an amount. Please try: 'spent ₹500 on food' or 'earned ₹2000 from salary'.`);
    return;
  }
  
  try {
    if (transactionType === "expense") {
      // Create and save a new Expense record
      const expense = new Expense({
        amount,
        category,
        title: `Expense: ${category}`,
        description: msg.text,
        user: user._id,
        date: new Date(),
        createdBy: user._id,
      });
      const savedExpense = await expense.save();
      
      // Return the transaction id in the response for future edits/deletions
      bot.sendMessage(
        chatId,
        `✅ Expense added: ₹${amount} under *${category}*.\nTransaction ID: ${savedExpense._id}. You can modify or delete this transaction by replying to this message.`,
        { parse_mode: "Markdown" }
      );
    } else if (transactionType === "income") {
      // Create and save a new Income record
      const income = new Income({
        amount,
        category,
        source: category, // Adjust this field as needed
        title: `Income: ${category}`,
        description: msg.text,
        user: user._id,
        date: new Date(),
        recurring: false,
        createdBy: user._id,
      });
      const savedIncome = await income.save();
      
      // Return the transaction id in the response for future edits/deletions
      bot.sendMessage(
        chatId,
        `✅ Income added: ₹${amount} under *${category}*.\nTransaction ID: ${savedIncome._id}. You can modify or delete this transaction by replying to this message.`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Error saving the transaction. Please try again!");
  }
});

export default bot;

import { processTelegramExpense, processTelegramReceipt } from "../services/telegramService.js";

export const handleTelegramMessage = async (req, res) => {
  try {
    const { message, photo } = req.body;

    if (photo) {
      // If an image is sent, process it with OCR
      const receiptText = await processTelegramReceipt(photo);
      res.status(200).json({ message: `Receipt scanned: ${receiptText}` });
    } else {
      // Process regular text-based expense entry
      const response = await processTelegramExpense(message);
      res.status(200).json({ message: response });
    }
  } catch (error) {
    res.status(500).json({ message: "Error processing Telegram request", error });
  }
};

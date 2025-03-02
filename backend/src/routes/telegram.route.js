import express from "express";
import { handleTelegramMessage } from "../controllers/telegramBotController.js";

const router = express.Router();
router.post("/message", handleTelegramMessage); // Supports text & image receipts

export default router;

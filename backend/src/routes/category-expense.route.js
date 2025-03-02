import express from "express";
import { categorizeExpense } from "../controllers/categoryController.js";

const router = express.Router();
router.post("/auto-categorize", categorizeExpense);

export default router;

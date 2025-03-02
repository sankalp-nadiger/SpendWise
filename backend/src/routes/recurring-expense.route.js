import express from "express";
import { addRecurringExpense } from "../controllers/recurring-exp.controller.js";

const router = express.Router();
router.post("/add", addRecurringExpense);

export default router;

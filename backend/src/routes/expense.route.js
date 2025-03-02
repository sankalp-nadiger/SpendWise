import express from "express";
import { addExpense, getUserExpenses } from "../controllers/expense.controller.js";

const router = express.Router();
router.post("/add", addExpense);
router.get("/:userId", getUserExpenses);

export default router;

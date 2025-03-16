import express from "express";
import { addExpense, getUserExpenses, updateExpense, deleteExpense } from "../controllers/expense.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.post("/add", verifyJWT, addExpense);
router.get("/", verifyJWT, getUserExpenses);
router.put("/:expenseId", verifyJWT, updateExpense);
router.delete("/:expenseId", verifyJWT, deleteExpense);

export default router;

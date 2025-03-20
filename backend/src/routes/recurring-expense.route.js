import express from "express";
import { addRecurringExpense, getRecurringExpenses, updateRecurringExpense, deleteRecurringExpense } from "../controllers/recurring-exp.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();
router.post("/add", verifyJWT, addRecurringExpense);
router.get("/get", verifyJWT, getRecurringExpenses);
router.put("/update/:id", verifyJWT, updateRecurringExpense);
router.delete("/delete/:id", verifyJWT, deleteRecurringExpense);

export default router;

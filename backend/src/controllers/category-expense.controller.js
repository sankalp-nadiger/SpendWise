import Expense from "../models/Expense.js";
import { categorizeExpenseAI } from "../services/aiService.js";

// Categorize expense automatically
export const categorizeExpense = async (req, res) => {
  try {
    const { description } = req.body;
    const category = await categorizeExpenseAI(description);
    res.status(200).json({ category });
  } catch (error) {
    res.status(500).json({ message: "Error categorizing expense", error });
  }
};

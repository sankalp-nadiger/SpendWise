import Expense from "../models/Expense.js";

// Add new expense
export const addExpense = async (req, res) => {
  try {
    const { userId, amount, category, description, date, teamId } = req.body;
    const newExpense = new Expense({ userId, amount, category, description, date, teamId });
    await newExpense.save();
    res.status(201).json({ message: "Expense added successfully", expense: newExpense });
  } catch (error) {
    res.status(500).json({ message: "Error adding expense", error });
  }
};

// Get all expenses for a user
export const getUserExpenses = async (req, res) => {
  try {
    const { userId } = req.params;
    const expenses = await Expense.find({ userId });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching expenses", error });
  }
};

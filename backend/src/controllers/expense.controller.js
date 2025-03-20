import Expense from "../models/expense.model.js";
import OrganizationUser from "../models/orgUser.model.js";

// Add new expense
export const addExpense = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    const userId = req.user._id;
    const { amount, title, category, description, department, teamId } = req.body;

    // Try to fetch the organization details for the user.
    let organization, branch;
    const orgUser = await OrganizationUser.findOne({ user: userId });

    if (orgUser) {
      organization = orgUser.organization;
      branch = orgUser.branch; // This may be undefined if not set, which is acceptable
    }

    // Create a new expense record. Organization-specific fields are added only if available.
    const newExpense = new Expense({
      user: userId,
      organization,  // undefined for personal expenses
      title,
      amount,
      category,
      description,
      department,
      branch,        // undefined for personal expenses
      teamId,
      createdBy: userId,
    });

    await newExpense.save();
    return res.status(201).json({ message: "Expense added successfully", expense: newExpense });
    
  } catch (error) {
    console.error("Error adding expense:", error);
    return res.status(500).json({ message: "Error adding expense", error: error.message });
  }
};

// Get all expenses for a user
export const getUserExpenses = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Extracted from JWT
    const expenses = await Expense.find({ user: userId }).sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Error fetching expenses", error });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Extract userId from JWT
    const { expenseId } = req.params;
    const { title, amount, category, date, branch } = req.body;

    const expense = await Expense.findOne({ _id: expenseId, user: userId });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Update fields
    expense.title = title || expense.title;
    expense.amount = amount || expense.amount;
    expense.category = category || expense.category;
    expense.date = date ? new Date(date) : expense.date;
    if (branch !== undefined) expense.branch = branch;

    await expense.save();

    res.status(200).json({ message: "Expense updated successfully", expense });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Error updating expense", error });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Extract userId from JWT
    const { expenseId } = req.params;

    const expense = await Expense.findOneAndDelete({ _id: expenseId, user: userId });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found or not authorized to delete" });
    }

    res.status(200).json({ message: "Expense deleted successfully", expenseId });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Error deleting expense", error });
  }
};
import RecurringExpense from "../models/recurring-expense.model.js";

import User from "../models/user.model.js";

export const addRecurringExpense = async (req, res) => {
  try {
    // Extract all fields from the request body
    const {
      title,
      amount,
      category,
      frequency,
      startDate,
      endDate,
      paymentMethod,
      notes
    } = req.body;

    // Get userId from authenticated session
    const userId = req.user._id; // Assuming you set this in your auth middleware

    // Validate required fields
    if (!title || !amount || !category || !frequency || !startDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create new recurring expense
    const newRecurringExpense = new RecurringExpense({
      userId,
      title,
      amount,
      category,
      frequency,
      startDate,
      endDate: endDate || null,
      paymentMethod,
      notes,
    });

    // Save to database
    await newRecurringExpense.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: "Recurring expense added successfully",
      data: newRecurringExpense
    });
  } catch (error) {
    console.error("Error adding recurring expense:", error);
    
    // Handle validation errors specifically
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    // General error
    res.status(500).json({
      success: false,
      message: "Error adding recurring expense",
      error: error.message
    });
  }
};

export const getRecurringExpenses = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    const recurring = await RecurringExpense.find({ userId, active: true })
      .sort({ nextDueDate: 1 });
    
    res.status(200).json({
      success: true,
      count: recurring.length,
      data: recurring
    });
  } catch (error) {
    console.error("Error fetching recurring expenses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recurring expenses",
      error: error.message
    });
  }
};

// Update a recurring expense
export const updateRecurringExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find expense and check ownership
    const expense = await RecurringExpense.findById(id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Recurring expense not found"
      });
    }
    
    // Check if the expense belongs to the user
    if (expense.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this expense"
      });
    }
    
    // Update the expense with new data
    const updatedExpense = await RecurringExpense.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Recurring expense updated",
      data: updatedExpense
    });
  } catch (error) {
    console.error("Error updating recurring expense:", error);
    res.status(500).json({
      success: false,
      message: "Error updating recurring expense",
      error: error.message
    });
  }
};

// Delete (deactivate) a recurring expense
export const deleteRecurringExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find expense and check ownership
    const expense = await RecurringExpense.findById(id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Recurring expense not found"
      });
    }
    
    // Check if the expense belongs to the user
    if (expense.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this expense"
      });
    }
    
    // Soft delete by setting active to false
    const deactivatedExpense = await RecurringExpense.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Recurring expense deactivated",
      data: deactivatedExpense
    });
  } catch (error) {
    console.error("Error deleting recurring expense:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting recurring expense",
      error: error.message
    });
  }
};
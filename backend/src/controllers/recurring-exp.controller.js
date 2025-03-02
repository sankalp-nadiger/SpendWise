import RecurringExpense from "../models/RecurringExpense.js";

export const addRecurringExpense = async (req, res) => {
  try {
    const { userId, amount, category, frequency, startDate } = req.body;
    const newRecurring = new RecurringExpense({ userId, amount, category, frequency, startDate });
    await newRecurring.save();
    res.status(201).json({ message: "Recurring expense added", expense: newRecurring });
  } catch (error) {
    res.status(500).json({ message: "Error adding recurring expense", error });
  }
};

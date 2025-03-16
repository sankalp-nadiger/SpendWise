import Investment from "../models/investment.model.js";

// Get all investments for the logged-in user
export const getInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user.id }).sort({ date: -1 });

    // Format the data to match frontend expectations
    const formattedInvestments = investments.map((investment) => ({
      id: investment._id,
      name: investment.name,
      amount: investment.amount,
      type: investment.type,
      date: investment.date,
      notes: investment.notes,
    }));

    res.status(200).json(formattedInvestments);
  } catch (error) {
    console.error("Error fetching investments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new investment
export const createInvestment = async (req, res) => {
  try {
    const { name, amount, type, date, notes } = req.body;

    const investment = new Investment({
      name,
      amount,
      type,
      date,
      notes,
      user: req.user.id,
    });

    const savedInvestment = await investment.save();

    res.status(201).json({
      id: savedInvestment._id,
      name: savedInvestment.name,
      amount: savedInvestment.amount,
      type: savedInvestment.type,
      date: savedInvestment.date,
      notes: savedInvestment.notes,
    });
  } catch (error) {
    console.error("Error creating investment:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Update an investment
export const updateInvestment = async (req, res) => {
  try {
    const { name, amount, type, date, notes } = req.body;

    // Find the investment and ensure it belongs to the user
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!investment) {
      return res.status(404).json({ message: "Investment not found" });
    }

    // Update fields
    investment.name = name;
    investment.amount = amount;
    investment.type = type;
    investment.date = date;
    investment.notes = notes;

    const updatedInvestment = await investment.save();

    res.status(200).json({
      id: updatedInvestment._id,
      name: updatedInvestment.name,
      amount: updatedInvestment.amount,
      type: updatedInvestment.type,
      date: updatedInvestment.date,
      notes: updatedInvestment.notes,
    });
  } catch (error) {
    console.error("Error updating investment:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Delete an investment
export const deleteInvestment = async (req, res) => {
  try {
    const investment = await Investment.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!investment) {
      return res.status(404).json({ message: "Investment not found" });
    }

    res.status(200).json({ message: "Investment deleted successfully" });
  } catch (error) {
    console.error("Error deleting investment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

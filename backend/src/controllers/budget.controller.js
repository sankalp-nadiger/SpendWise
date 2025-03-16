import User from "../models/user.model.js";

// Get User Budget
export const getBudget = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("budget");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ budget: user.budget });
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update User Budget
export const updateBudget = async (req, res) => {
  try {
    const { budget } = req.body;

    if (budget === undefined || budget === null || isNaN(budget)) {
      return res.status(400).json({ message: "Invalid budget value" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { budget },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Budget updated successfully", budget: user.budget });
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ message: "Server error" });
  }
};

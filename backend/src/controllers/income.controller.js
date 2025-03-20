import Income from "../models/income.model.js";
import OrganizationUser from "../models/orgUser.model.js";

// CREATE new income record
export const addIncome = async (req, res) => {
  try {
    const { amount, source, description, date, recurring, category, title } = req.body;
    const userId = req.user._id;
    let incomeData = {
      amount,
      source,
      description,
      date,
      recurring,
      category,
      title,
      createdBy: userId,
    };

    // If the user is an organization user, get the organization id from OrganizationUser
    if (req.user.usageType === "organization") {
      const orgUser = await OrganizationUser.findOne({ user: userId });
      if (!orgUser) {
        return res.status(400).json({ message: "Organization details not found" });
      }
      incomeData.organization = orgUser.organization;
    } else {
      incomeData.user = userId;
    }

    const income = await Income.create(incomeData);
    res.status(201).json(income);
  } catch (error) {
    console.error("Error creating income:", error);
    res.status(500).json({ message: "Failed to add income" });
  }
};

// GET incomes for the current user
export const getIncomes = async (req, res) => {
  try {
    const userId = req.user._id;
    let query = {};

    if (req.user.usageType === "organization") {
      const orgUser = await OrganizationUser.findOne({ user: userId });
      if (!orgUser) {
        return res.status(400).json({ message: "Organization details not found" });
      }
      query.organization = orgUser.organization;
    } else {
      query.user = userId;
    }

    const incomes = await Income.find(query);
    res.json(incomes);
  } catch (error) {
    console.error("Error fetching incomes:", error);
    res.status(500).json({ message: "Failed to fetch incomes" });
  }
};

// UPDATE an income record
export const updateIncome = async (req, res) => {
  try {
    const incomeId = req.params.id;
    const userId = req.user._id;
    const updateData = req.body;
    let query = { _id: incomeId };

    if (req.user.usageType === "organization") {
      const orgUser = await OrganizationUser.findOne({ user: userId });
      if (!orgUser) {
        return res.status(400).json({ message: "Organization details not found" });
      }
      query.organization = orgUser.organization;
    } else {
      query.user = userId;
    }

    const income = await Income.findOneAndUpdate(query, updateData, { new: true });
    if (!income) {
      return res.status(404).json({ message: "Income record not found" });
    }
    res.json(income);
  } catch (error) {
    console.error("Error updating income:", error);
    res.status(500).json({ message: "Failed to update income" });
  }
};

// DELETE an income record
export const deleteIncome = async (req, res) => {
  try {
    const incomeId = req.params.id;
    const userId = req.user._id;
    let query = { _id: incomeId };

    if (req.user.usageType === "organization") {
      const orgUser = await OrganizationUser.findOne({ user: userId });
      if (!orgUser) {
        return res.status(400).json({ message: "Organization details not found" });
      }
      query.organization = orgUser.organization;
    } else {
      query.user = userId;
    }

    const income = await Income.findOneAndDelete(query);
    if (!income) {
      return res.status(404).json({ message: "Income record not found" });
    }
    res.json({ message: "Income record deleted successfully" });
  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).json({ message: "Failed to delete income" });
  }
};

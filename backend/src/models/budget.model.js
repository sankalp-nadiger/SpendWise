import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "IndividualUser", required: false },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: false },
  team: { type: String, required: false },
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  duration: { type: String, enum: ["weekly", "monthly", "yearly"], required: true },
  createdAt: { type: Date, default: Date.now },
});

const Budget = mongoose.model("Budget", BudgetSchema);
export default Budget;

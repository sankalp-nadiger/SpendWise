import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "IndividualUser", required: false }, // Nullable if org expense
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: false }, // Nullable if personal
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Expense = mongoose.model("Expense", ExpenseSchema);
export default Expense;
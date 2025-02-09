import mongoose from "mongoose";

const IncomeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "IndividualUser", required: false },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: false },
  amount: { type: Number, required: true },
  source: { type: String, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Income = mongoose.model("Income", IncomeSchema);
export default Income;
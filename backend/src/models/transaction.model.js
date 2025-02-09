import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["income", "expense"], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "IndividualUser", required: false },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: false },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;

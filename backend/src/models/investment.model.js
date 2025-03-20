import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Investment name is required"],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, "Investment amount is required"],
    min: [0, "Investment amount cannot be negative"],
  },
  type: {
    type: String,
    required: [true, "Investment type is required"],
    enum: ["stock", "crypto", "real_estate", "other"],
    default: "stock",
  },
  date: {
    type: Date,
    required: [true, "Investment date is required"],
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
  },
  // New field to track who added the investment (for organization perspective)
  addedBy: {
    type: String,
    trim: true,
  }
}, 
{ timestamps: true });

const Investment = mongoose.model("Investment", investmentSchema);

export default Investment;

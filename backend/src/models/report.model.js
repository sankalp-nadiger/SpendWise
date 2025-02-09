import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "IndividualUser", required: false },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: false },
  team: { type: String, required: false }, 
  type: { type: String, enum: ["income", "expense", "balance"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  generatedAt: { type: Date, default: Date.now },
});

const Report = mongoose.model("Report", ReportSchema);
export default Report;

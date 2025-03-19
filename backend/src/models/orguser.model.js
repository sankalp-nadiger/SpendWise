import mongoose from "mongoose";

const OrganizationUserSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employeeId: Number,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  role: { type: String, enum: ["admin", "manager", "employee"], required: true },
  joinedAt: { type: Date, default: Date.now },
  team: { type: String, required: true },
});

const OrganizationUser = mongoose.model("OrganizationUser", OrganizationUserSchema);
export default OrganizationUser;
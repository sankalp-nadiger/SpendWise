import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Organization Creator
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["admin", "manager", "employee"], required: true },
    }
  ],
  inviteLinks: {
    manager: { type: String },
    employee: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

const Organization = mongoose.model("Organization", OrganizationSchema);
export default Organization;
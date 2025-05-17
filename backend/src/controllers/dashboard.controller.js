// import asyncHandler from "../utils/asynchandler.utils.js";
// import Expense from "../models/expense.model.js";
// import Investment from "../models/investment.model.js";
// import AuditLog from "../models/audit.model.js";
// import Organization from "../models/org.model.js";
// import User from "../models/user.model.js";

// /**
//  * GET /api/dashboard
//  * Returns dashboard data based on user type.
//  * - For personal users: returns user's budget, expenses, and investments.
//  * - For organization users: returns audit logs for team actions plus aggregated expense data.
//  */
// export const getDashboardData = asyncHandler(async (req, res) => {
//   const user = req.user; // Set by auth middleware

//   if (!user) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   if (user.usageType === "personal") {
//     // Personal dashboard data
//     const budget = user.budget; // Assuming budget is a field on the User model
//     const expenses = await Expense.find({ user: user._id }).sort({ date: -1 });
//     const investments = await Investment.find({ user: user._id }).sort({ date: -1 });

//     return res.status(200).json({
//       type: "personal",
//       budget,
//       expenses,
//       investments,
//     });
//   } else if (user.usageType === "organization") {
//     // Organization dashboard data
//     // Find the organization where the user is either admin or member
//     const organization = await Organization.findOne({ 
//       $or: [
//         { admin: user._id },
//         { "members.user": user._id }
//       ]
//     });
//     if (!organization) {
//       return res.status(404).json({ message: "Organization not found" });
//     }

//     // Get all member IDs (including admin)
//     let memberIds = organization.members.map((m) => m.user);
//     if (!memberIds.includes(String(organization.admin))) {
//       memberIds.push(organization.admin);
//     }

//     // Get audit logs for actions performed by organization members (e.g. expense, investment creations)
//     const auditLogs = await AuditLog.find({ user: { $in: memberIds } }).sort({ timestamp: -1 });

//     // Example aggregation: group expenses by category and date (you can extend to vendor, time period etc.)
//     const expenseAggregation = await Expense.aggregate([
//       { $match: { user: { $in: memberIds } } },
//       {
//         $group: {
//           _id: { category: "$category", date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } },
//           totalAmount: { $sum: "$amount" },
//           count: { $sum: 1 }
//         }
//       },
//       { $sort: { "_id.date": 1 } }
//     ]);

//     // Similarly, you could aggregate investments if desired.
//     const investmentAggregation = await Investment.aggregate([
//       { $match: { user: { $in: memberIds } } },
//       {
//         $group: {
//           _id: { type: "$type", date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } },
//           totalAmount: { $sum: "$amount" },
//           count: { $sum: 1 }
//         }
//       },
//       { $sort: { "_id.date": 1 } }
//     ]);

//     return res.status(200).json({
//       type: "organization",
//       organization: organization.name,
//       auditLogs,
//       expenseAggregation,
//       investmentAggregation,
//     });
//   } else {
//     return res.status(400).json({ message: "Invalid user type" });
//   }
// });

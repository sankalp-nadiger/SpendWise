import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import moment from "moment";
import Transaction from "../models/transaction.js";

export const generatePDFReport = async (userId, startDate, endDate) => {
  // Define the output directory
  const outputDir = path.join("public", "temp");

  // Ensure `public/temp` directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Define the PDF file path
  const filePath = path.join(outputDir, `expense_report_${userId}.pdf`);
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Title
  doc.fontSize(20).text("Expense Report", { align: "center" });
  doc.moveDown();

  // Fetch Transactions in Given Period
  const transactions = await Transaction.find({
    user: userId,
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
  });

  let totalExpense = 0;
  let categoryBreakdown = {};

  // Process Transactions
  transactions.forEach((txn) => {
    totalExpense += txn.amount;
    categoryBreakdown[txn.category] = (categoryBreakdown[txn.category] || 0) + txn.amount;
  });

  // Summary
  doc.fontSize(14).text(`Total Spent: ₹${totalExpense}`, { align: "left" });
  doc.text(`Period: ${moment(startDate).format("LL")} - ${moment(endDate).format("LL")}`);
  doc.moveDown();

  // Category Breakdown
  doc.fontSize(16).text("Category-wise Spending:");
  for (const [category, amount] of Object.entries(categoryBreakdown)) {
    doc.fontSize(12).text(`- ${category}: ₹${amount}`);
  }

  // Finalize PDF
  doc.end();

  // Return a Promise that resolves when writing is complete
  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", reject);
  });
};

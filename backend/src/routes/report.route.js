import express from "express";
import { generatePDFReport } from "../services/reportService.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.body;

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const filePath = await generatePDFReport(userId, startDate, endDate);

    // Check if file exists before sending
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ message: "Failed to generate PDF" });
    }

    // Set headers for download
    res.setHeader("Content-Disposition", `attachment; filename=expense_report_${userId}.pdf`);
    res.setHeader("Content-Type", "application/pdf");

    res.download(filePath, `expense_report_${userId}.pdf`, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({ message: "Error sending file" });
      }

      // Optional: Delete the file after sending to avoid storage issues
      setTimeout(() => fs.unlinkSync(filePath), 5000);
    });

  } catch (err) {
    console.error("PDF Generation Error:", err);
    res.status(500).json({ message: "Error generating report" });
  }
});

export default router;

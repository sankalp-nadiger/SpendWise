import express from "express";
import { generatePDFReport } from "../services/reportService.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.body;
    const filePath = await generatePDFReport(userId, startDate, endDate);
    res.download(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating report" });
  }
});

export default router;

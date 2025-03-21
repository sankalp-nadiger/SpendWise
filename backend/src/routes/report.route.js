import express from "express";
import { downloadExpenseReport, EmailSender, getReportFilename} from "../services/reportService.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/expense/export/:fileType", verifyJWT, downloadExpenseReport);
router.post("/expense/email-report", verifyJWT, EmailSender);
router.get('/expense/filename/:fileType', verifyJWT, getReportFilename);
export default router;

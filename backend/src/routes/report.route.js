import express from "express";
import { downloadExpenseReport, EmailSender} from "../services/reportService.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/expense/export/:fileType", verifyJWT, downloadExpenseReport);
router.post("/expense/email-report", verifyJWT, EmailSender);

export default router;

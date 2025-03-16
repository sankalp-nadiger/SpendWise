import express from "express";
import {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
} from "../controllers/investment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Apply the auth middleware to all routes
router.use(verifyJWT);

// Routes
router.get("/", getInvestments);
router.post("/", createInvestment);
router.put("/:id", updateInvestment);
router.delete("/:id", deleteInvestment);

export default router;

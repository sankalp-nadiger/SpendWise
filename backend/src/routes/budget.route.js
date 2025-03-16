import express from "express";
import { getBudget, updateBudget } from "../controllers/budget.controller.js";
import { verifyJWT as verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get User Budget
router.get("/", verifyToken, getBudget);

// Update User Budget
router.post("/", verifyToken, updateBudget);

export default router;

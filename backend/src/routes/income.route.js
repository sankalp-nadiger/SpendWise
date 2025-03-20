import express from "express";
import {
  addIncome,
  getIncomes,
  updateIncome,
  deleteIncome,
} from "../controllers/income.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();
router.use(verifyJWT);
router.post("/", addIncome);

router.get("/",getIncomes);

router.put("/:id", updateIncome);

router.delete("/:id", deleteIncome);

export default router;

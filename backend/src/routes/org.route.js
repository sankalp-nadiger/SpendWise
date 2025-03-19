import express from "express";
import { checkOrganizationExists, getInviteLinks  } from "../controllers/org.controller.js";
import { verifyJWT as verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Update User Budget
router.get("/exists/:name", checkOrganizationExists );
router.get("/invite-links", verifyToken, getInviteLinks);
export default router;

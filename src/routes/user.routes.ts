import { Router } from "express";
import { signup, login, completeProfile } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Public auth routes
router.post("/auth/signup", signup);
router.post("/auth/login", login);

// Protected route
router.post("/profile/complete", authMiddleware, completeProfile);

export default router;

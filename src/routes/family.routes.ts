import { Router } from "express";
import { addFamilyMember, getFamilyMembers } from "../controllers/family.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/family/:familyId/members", authMiddleware, addFamilyMember);
router.get("/family/:familyId/members", authMiddleware, getFamilyMembers);

export default router;

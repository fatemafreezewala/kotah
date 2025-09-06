import { Router } from "express";
import {getTasks, getCategories, addCategory, createAndAssignTask } from "../controllers/task.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadImage } from "../middleware/upload.js";

const router = Router();

router.use(authMiddleware);

// Attach a single file under field name "image"
router.post("/tasks/custom", uploadImage.single("image"), createAndAssignTask);
router.get("/tasks", getTasks);
router.get("/tasks/categories", getCategories);
router.post("/tasks/categories", uploadImage.single("icon"), addCategory); // accepts form-data with `icon` or JSON with `iconUrl`

export default router;
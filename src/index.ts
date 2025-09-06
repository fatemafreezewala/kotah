import "dotenv/config"; // loads .env automatically
import express from "express";
import { PrismaClient } from "@prisma/client";
import userRoutes from "./routes/user.routes.js"; // ✅ Make sure this exists
import familyRoutes from "./routes/family.routes.js"; // ✅ Make sure this exists
import taskRoutes from "./routes/task.routes.js"; // ✅ Make sure this exists
import path from "path";

const app = express();

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "okkk" });
});

// 🔐 Routes (signup, login, completeProfile)
app.use("/api", userRoutes);
app.use("/api", familyRoutes);
app.use("/api", taskRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(process.env.JWT_ACCESS_SECRET)
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

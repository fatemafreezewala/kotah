import "dotenv/config"; // loads .env automatically
import express from "express";
import { PrismaClient } from "@prisma/client";
import userRoutes from "./routes/user.routes.js"; // ✅ Make sure this exists

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "okkk" });
});

// 🔐 Routes (signup, login, completeProfile)
app.use("/api", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(process.env.JWT_ACCESS_SECRET)
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

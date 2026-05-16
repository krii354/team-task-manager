import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import projectRoutes from "./project.routes";
import taskRoutes from "./task.routes";
import commentRoutes from "./comment.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Service healthy", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/comments", commentRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;

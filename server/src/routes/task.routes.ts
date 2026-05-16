import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
  uploadAttachment,
} from "../controllers/task.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createTaskSchema, updateTaskSchema } from "../validators/task.validator";
import { uploadSingle } from "../middleware/upload.middleware";

const router = Router();
router.use(authenticate);

router.get("/", listTasks);
router.post("/", validate(createTaskSchema), createTask);
router.get("/:id", getTask);
router.put("/:id", validate(updateTaskSchema), updateTask);
router.delete("/:id", deleteTask);

router.post("/:id/attachments", uploadSingle, uploadAttachment);

export default router;

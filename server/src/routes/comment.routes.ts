import { Router } from "express";
import { createComment, deleteComment, listCommentsForTask } from "../controllers/comment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createCommentSchema } from "../validators/comment.validator";

const router = Router();
router.use(authenticate);

router.post("/", validate(createCommentSchema), createComment);
router.get("/:taskId", listCommentsForTask);
router.delete("/:id", deleteComment);

export default router;

import { Router } from "express";
import {
  addMembers,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  removeMember,
  updateProject,
} from "../controllers/project.controller";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createProjectSchema,
  projectMembersSchema,
  updateProjectSchema,
} from "../validators/project.validator";

const router = Router();
router.use(authenticate);

router.get("/", listProjects);
router.post("/", requireAdmin, validate(createProjectSchema), createProject);
router.get("/:id", getProject);
router.put("/:id", validate(updateProjectSchema), updateProject);
router.delete("/:id", deleteProject);

router.post("/:id/members", validate(projectMembersSchema), addMembers);
router.delete("/:id/members/:userId", removeMember);

export default router;

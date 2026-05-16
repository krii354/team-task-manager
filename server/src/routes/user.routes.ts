import { Router } from "express";
import {
  changePassword,
  deleteUser,
  getMe,
  listUsers,
  updateProfile,
  updateUserByAdmin,
} from "../controllers/user.controller";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  adminUpdateUserSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../validators/user.validator";

const router = Router();

router.use(authenticate);

router.get("/me", getMe);
router.put("/profile", validate(updateProfileSchema), updateProfile);
router.post("/change-password", validate(changePasswordSchema), changePassword);

router.get("/", requireAdmin, listUsers);
router.put("/:id", requireAdmin, validate(adminUpdateUserSchema), updateUserByAdmin);
router.delete("/:id", requireAdmin, deleteUser);

export default router;

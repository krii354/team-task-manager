import { Router } from "express";
import { login, logout, refresh, signup } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { loginSchema, refreshSchema, signupSchema } from "../validators/auth.validator";
import { authLimiter } from "../middleware/rateLimit.middleware";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", authenticate, logout);

export default router;

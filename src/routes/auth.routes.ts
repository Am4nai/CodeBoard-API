import { Router } from "express";
import { register, login, verifyToken } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/verify", authMiddleware, verifyToken);
router.post("/register", register);
router.post("/login", login);

export default router;
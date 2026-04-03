import { Router } from "express";
import { getUser, updateUser, getUserPosts, searchUsers } from "../controllers/users.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/search", searchUsers);
router.get("/:id/posts", getUserPosts);
router.get("/:id", getUser);
router.put("/:id", authMiddleware, updateUser);

export default router;
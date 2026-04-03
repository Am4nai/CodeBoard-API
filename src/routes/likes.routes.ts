import express from "express";
import { toggleLike, getLikesCount, checkIfLiked } from "../controllers/likes.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/:postId/toggle", authMiddleware, toggleLike);
router.get("/:postId/count", getLikesCount);
router.get("/:postId/is-liked", authMiddleware, checkIfLiked);

export default router;

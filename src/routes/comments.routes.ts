import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  getCommentCount
} from "../controllers/comments.controller";

const router = Router();

router.post("/", authMiddleware, createComment);
router.get("/post/:postId", getCommentsByPost);
router.get("/post/:postId/count", getCommentCount);
router.put("/:id", authMiddleware, updateComment);
router.delete("/:id", authMiddleware, deleteComment);

export default router;

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  getPosts,
  getRandomPosts,
  getCount,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  searchPosts,
  addView,
} from "../controllers/posts.controller";

const router = Router();

router.get("/random", getRandomPosts);
router.get("/count", getCount);
router.get("/search", searchPosts);

router.get("/", getPosts);
router.post("/", authMiddleware, createPost);

router.get("/:id", getPostById);
router.put("/:id", authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);

router.post("/:id/view", addView);

export default router;

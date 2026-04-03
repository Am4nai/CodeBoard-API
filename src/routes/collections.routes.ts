import express from "express";
import {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addPostToCollection,
  removePostFromCollection
} from "../controllers/collections.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/", authMiddleware, getCollections);
router.get("/:id", authMiddleware, getCollectionById);
router.post("/", authMiddleware, createCollection);
router.put("/:id", authMiddleware, updateCollection);
router.delete("/:id", authMiddleware, deleteCollection);

router.post("/:id/posts", authMiddleware, addPostToCollection);
router.delete("/:id/posts/:postId", authMiddleware, removePostFromCollection);

export default router;

import { Router } from "express";
import {
  createTag,
  deleteTag,
  getTagById,
  getTags,
  searchTags,
  updateTag,
} from "../controllers/tag.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getTags);
router.get("/search", searchTags);
router.get("/:id", getTagById);

router.post("/", authMiddleware, createTag);
router.put("/:id", authMiddleware, updateTag);
router.delete("/:id", authMiddleware, deleteTag);

export default router;
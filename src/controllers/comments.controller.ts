import { Request, Response } from "express";
import { CommentModel, getCommentDepth } from "../models/CommentModel";
import { buildTree } from "../utils/tree";
import type { CommentNode } from "../types/comment";

export const createComment = async (req: Request, res: Response) => {
  try {
    const authorId = req.user?.id;
    if (!authorId) return res.status(401).json({ error: "Unauthorized user" });

    const postId = Number(req.body.post_id);
    const parentIdRaw = req.body.parent_id;
    const parentId =
      parentIdRaw === undefined || parentIdRaw === null || parentIdRaw === ""
        ? null
        : Number(parentIdRaw);

    const content = String(req.body.content ?? "").trim();

    if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid post_id" });
    if (parentId !== null && Number.isNaN(parentId)) return res.status(400).json({ error: "Invalid parent_id" });
    if (!content) return res.status(400).json({ error: "Content is required" });

    const MAX_DEPTH = 3;
    const depth = await getCommentDepth(parentId);
    if (depth > MAX_DEPTH) {
      return res.status(400).json({ error: `Maximum nesting level (${MAX_DEPTH}) reached` });
    }

    const newComment = await CommentModel.create(postId, authorId, content, parentId);
    return res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error creating comment" });
  }
};

export const getCommentsByPost = async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

    const comments = (await CommentModel.getByPostId(postId)) as CommentNode[];
    const tree = buildTree(comments);
    return res.json(tree);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error receiving comments" });
  }
};

export const getCommentCount = async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

    const count = await CommentModel.countByPostId(postId);
    return res.json({ count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error receiving count comments" });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const authorId = req.user?.id;
    const content = String(req.body.content ?? "").trim();

    if (!authorId) return res.status(401).json({ error: "Unauthorized user" });
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid comment id" });
    if (!content) return res.status(400).json({ error: "Content is required" });

    const updated = await CommentModel.update(id, authorId, content);

    if (!updated) {
      return res.status(404).json({ error: "Comment not found or access denied" });
    }

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error updating comment" });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const authorId = req.user?.id;

    if (!authorId) return res.status(401).json({ error: "Unauthorized user" });
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid comment id" });

    const deleted = await CommentModel.delete(id, authorId);

    if (!deleted) return res.status(404).json({ error: "Comment not found or access denied" });

    return res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error deleting comment" });
  }
};

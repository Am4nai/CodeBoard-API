import { Request, Response } from "express";
import pool from "../config/db";
import { PostLikeModel } from "../models/PostLikeModel";

const getPostLikesCount = async (postId: number): Promise<number | null> => {
  const r = await pool.query<{ likes_count: number }>(
    "SELECT likes_count FROM posts WHERE id = $1",
    [postId]
  );

  const row = r.rows[0];
  if (!row) return null;

  return row.likes_count;
};


export const toggleLike = async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: "Unauthorized user" });
    if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

    const toggled = await PostLikeModel.toggle(postId, userId);

    const likes_count = await getPostLikesCount(postId);
    if (likes_count === null) return res.status(404).json({ error: "Post not found" });

    return res.json({
      ...toggled,
      likes_count,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error toggling like" });
  }
};

export const getLikesCount = async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

    const likes_count = await getPostLikesCount(postId);
    if (likes_count === null) return res.status(404).json({ error: "Post not found" });

    return res.json({ likes_count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error getting like count" });
  }
};

export const checkIfLiked = async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: "Unauthorized user" });
    if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

    const liked = await PostLikeModel.isLiked(postId, userId);
    return res.json({ liked });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error checking like status" });
  }
};

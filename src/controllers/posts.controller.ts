import { Request, Response, NextFunction } from "express";
import { PostModel } from "../models/PostModel";
import { PostUpdateInput } from "../types/types";

export const getPosts = async (req: Request, res: Response) => {
  try {
    const pageRaw = Number(req.query.page);
    const limitRaw = Number(req.query.limit);

    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 15;

    const offset = (page - 1) * limit;

    const posts = await PostModel.getAll(limit, offset);

    const totalPosts = await PostModel.count();
    const totalPages = Math.ceil(totalPosts / limit);
    const remainingPosts = Math.max(totalPosts - (offset + limit), 0);

    return res.json({
      page,
      limit,
      totalPosts,
      totalPages,
      remainingPosts,
      posts,
    });
  } catch {
    return res.status(500).json({ error: "Error fetching posts" });
  }
};

export const getRandomPosts = async (req: Request, res: Response) => {
  try {
    const seedRaw = Number(req.query.seed);
    const pageRaw = Number(req.query.page);
    const limitRaw = Number(req.query.limit);

    const seed = Number.isFinite(seedRaw) && seedRaw >= 0 ? seedRaw : 0;
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 15;

    const totalPosts = await PostModel.count();
    if (seed >= totalPosts) {
      return res.status(400).json({ error: "Seed is out of range" });
    }

    const offset = seed + (page - 1) * limit;
    const posts = await PostModel.getAll(limit, offset);

    const totalPages = Math.ceil(totalPosts / limit);
    const remainingPosts = Math.max(totalPosts - (offset + limit), 0);

    return res.json({
      seed,
      page,
      limit,
      totalPosts,
      totalPages,
      remainingPosts,
      posts,
    });
  } catch {
    return res.status(500).json({ error: "Error fetching random posts" });
  }
};

export const getCount = async (_req: Request, res: Response) => {
  const totalPosts = await PostModel.count();
  return res.json({ totalPosts });
};

export const getPostById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  const post = await PostModel.getById(id);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  return res.json(post);
};

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { title, code, language_id, description, about, tags } = req.body;

    const languageIdNum = Number(language_id);
    if (!title || !code || !Number.isFinite(languageIdNum) || languageIdNum <= 0) {
      return res.status(400).json({ error: "title, code and language_id are required" });
    }

    const post = await PostModel.create({
      authorId: user.id,
      title,
      code,
      languageId: languageIdNum,
      description: description ?? null,
      about: about ?? null,
      tags: Array.isArray(tags) ? tags : [],
    });

    return res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const post = await PostModel.getById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.author_id !== req.user?.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { title, code, language_id, description, about, tags } = req.body;

    const languageId =
      language_id === undefined || language_id === null || language_id === ""
        ? null
        : Number(language_id);

    if (languageId !== null && (!Number.isFinite(languageId) || languageId <= 0)) {
      return res.status(400).json({ error: "language_id must be a positive number" });
    }

    const updateData: PostUpdateInput = {
      title: title ?? null,
      code: code ?? null,
      languageId,
      description: description ?? null,
      about: about ?? null,
    };

    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags : [];
    }

    const updated = await PostModel.update(id, updateData);

    if (!updated) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const post = await PostModel.getById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.author_id !== req.user?.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await PostModel.delete(id);
    return res.json({ message: "Post deleted" });
  } catch (err) {
    next(err);
  }
};

export const searchPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pageRaw = Number(req.query.page);
    const limitRaw = Number(req.query.limit);

    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 15;

    const raw = String(req.query.query ?? "").trim();
    const parts = raw.split(" ").filter(Boolean);

    const tags = parts.filter((w) => w.startsWith("#")).map((w) => w.slice(1));
    const textQuery = parts.filter((w) => !w.startsWith("#")).join(" ").trim();

    if (!textQuery && tags.length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const posts = await PostModel.search(textQuery, tags, page, limit);
    return res.status(200).json({ posts });
  } catch (err) {
    next(err);
  }
};
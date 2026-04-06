import { Request, Response, NextFunction } from "express";
import { TagModel } from "../models/TagModel";

export const getTags = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await TagModel.getAll();
    return res.json(tags);
  } catch (err) {
    next(err);
  }
};

export const searchTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q ?? "").trim();

    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 10;

    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const tags = await TagModel.search(q, limit);
    return res.json(tags);
  } catch (err) {
    next(err);
  }
};

export const getTagById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid tag id" });
    }

    const tag = await TagModel.getById(id);

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    return res.json(tag);
  } catch (err) {
    next(err);
  }
};

export const createTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = String(req.body.name ?? "").trim();

    if (!name) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    const existing = await TagModel.getByName(name);
    if (existing) {
      return res.status(409).json({ error: "Tag already exists" });
    }

    const tag = await TagModel.create(name);
    return res.status(201).json(tag);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Tag already exists" });
    }

    next(err);
  }
};

export const updateTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const name = String(req.body.name ?? "").trim();

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid tag id" });
    }

    if (!name) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    const current = await TagModel.getById(id);
    if (!current) {
      return res.status(404).json({ error: "Tag not found" });
    }

    const existing = await TagModel.getByName(name);
    if (existing && existing.id !== id) {
      return res.status(409).json({ error: "Tag already exists" });
    }

    const updated = await TagModel.update(id, name);
    return res.json(updated);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Tag already exists" });
    }

    next(err);
  }
};

export const deleteTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid tag id" });
    }

    const tag = await TagModel.getById(id);
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    await TagModel.delete(id);
    return res.json({ message: "Tag deleted" });
  } catch (err) {
    next(err);
  }
};
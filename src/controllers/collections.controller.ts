import { Request, Response } from "express";
import { CollectionModel } from "../models/CollectionModel";

export const createCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, description } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized user" });
    if (!name) return res.status(400).json({ error: "Name is required" });

    const collection = await CollectionModel.create(userId, name, description);
    return res.status(201).json(collection);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error creating collection" });
  }
};

export const getCollections = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized user" });

    const collections = await CollectionModel.getAllByUser(userId);
    return res.json(collections);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error getting collections" });
  }
};

export const getCollectionById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized user" });

    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid collection id" });

    const collection = await CollectionModel.getByIdForUser(id, userId);
    if (!collection) return res.status(404).json({ error: "Collection not found" });

    const posts = await CollectionModel.getPosts(id);
    return res.json({ ...collection, posts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error getting collection" });
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized user" });

    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid collection id" });

    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const updated = await CollectionModel.update(id, userId, name, description);
    if (!updated) return res.status(404).json({ error: "Collection not found or not yours" });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error updating collection" });
  }
};

export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized user" });

    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid collection id" });

    const deleted = await CollectionModel.delete(id, userId);
    if (!deleted) return res.status(404).json({ error: "Collection not found or not yours" });

    return res.json({ message: "Collection deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error deleting collection" });
  }
};

export const addPostToCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized user" });

    const collectionId = Number(req.params.id);
    const postId = Number(req.body.postId);

    if (Number.isNaN(collectionId)) return res.status(400).json({ error: "Invalid collection id" });
    if (Number.isNaN(postId)) return res.status(400).json({ error: "postId is required" });

    const ok = await CollectionModel.isOwner(collectionId, userId);
    if (!ok) return res.status(404).json({ error: "Collection not found or not yours" });

    await CollectionModel.addPost(collectionId, postId);
    return res.status(201).json({ message: "Post added to collection" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error adding post to collection" });
  }
};

export const removePostFromCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized user" });

    const collectionId = Number(req.params.id);
    const postId = Number(req.params.postId);

    if (Number.isNaN(collectionId)) return res.status(400).json({ error: "Invalid collection id" });
    if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

    const ok = await CollectionModel.isOwner(collectionId, userId);
    if (!ok) return res.status(404).json({ error: "Collection not found or not yours" });

    await CollectionModel.removePost(collectionId, postId);
    return res.json({ message: "Post removed from collection" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error removing post from collection" });
  }
};

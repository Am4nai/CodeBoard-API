import { Request, Response, NextFunction } from "express";
import pool from "../config/db";
import { PostModel } from "../models/PostModel";
import type { Profile } from "../types/types";

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        p.avatar_url,
        p.description,
        p.about,
        p.updated_at AS profile_updated_at
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1
      `,
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "User not found" });
    }

    const row = result.rows[0];

    const profile = {
      avatar_url: row.avatar_url,
      description: row.description,
      about: row.about,
    } satisfies Profile;

    return res.json({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      created_at: row.created_at,
      profile,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserPosts = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const posts = await PostModel.getByUserId(userId);

  return res.json({
    userId,
    total: posts.length,
    posts,
  });
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query ?? "").trim();
    if (!query) {
      return res.json({ results: [] });
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        p.avatar_url
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.username ILIKE $1
      ORDER BY u.username ASC
      LIMIT 20
      `,
      [`%${query}%`]
    );

    return res.json({ results: result.rows });
  } catch (err) {
    console.error("searchUsers error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (authUser.id !== id && authUser.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { username, email } = req.body;
    const { avatar_url, description, about } = req.body;

    if (username) {
      const exists = await client.query(
        "SELECT 1 FROM users WHERE username = $1 AND id <> $2",
        [username, id]
      );
      if (exists.rowCount) {
        return res.status(409).json({ error: "username already in use" });
      }
    }

    if (email) {
      const exists = await client.query(
        "SELECT 1 FROM users WHERE email = $1 AND id <> $2",
        [email, id]
      );
      if (exists.rowCount) {
        return res.status(409).json({ error: "email already in use" });
      }
    }

    await client.query("BEGIN");

    await client.query(
      `
      UPDATE users
      SET
        username = COALESCE($1, username),
        email    = COALESCE($2, email)
      WHERE id = $3
      `,
      [username ?? null, email ?? null, id]
    );

    await client.query(
      `
      UPDATE profiles
      SET
        avatar_url  = COALESCE($1, avatar_url),
        description = COALESCE($2, description),
        about       = COALESCE($3, about)
      WHERE user_id = $4
      `,
      [avatar_url ?? null, description ?? null, about ?? null, id]
    );

    const result = await client.query(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        p.avatar_url,
        p.description,
        p.about
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    const row = result.rows[0];

    return res.json({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      created_at: row.created_at,
      profile: {
        avatar_url: row.avatar_url,
        description: row.description,
        about: row.about,
      } satisfies Profile,
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    next(err);
  } finally {
    client.release();
  }
};

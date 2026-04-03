import { Request, Response } from "express";
import pool from "../config/db";

export const getAllUsers = async (_req: Request, res: Response) => {
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
    ORDER BY u.created_at DESC
    `
  );

  return res.json(result.rows);
};

export const getUserByIdAdmin = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid user id" });

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

  return res.json(result.rows[0]);
};

export const updateUserByAdmin = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid user id" });

    const { username, email, role, avatar_url, description, about } = req.body;

    await client.query("BEGIN");

    const userUpdate = await client.query(
      `
      UPDATE users
      SET
        username = COALESCE($1, username),
        email    = COALESCE($2, email),
        role     = COALESCE($3, role)
      WHERE id = $4
      RETURNING id
      `,
      [username ?? null, email ?? null, role ?? null, id]
    );

    if (!userUpdate.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

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
        p.about,
        p.updated_at AS profile_updated_at
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1
      `,
      [id]
    );

    await client.query("COMMIT");
    return res.json(result.rows[0]);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error(err);
    return res.status(500).json({ error: "Error updating user" });
  } finally {
    client.release();
  }
};

export const deleteUserByAdmin = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid user id" });

  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [id]
  );

  if (!result.rowCount) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ message: "User deleted" });
};

import { Request, Response, NextFunction } from "express";
import pool from "../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { JwtPayload } from "../types/types";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1d") as StringValue;
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || "12");



export const verifyToken = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ valid: false });
  }

  return res.status(200).json({
    valid: true,
    user: req.user,
  });
};



export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email and password are required" });
    }

    const exists = await pool.query(
      "SELECT 1 FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (exists.rowCount) {
      return res.status(409).json({ error: "username or email already exists" });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const result = await pool.query(
      `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, role, created_at
      `,
      [username, email, password_hash]
    );

    const user = result.rows[0];

    const profileRes = await pool.query(
      `
      SELECT avatar_url, description, about
      FROM profiles
      WHERE user_id = $1
      `,
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id, role: user.role } satisfies JwtPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      user: {
        ...user,
        profile: profileRes.rows[0] ?? null,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
};



export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: "emailOrUsername and password are required" });
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.password_hash,
        u.role,
        u.created_at,
        p.avatar_url,
        p.description,
        p.about
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.email = $1 OR u.username = $1
      `,
      [emailOrUsername]
    );

    if (!result.rowCount) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role } satisfies JwtPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    delete user.password_hash;

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        profile: {
          avatar_url: user.avatar_url,
          description: user.description,
          about: user.about,
        },
      },
      token,
    });
  } catch (err) {
    next(err);
  }
};

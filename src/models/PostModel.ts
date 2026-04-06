import pool from "../config/db";
import type { PostCreateInput, PostUpdateInput } from "../types/types";

export const PostModel = {
  async _syncTags(postId: number, tags: string[]) {
    await pool.query("DELETE FROM post_tags WHERE post_id = $1", [postId]);

    if (!tags || tags.length === 0) return;

    const cleanTags = [...new Set(tags.map(t => t.toLowerCase().trim()).filter(Boolean))];

    await pool.query(
      `
      INSERT INTO post_tags (post_id, tag_id)
      SELECT $1, t.id
      FROM tags t
      WHERE t.name = ANY($2::text[])
      ON CONFLICT DO NOTHING
      `,
      [postId, cleanTags]
    );
  },

  async create(input: PostCreateInput) {
    const { authorId, title, code, languageId, description, about, tags } = input;

    const result = await pool.query(
      `
      INSERT INTO posts (author_id, title, description, about, code, language_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [authorId, title, description ?? null, about ?? null, code, languageId]
    );

    const postId = result.rows[0].id;

    if (tags && tags.length > 0) {
      await this._syncTags(postId, tags);
    }

    return this.getById(postId);
  },

  async update(id: number, patch: PostUpdateInput) {
    const { title, code, languageId, description, about, tags } = patch;

    await pool.query(
      `
      UPDATE posts
      SET
        title       = COALESCE($1, title),
        code        = COALESCE($2, code),
        language_id = COALESCE($3, language_id),
        description = COALESCE($4, description),
        about       = COALESCE($5, about),
        updated_at  = NOW()
      WHERE id = $6
      `,
      [
        title !== undefined ? title : null,
        code !== undefined ? code : null,
        languageId !== undefined ? languageId : null,
        description !== undefined ? description : null,
        about !== undefined ? about : null,
        id
      ]
    );

    if (tags !== undefined) {
      await this._syncTags(id, tags);
    }

    return this.getById(id);
  },

  async getAll(limit: number, offset: number) {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.author_id,
        u.username AS author_name,
        pr.avatar_url AS author_avatar_url,
        p.title,
        p.description,
        p.about,
        p.code,
        p.language_id,
        l.name AS language_name,
        p.likes_count AS like_count,
        p.created_at,
        p.updated_at,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)::INT AS comment_count,
        COALESCE(
          (SELECT json_agg(t.name)
           FROM post_tags pt
           JOIN tags t ON t.id = pt.tag_id
           WHERE pt.post_id = p.id),
          '[]'
        ) AS tags
      FROM posts p
      JOIN users u ON u.id = p.author_id
      JOIN profiles pr ON pr.user_id = u.id
      JOIN languages l ON l.id = p.language_id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );
    return result.rows;
  },

  async count() {
    const result = await pool.query(`SELECT COUNT(*) FROM posts`);
    return parseInt(result.rows[0].count, 10);
  },

  async getById(id: number) {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.author_id,
        u.username AS author_name,
        pr.avatar_url AS author_avatar_url,
        p.title,
        p.description,
        p.about,
        p.code,
        p.language_id,
        l.name AS language_name,
        p.likes_count AS like_count,
        p.created_at,
        p.updated_at,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)::INT AS comment_count,
        COALESCE(
          (SELECT json_agg(t.name)
           FROM post_tags pt
           JOIN tags t ON t.id = pt.tag_id
           WHERE pt.post_id = p.id),
          '[]'
        ) AS tags
      FROM posts p
      JOIN users u ON u.id = p.author_id
      JOIN profiles pr ON pr.user_id = u.id
      JOIN languages l ON l.id = p.language_id
      WHERE p.id = $1
      `,
      [id]
    );
    return result.rows[0];
  },

  async getByUserId(userId: string) {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.author_id,
        u.username AS author_name,
        pr.avatar_url AS author_avatar_url,
        p.title,
        p.description,
        p.about,
        p.code,
        p.language_id,
        l.name AS language_name,
        p.likes_count AS like_count,
        p.created_at,
        p.updated_at,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)::INT AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.author_id
      JOIN profiles pr ON pr.user_id = u.id
      JOIN languages l ON l.id = p.language_id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
      `,
      [userId]
    );
    return result.rows;
  },

  async delete(id: number) {
    await pool.query("DELETE FROM posts WHERE id = $1", [id]);
  },

  async search(textQuery: string, tags: string[], page: number, limit: number) {
    const offset = (page - 1) * limit;
    const hasTags = tags.length > 0;
    const hasText = textQuery.length > 0;

    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (hasText) {
      whereClauses.push(`(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.about ILIKE $${paramIndex})`);
      params.push(`%${textQuery}%`);
      paramIndex++;
    }

    if (hasTags) {
      whereClauses.push(`
        p.id IN (
          SELECT pt.post_id
          FROM post_tags pt
          JOIN tags t ON t.id = pt.tag_id
          WHERE t.name = ANY($${paramIndex})
          GROUP BY pt.post_id
          HAVING COUNT(DISTINCT t.name) = $${paramIndex + 1}
        )
      `);
      params.push(tags);
      params.push(tags.length);
      paramIndex += 2;
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const sql = `
      SELECT
        p.id, p.author_id, u.username AS author_name, pr.avatar_url AS author_avatar_url,
        p.title, p.description, p.about, p.code, p.language_id, l.name AS language_name,
        p.likes_count AS like_count, p.created_at, p.updated_at,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)::INT AS comment_count,
        COALESCE(
          (SELECT json_agg(t.name) FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id),
          '[]'
        ) AS tags
      FROM posts p
      JOIN users u ON u.id = p.author_id
      JOIN profiles pr ON pr.user_id = u.id
      JOIN languages l ON l.id = p.language_id
      ${whereSQL}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await pool.query(sql, params);
    return result.rows;
  },
};
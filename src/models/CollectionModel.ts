import pool from "../config/db";

export class CollectionModel {
  static async create(userId: number, name: string, description?: string) {
    const result = await pool.query(
      `
      INSERT INTO collections (user_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [userId, name, description ?? null]
    );

    return result.rows[0];
  }

  static async getAllByUser(userId: number) {
    const result = await pool.query(
      `SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  static async getByIdForUser(id: number, userId: number) {
    const result = await pool.query(
      `SELECT * FROM collections WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return result.rows[0];
  }

  static async isOwner(collectionId: number, userId: number): Promise<boolean> {
    const r = await pool.query(
      `SELECT 1 FROM collections WHERE id = $1 AND user_id = $2`,
      [collectionId, userId]
    );
    return !!r.rowCount;
  }

  static async update(id: number, userId: number, name: string, description?: string) {
    const result = await pool.query(
      `
      UPDATE collections
      SET name = $1, description = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *
      `,
      [name, description ?? null, id, userId]
    );
    return result.rows[0];
  }

  static async delete(id: number, userId: number) {
    const result = await pool.query(
      `DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return result.rows[0];
  }

  static async addPost(collectionId: number, postId: number) {
    await pool.query(
      `
      INSERT INTO collection_posts (collection_id, post_id)
      VALUES ($1, $2)
      ON CONFLICT (collection_id, post_id) DO NOTHING
      `,
      [collectionId, postId]
    );
  }

  static async removePost(collectionId: number, postId: number) {
    await pool.query(
      `DELETE FROM collection_posts WHERE collection_id = $1 AND post_id = $2`,
      [collectionId, postId]
    );
  }

  static async getPosts(collectionId: number) {
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
        cp.added_at,
        (
          SELECT COUNT(*)
          FROM comments c
          WHERE c.post_id = p.id
        )::INT AS comment_count
      FROM collection_posts cp
      JOIN posts p ON p.id = cp.post_id
      JOIN users u ON u.id = p.author_id
      JOIN profiles pr ON pr.user_id = u.id
      JOIN languages l ON l.id = p.language_id
      WHERE cp.collection_id = $1
      ORDER BY cp.added_at DESC
      `,
      [collectionId]
    );

    return result.rows;
  }
}

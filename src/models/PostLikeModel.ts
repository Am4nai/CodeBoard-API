import pool from "../config/db";

export class PostLikeModel {
  static async toggle(postId: number, userId: string): Promise<{ liked: boolean }> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const del = await client.query(
        `DELETE FROM post_likes
         WHERE post_id = $1 AND user_id = $2`,
        [postId, userId]
      );

      if (del.rowCount && del.rowCount > 0) {
        await client.query("COMMIT");
        return { liked: false };
      }

      await client.query(
        `INSERT INTO post_likes (post_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (post_id, user_id) DO NOTHING`,
        [postId, userId]
      );

      await client.query("COMMIT");
      return { liked: true };
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {}
      throw err;
    } finally {
      client.release();
    }
  }

  static async isLiked(postId: number, userId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );

    return !!result.rowCount;
  }
}

import pool from "../config/db";

export const CommentModel = {
  async create(postId: number, authorId: number, content: string, parentId: number | null) {
    const result = await pool.query(
      `
      INSERT INTO comments (post_id, author_id, content, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [postId, authorId, content, parentId]
    );

    return result.rows[0];
  },

  async getByPostId(postId: number) {
    const result = await pool.query(
      `
      SELECT
        c.*,
        u.username,
        p.avatar_url AS author_avatar_url
      FROM comments c
      JOIN users u ON c.author_id = u.id
      JOIN profiles p ON p.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
      `,
      [postId]
    );

    return result.rows;
  },

  async countByPostId(postId: number): Promise<number> {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM comments WHERE post_id = $1`,
      [postId]
    );

    const row = result.rows[0];
    return row ? parseInt(row.count, 10) : 0;
  },

  async update(id: number, authorId: number, content: string) {
    const result = await pool.query(
      `
      UPDATE comments
      SET content = $1
      WHERE id = $2 AND author_id = $3
      RETURNING *
      `,
      [content, id, authorId]
    );

    return result.rows[0];
  },

  async delete(id: number, authorId: number) {
    const result = await pool.query(
      `
      DELETE FROM comments
      WHERE id = $1 AND author_id = $2
      RETURNING *
      `,
      [id, authorId]
    );

    return result.rows[0];
  },
};

export async function getCommentDepth(parentId: number | null): Promise<number> {
  if (!parentId) return 1;

  const result = await pool.query<{ parent_id: number | null }>(
    "SELECT parent_id FROM comments WHERE id = $1",
    [parentId]
  );

  const row = result.rows[0];
  if (!row) return 1;

  return 1 + (await getCommentDepth(row.parent_id));
}

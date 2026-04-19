import pool from "../config/db";

export const TagModel = {
  normalizeName(name: string) {
    return name.toLowerCase().trim();
  },

  async getAll() {
    const result = await pool.query(
      `
      SELECT
        t.id,
        t.name,
        COUNT(pt.post_id)::INT AS posts_count
      FROM tags t
      LEFT JOIN post_tags pt ON pt.tag_id = t.id
      GROUP BY t.id, t.name
      ORDER BY t.name ASC
      `
    );

    return result.rows;
  },

  async search(query: string, limit: number) {
    const normalized = `%${this.normalizeName(query)}%`;

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.name,
        COUNT(pt.post_id)::INT AS posts_count
      FROM tags t
      LEFT JOIN post_tags pt ON pt.tag_id = t.id
      WHERE t.name ILIKE $1
      GROUP BY t.id, t.name
      ORDER BY t.name ASC
      LIMIT $2
      `,
      [normalized, limit]
    );

    return result.rows;
  },

  async getById(id: number) {
    const result = await pool.query(
      `
      SELECT
        t.id,
        t.name,
        COUNT(pt.post_id)::INT AS posts_count
      FROM tags t
      LEFT JOIN post_tags pt ON pt.tag_id = t.id
      WHERE t.id = $1
      GROUP BY t.id, t.name
      `,
      [id]
    );

    return result.rows[0];
  },

  async getByName(name: string) {
    const normalized = this.normalizeName(name);

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.name,
        COUNT(pt.post_id)::INT AS posts_count
      FROM tags t
      LEFT JOIN post_tags pt ON pt.tag_id = t.id
      WHERE t.name = $1
      GROUP BY t.id, t.name
      `,
      [normalized]
    );

    return result.rows[0];
  },

  async create(name: string) {
    const normalized = this.normalizeName(name);

    const result = await pool.query(
      `
      INSERT INTO tags (name)
      VALUES ($1)
      RETURNING id
      `,
      [normalized]
    );

    return this.getById(result.rows[0].id);
  },

  async update(id: number, name: string) {
    const normalized = this.normalizeName(name);

    await pool.query(
      `
      UPDATE tags
      SET name = $1
      WHERE id = $2
      `,
      [normalized, id]
    );

    return this.getById(id);
  },

  async delete(id: number) {
    await pool.query("DELETE FROM tags WHERE id = $1", [id]);
  },
};
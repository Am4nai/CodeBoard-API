import pool from "../config/db";

export type LanguageRow = {
  id: number;
  name: string;
  created_at: string;
};

export const LanguageModel = {
  async getAll(): Promise<LanguageRow[]> {
    const result = await pool.query<LanguageRow>(`
      SELECT id, name, created_at
      FROM languages
      ORDER BY name ASC
    `);

    return result.rows;
  },
};

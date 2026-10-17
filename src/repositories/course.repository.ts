import type pg from "pg";

export class CourseRepository {
  constructor(private client: pg.PoolClient) {}

  async findAll() {
    const { rows } = await this.client.query(
      "SELECT * FROM v_active_courses ORDER BY id",
    );
    return rows;
  }

  async findById(id: number) {
    const { rows } = await this.client.query(
      "SELECT * FROM v_active_courses WHERE id = $1",
      [id],
    );
    return rows[0] ?? null;
  }

  async getDetails(id: number) {
    const { rows } = await this.client.query(
      "SELECT * FROM v_course_details WHERE course_id = $1",
      [id],
    );
    return rows[0] ?? null;
  }

  async getRating(id: number) {
    const { rows } = await this.client.query(
      "SELECT * FROM v_course_ratings WHERE course_id = $1",
      [id],
    );
    return rows[0] ?? null;
  }

  async create(
    title: string,
    description: string | null,
    category: string,
    instructorId: number,
  ) {
    const { rows } = await this.client.query(
      "CALL sp_create_course($1, $2, $3, $4, NULL)",
      [title, description, category, instructorId],
    );
    return rows[0] as { p_course_id: number };
  }

  async update(
    id: number,
    title: string | null,
    description: string | null,
    category: string | null,
    updatedBy: number,
  ) {
    await this.client.query("CALL sp_update_course($1, $2, $3, $4, $5)", [
      id,
      title,
      description,
      category,
      updatedBy,
    ]);
  }

  async softDelete(id: number, deletedBy: number) {
    await this.client.query("CALL sp_soft_delete_course($1, $2)", [
      id,
      deletedBy,
    ]);
  }
}

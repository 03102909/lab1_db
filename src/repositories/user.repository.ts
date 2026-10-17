import type pg from "pg";

export class UserRepository {
  constructor(private client: pg.PoolClient) {}

  async findAll() {
    const { rows } = await this.client.query(
      "SELECT * FROM v_active_users ORDER BY id",
    );
    return rows;
  }

  async findById(id: number) {
    const { rows } = await this.client.query(
      "SELECT * FROM v_active_users WHERE id = $1",
      [id],
    );
    return rows[0] ?? null;
  }

  async create(email: string, fullName: string, roleName: string) {
    const { rows } = await this.client.query(
      "CALL sp_create_user($1, $2, $3, NULL)",
      [email, fullName, roleName],
    );
    return rows[0] as { p_user_id: number };
  }

  async update(
    id: number,
    email: string | null,
    fullName: string | null,
    updatedBy: number,
  ) {
    await this.client.query("CALL sp_update_user($1, $2, $3, $4)", [
      id,
      email,
      fullName,
      updatedBy,
    ]);
  }

  async softDelete(id: number, deletedBy: number) {
    await this.client.query("CALL sp_soft_delete_user($1, $2)", [
      id,
      deletedBy,
    ]);
  }

  async restore(id: number) {
    await this.client.query("CALL sp_restore_user($1)", [id]);
  }

  async hasRole(userId: number, roleName: string): Promise<boolean> {
    const { rows } = await this.client.query(
      "SELECT fn_user_has_role($1, $2) AS has_role",
      [userId, roleName],
    );
    return (rows[0] as { has_role: boolean }).has_role;
  }

  async getAvgGrade(studentId: number): Promise<number> {
    const { rows } = await this.client.query(
      "SELECT fn_student_avg_grade($1) AS avg_grade",
      [studentId],
    );
    return parseFloat((rows[0] as { avg_grade: string }).avg_grade);
  }
}

import type pg from "pg";

export class EnrollmentRepository {
  constructor(private client: pg.PoolClient) {}

  async findByStudent(studentId: number) {
    const { rows } = await this.client.query(
      "SELECT * FROM v_student_enrollments WHERE student_id = $1 ORDER BY enrolled_at DESC",
      [studentId],
    );
    return rows;
  }

  async findByCourse(courseId: number) {
    const { rows } = await this.client.query(
      "SELECT * FROM v_student_enrollments WHERE course_id = $1 ORDER BY enrolled_at DESC",
      [courseId],
    );
    return rows;
  }

  async enroll(studentId: number, courseId: number) {
    await this.client.query("CALL sp_enroll_student($1, $2)", [
      studentId,
      courseId,
    ]);
  }

  async getProgress(studentId: number, courseId: number): Promise<number> {
    const { rows } = await this.client.query(
      "SELECT fn_student_course_progress($1, $2) AS progress",
      [studentId, courseId],
    );
    return parseFloat((rows[0] as { progress: string }).progress);
  }
}

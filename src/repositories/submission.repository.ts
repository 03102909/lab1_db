import type pg from "pg";

export class SubmissionRepository {
  constructor(private client: pg.PoolClient) {}

  async findByStudent(studentId: number) {
    const { rows } = await this.client.query(
      `SELECT * FROM v_submission_grades
             WHERE student_name = (SELECT full_name FROM users WHERE id = $1)
             ORDER BY submitted_at DESC`,
      [studentId],
    );
    return rows;
  }

  async submit(assignmentId: number, studentId: number, answerText: string) {
    await this.client.query("CALL sp_submit_assignment($1, $2, $3)", [
      assignmentId,
      studentId,
      answerText,
    ]);
  }

  async grade(submissionId: number, graderId: number, score: number) {
    await this.client.query("CALL sp_grade_submission($1, $2, $3)", [
      submissionId,
      graderId,
      score,
    ]);
  }

  async getAllGrades() {
    const { rows } = await this.client.query(
      "SELECT * FROM v_submission_grades ORDER BY submitted_at DESC",
    );
    return rows;
  }
}

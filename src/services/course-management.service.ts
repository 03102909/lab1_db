import { UnitOfWork } from '../unit-of-work.js';

export class CourseManagementService {
    /**
     * Workflow 1: Create course and enroll students in single atomic transaction
     */
    async createCourseAndEnrollStudents(
        title: string,
        description: string,
        category: string,
        instructorId: number,
        studentEmails: { email: string; fullName: string }[]
    ) {
        const uow = new UnitOfWork();
        await uow.begin();

        try {
            // Verify instructor has right role (calling DB function)
            const isInstructor = await uow.users.hasRole(instructorId, 'instructor');
            if (!isInstructor) {
                throw new Error(`User ${instructorId} is not an instructor`);
            }

            // Create course via stored procedure
            const courseRes = await uow.courses.create(title, description, category, instructorId);
            const courseId = courseRes.p_course_id;

            // Register & enroll each student
            const enrolledUserIds: number[] = [];
            for (const s of studentEmails) {
                const userRes = await uow.users.create(s.email, s.fullName, 'student');
                const studentId = userRes.p_user_id;
                await uow.enrollments.enroll(studentId, courseId);
                enrolledUserIds.push(studentId);
            }

            await uow.commit();
            return { courseId, enrolledUserIds };
        } catch (err) {
            await uow.rollback();
            throw err;
        }
    }

    /**
     * Workflow 2: Student submits assignment, instructor grades it
     */
    async submitAndGradeAssignment(
        assignmentId: number,
        studentId: number,
        answer: string,
        graderId: number,
        score: number
    ) {
        const uow = new UnitOfWork();
        await uow.begin();

        try {
            await uow.submissions.submit(assignmentId, studentId, answer);

            // Fetch submission via view to obtain its id
            const studentGrades = await uow.submissions.findByStudent(studentId);
            const latestSub = studentGrades[0] as { submission_id: number };

            // Grade submission via stored procedure
            await uow.submissions.grade(latestSub.submission_id, graderId, score);

            await uow.commit();
            return { submissionId: latestSub.submission_id, score };
        } catch (err) {
            await uow.rollback();
            throw err;
        }
    }

    /**
     * Workflow 3: View analytical summaries via SQL Views & Functions
     */
    async getCourseAnalytics(courseId: number) {
        const uow = new UnitOfWork();
        await uow.begin();

        try {
            const course = await uow.courses.findById(courseId);
            const details = await uow.courses.getDetails(courseId);
            const rating = await uow.courses.getRating(courseId);
            const enrollments = await uow.enrollments.findByCourse(courseId);

            await uow.commit();
            return {
                course,
                details,
                rating,
                enrollmentCount: enrollments.length,
                enrollments,
            };
        } catch (err) {
            await uow.rollback();
            throw err;
        }
    }

    /**
     * Workflow 4: Demonstrate rollback on failure
     */
    async failingTransactionDemonstration(instructorId: number) {
        const uow = new UnitOfWork();
        await uow.begin();

        try {
            // Step 1: create course
            const res = await uow.courses.create(
                'Course That Will Fail',
                'Should be rolled back',
                'Testing',
                instructorId
            );

            // Step 2: intentionally enroll non-existent user -> will trigger DB exception in sp_enroll_student
            await uow.enrollments.enroll(999999, res.p_course_id);

            await uow.commit();
        } catch (err) {
            await uow.rollback();
            return { status: 'rolled_back_successfully', reason: (err as Error).message };
        }
    }
}

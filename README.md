# Схема управління навчальними курсами

## 1. Схема бази даних

![Схема бази даних](schema.png)

## 2. Короткий опис сутностей

База даних описує роботу системи онлайн-курсів.

- Користувачі та ролі: `users`, `roles`, `user_roles`.
- Курси та їхня структура: `courses`, `course_instructors`, `modules`, `lessons`.
- Запис студентів і проходження матеріалу: `enrollments`, `lesson_progress`.
- Домашні завдання та оцінки: `assignments`, `submissions`, `grades`.
- Тести: `quizzes`, `quiz_questions`, `answer_options`.
- Відгуки до курсів: `reviews`.

Вимоги до полів:

- Soft delete (`is_deleted`, `deleted_at`, `deleted_by`) є в таблицях `users`, `courses`, `modules` і `lessons`. Записи не видаляються з бази фізично, а лише помічаються видаленими.
- Дата та автор останньої зміни (`updated_at`, `updated_by`) зберігаються в `users`, `courses`, `lessons`, `submissions`, `grades`.

## 3. Об'єкти бази даних

- Розрізи даних: `v_active_users`, `v_active_courses`, `v_course_details`, `v_student_enrollments`, `v_submission_grades`, `v_course_ratings`.
- Збережені процедури: створення користувачів та курсів, м'яке видалення і відновлення (`sp_soft_delete_user`, `sp_restore_user`, `sp_soft_delete_course`), запис студентів (`sp_enroll_student`), здача та оцінювання робіт (`sp_submit_assignment`, `sp_grade_submission`).
- Функції: підрахунок відсотка проходження курсу (`fn_student_course_progress`), розрахунок середньої оцінки студента (`fn_student_avg_grade`), перевірка ролі (`fn_user_has_role`).
- Тригери: автоматично ставлять дату `updated_at`, фіксують дату проходження уроку та не дають видалити користувача, якщо він ще вчиться на активних курсах.
- Індекси двох типів: стандартні B-tree для швидкого пошуку за зовнішніми ключами та статусами, а також GIN для повнотекстового пошуку по назвах курсів і вмісту уроків.

## 4. Repository + Unit of Work

Усі запити до бази з коду виконуються виключно через розрізи даних та збережені процедури, без прямого звернення до таблиць:

- Репозиторії (`UserRepository`, `CourseRepository`, `EnrollmentRepository`, `SubmissionRepository`) інкапсулюють доступ до даних через виклики збережених процедур і view.
- `UnitOfWork` керує підключенням до бази та тримає транзакцію (`begin`, `commit`, `rollback`), щоб зміни в декількох сутностях зберігалися атомарно.
- `CourseManagementService` містить логіку операцій над кількома сутностями.

## 5. Запуск проєкту

```bash
docker compose up -d
```

```bash
npm test
```

Тести перевіряють два основні сценарії:

1. Успішне виконання транзакції (commit).
2. Відкат усіх змін при виникненні помилки (rollback).

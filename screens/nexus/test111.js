// WITH shared_all AS (
//   SELECT
//     a1.user_id AS base_user,
//     a2.user_id AS other_user,
//     a1.question_id
//     from user_answers a1
//   JOIN user_answers a2
//     ON a1.question_id = a2.question_id
//    AND a1.answer = a2.answer
//    AND a1.user_id <> a2.user_id
//   WHERE a1.user_id = 3
// ),

// similarity AS (
//   SELECT
//     other_user,
//     COUNT(*) / 20 * 100 AS similarity_percent
//   FROM shared_all 
//   GROUP BY other_user
// ),

// shared_first_10 AS (
//   SELECT
//     a2.user_id AS other_user,
//     a1.answer,
//     ROW_NUMBER() OVER (
//       PARTITION BY a2.user_id
//       ORDER BY rand()
//     ) AS rn
//   FROM user_answers a1
//   JOIN user_answers a2
//     ON a1.question_id = a2.question_id
//    AND a1.answer = a2.answer
//    AND a1.user_id <> a2.user_id
//   WHERE a1.user_id = 3
//     AND a1.question_id <= 10
// ),

// picked_two AS (
//   SELECT *
//   FROM shared_first_10
//   WHERE rn <= 2
// )

// SELECT
//   s.other_user,
//   s.similarity_percent,
//   c.FULLNAME as thename,
//     c.image as theimage,
//   MAX(CASE WHEN p.rn = 1 THEN p.answer END) AS shared_answer_1,
//   MAX(CASE WHEN p.rn = 2 THEN p.answer END) AS shared_answer_2
// FROM similarity s 
// LEFT JOIN projecttables c ON s.other_user=c.ID
// LEFT JOIN picked_two p
//   ON s.other_user = p.other_user
// GROUP BY
//   s.other_user,
//   s.similarity_percent
// ORDER BY s.similarity_percent DESC
// LIMIT 100;

// WITH users_not_followed AS (
//     SELECT DISTINCT f.receiver_id
//     FROM follows f
//     WHERE f.receiver_id != 3
//     AND NOT EXISTS (
//         SELECT 1
//         FROM follows x
//         WHERE x.sender_id = 3
//         AND x.receiver_id = f.receiver_id
//     )
// ),

// user_suggestions AS (
//     SELECT 
//         u.receiver_id AS id,
//         p.username,
//         p.fullname,
//         p.image,
//         'user' AS type,
//         NULL AS members_count
//     FROM users_not_followed u
//     JOIN projecttables p 
//         ON p.id = u.receiver_id
// ),

// room_suggestions AS (
//     SELECT 
//         r.id AS id,
//         r.roomname AS username,
//         r.roomdescription AS fullname,
//         r.room_image AS image,
//         'room' AS type,
//         COUNT(rp.userid) AS members_count
//     FROM createinterestroom r
    
//     LEFT JOIN roomparticipants rp
//         ON rp.roomid = r.id
    
//     WHERE NOT EXISTS (
//         SELECT 1
//         FROM roomparticipants x
//         WHERE x.roomid = r.id
//         AND x.userid = 3
//     )
    
//     GROUP BY r.id
// )

// SELECT *
// FROM (
//     SELECT * FROM user_suggestions
//     UNION ALL
//     SELECT * FROM room_suggestions
// ) AS combined_suggestions
// ORDER BY RAND()
// LIMIT 1;









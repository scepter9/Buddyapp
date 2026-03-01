// WITH Selected_rooms AS (
//     SELECT 
//         cr.id,
//         cr.roomname AS title,
//         cr.roomdescription AS subtitle,
//         NULL AS image,
//         'room' AS type,
// count(a.roomid) as members_count
//     FROM createinterestroom cr
//     LEFT JOIN roomparticipants a ON cr.id = a.roomid
//     GROUP BY cr.id, cr.roomname, cr.roomdescription
//     ORDER BY RAND()
//     LIMIT 20
// ),

// Selected_users AS (
//     SELECT 
//         ID AS id,
//         USERNAME AS usersname,
//         FULLNAME AS fullname,
//         image,
//         'user' AS type,
//         NULL AS meta
//     FROM projecttables
//     ORDER BY RAND()
//     LIMIT 50
// ),

// Selected_meetups AS (
//     SELECT 
//         id,
//         title,
//         location AS subtitle,
//         description,
//         'meetup' as type,
//         NULL AS meta
//     FROM meetups
//     ORDER BY RAND()
//     LIMIT 10
// )

// SELECT *
// FROM (
//     SELECT * FROM Selected_rooms
//     UNION ALL
//     SELECT * FROM Selected_users
//     UNION ALL
//     SELECT * FROM Selected_meetups
// ) combined
// ORDER BY RAND()
// LIMIT 1;

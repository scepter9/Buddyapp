const express = require('express');
const app = express();
const session = require('express-session');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const http = require('http'); // Import http module
const { Server } = require('socket.io'); // Import Server from socket.io
const { log, timeStamp, error } = require('console');
const { result } = require('lodash');

//"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u root -p buddy > backup.sql
//very important
// CORS middleware 
app.use(cors({
    origin: true, // Or specify your frontend origin like 'http://localhost:19006'
    credentials: true
}));

// JSON parser
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Session config
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
}));




const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: true, // Allow all origins for simplicity in development, or specify your frontend origin
        credentials: true
    }
});

// Store connected users and their socket IDs (optional, but useful for direct messaging/notifications)
const connectedUsers = new Map(); // Map userId to socket.id
const activeAnonymousRooms=new Map();
const MeetupRoomUsers= new Map();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // When a user logs in or establishes their session, associate their userId with their socket.id
    socket.on('registerUser', (userId) => {
        if (userId) {
            connectedUsers.set(userId, socket.id);
            console.log(`User ${userId} registered with socket ID ${socket.id}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove the disconnected user from the map
        for (let [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                console.log(`User ${userId} unregistered.`);
                break;
            }
        }
    });
});







const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});
// Database
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  console.log('MySQL pool created');
  




// Register route
app.post('/Register', (req, res) => {
    const { fullname, username, email, phone, password } = req.body;

    if (!fullname || !username || !email || !phone || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = `INSERT INTO projecttables 
    (FULLNAME, USERNAME, EMAIL, PHONE, PASSWORD, VERIFICATION, Gender, join_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`;

    db.query(sql, [fullname, username, email, phone, password, 'pending', 'Not specified'], (err, result) => {
        if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        req.session.user = { id: result.insertId, fullname, username, email, phone };
        res.status(200).json({ message: 'User registered and session started' });
    });
});

// Login route
app.post('/Login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM projecttables WHERE USERNAME = ?';
    db.query(query, [username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error' });

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username' });
        }

        const user = results[0];
        if (user.PASSWORD !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        req.session.user = {
            id: user.ID,
            fullname: user.FULLNAME,
            email: user.EMAIL,
            username: user.USERNAME,
            phone: user.PHONE,
            image:user.image,
        };

        return res.json({ message: 'Login successful', user: req.session.user });
    });
});
 

app.get('/Profile', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const sql = `
    SELECT ID as id, FULLNAME as name, EMAIL as email, BIO as about, FOLLOWERS, FOLLOWING,
           IS_PRO as isPro, DATE_FORMAT(join_date, '%M %Y') as joinDate, IMAGE as image
    FROM projecttables
    WHERE ID = ?`;

    db.query(sql, [req.session.user.id], (err, results) => {
        if (err) {
            console.error('Error fetching current user profile:', err); // More specific error message
            return res.status(500).json({ error: 'Server error' });
        }
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });

        res.json(results[0]);
    });
    // Removed console.log('Session:', req.session); from here, as it's not directly related to the response
});
app.get('/About',(req,res)=>{
    const sql='SELECT ID as id , FullNAME as name , IMAGE as image FROM projecttables WHERE ID=?';
    db.query(sql,[req.session.user.id],(err,results)=>{
        if(err){
            console.error('Error Fetching User Values',err);
            return res.status(500).json({ error: 'Server error' });
        }
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });

        res.json(results[0]);
    })
})
// **FIXED** Get another user's profile
app.get('/users/:id', (req, res) => {
    const sql = `
    SELECT ID as id, FULLNAME as name, EMAIL as email, BIO as about, FOLLOWERS, FOLLOWING,
           IS_PRO as isPro, DATE_FORMAT(join_date, '%M %Y') as joinDate, IMAGE as image, FOLLOWERS AS followers, FOLLOWING AS following
    FROM projecttables
    WHERE ID = ?`;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            console.error('Error fetching user profile by ID:', err); // More specific error message
            return res.status(500).json({ error: 'Server error' });
        }
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });

        res.json(results[0]);
    });
});

// Check session
app.get('/check-session', (req, res) => {
    if (req.session.user) {
        return res.json({ loggedIn: true, user: req.session.user });
    } else {
        return res.status(401).json({ loggedIn: false });
    }
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }

        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Logged out successfully' });
    });
});

app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const sql = 'SELECT ID FROM projecttables WHERE EMAIL = ?';
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length === 0) {
            return res.status(404).json({ error: 'Email not found' });
        }

        // Generate 6-digit numeric code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const updateSql = `
          UPDATE projecttables
          SET reset_token = ?, token_expires = ?
          WHERE EMAIL = ?
        `;
        db.query(updateSql, [code, expires, email], (err2) => {
            if (err2) return res.status(500).json({ error: 'Failed to save reset code' });

            const mailOptions = {
                from: `"Buddy App" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Your Password Reset Code',
                html: `
              <p>Hello,</p>
              <p>Your password reset code is:</p>
              <h2>${code}</h2>
              <p>This code is valid for 10 minutes.</p>
            `
            };

            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    console.error('Email error:', error);
                    return res.status(500).json({ error: 'Failed to send email' });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Reset code sent',
                    userId: results[0].ID,
                    email: email // or any ID you want to pass to ResetPassword screen
                });

            });
        });
    });
});




app.post('/reset-password', async (req, res) => {
    const { code, email, newPassword } = req.body;

    if (!code || !email || !newPassword) {
        return res.status(400).json({ error: 'Code, email, and new password are required' });
    }

    const sql = `
      SELECT ID, reset_token, token_expires
      FROM projecttables
      WHERE EMAIL = ? AND reset_token = ? AND token_expires > NOW()
    `;

    db.query(sql, [email, code], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        try {
            // If you are using bcrypt, ensure it's imported at the top and uncomment this:
            // const hashedPassword = await bcrypt.hash(newPassword, 10);
            // const updateSql = `UPDATE projecttables SET PASSWORD = ?, reset_token = NULL, token_expires = NULL WHERE EMAIL = ?`;
            // db.query(updateSql, [hashedPassword, email], (err2) => {

            const updateSql = `
            UPDATE projecttables
            SET PASSWORD = ?, reset_token = NULL, token_expires = NULL
            WHERE EMAIL = ?
          `;
            db.query(updateSql, [newPassword, email], (err2) => { // Using newPassword directly
                if (err2) return res.status(500).json({ error: 'Failed to update password' });

                return res.status(200).json({ message: 'Password reset successful' });
            });
        } catch (hashErr) {
            return res.status(500).json({ error: 'Error hashing password' });
        }
    });
});


// Store images in uploads/
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage });


app.get('/get-profile', (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    // This query is for a table named 'users', but your main table is 'projecttables'
    // It also only selects 'name, about, image' without other profile details
    const query = 'SELECT name, about, image FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        res.json(results[0]);
    });
});


// Update profile route
app.post('/update-profile', upload.single('image'), (req, res) => {
    const { name, about, phone, password } = req.body;
    const image = req.file; // This will contain information about the uploaded file
    const userId = req.session.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    let updates = [];
    let values = [];

    if (name && name.trim() !== '') {
        updates.push('FULLNAME=?');
        values.push(name);
    }

    if (about && about.trim() !== '') {
        updates.push('BIO = ?'); // Correct column name in DB for 'about'
        values.push(about);
    }

    if (phone && phone.trim() !== '') {
        updates.push('PHONE = ?');
        values.push(phone);
    }

    if (password && password.trim() !== '') {
        // It's highly recommended to hash passwords, even for updates.
        // If you're using bcrypt, you'd do:
        // const hashedPassword = await bcrypt.hash(password, 10);
        // updates.push('PASSWORD = ?');
        // values.push(hashedPassword);
        // For now, if you're not hashing:
        updates.push('PASSWORD = ?');
        values.push(password); // Be very careful storing plain passwords!
    }

    if (image) {
        // image.filename contains the unique name generated by multer
        const imagePath = `${image.filename}`; // Store just the filename, or full path like `/uploads/${image.filename}`
        updates.push('IMAGE = ?'); // Correct column name in DB for 'image'
        values.push(imagePath); // Store the filename or relative path
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No data provided for update.' });
    }

    const sql = `UPDATE projecttables SET ${updates.join(', ')} WHERE id = ?`;
    values.push(userId);

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Update profile error:', err);
            return res.status(500).json({ error: 'Database error.' });
        }
        res.json({ message: 'Profile updated successfully.' });
    });
});
app.post('/checkuser', (req, res) => {
    const { SearchValue } = req.body;
  
    if (!SearchValue || SearchValue.trim() === '') {
      return res.status(200).json([]);
    }
  
    const SearchPattern = `%${SearchValue}%`;
    const query = 'SELECT id, email, image, username, FULLNAME FROM projecttables WHERE USERNAME LIKE ? OR FULLNAME LIKE ?';
  
    db.query(query, [SearchPattern, SearchPattern], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database Error' });
      }
  
      res.status(200).json(results);
    });
  });
  
  // ... (existing unfollow route)

  app.post('/follow', (req, res) => {
    const { receiver_id } = req.body;
    const sender_id = req.session.user?.id;

    console.log(`[FOLLOW] Request received. Sender: ${sender_id}, Receiver: ${receiver_id}`);

    if (!sender_id) {
        console.log('[FOLLOW] Error: Not authenticated');
        return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!receiver_id) {
        console.log('[FOLLOW] Error: Receiver ID is required');
        return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (parseInt(receiver_id) === parseInt(sender_id)) {
        console.log('[FOLLOW] Error: Cannot follow self');
        return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if already following to prevent duplicate entries and errors
    const checkFollowSql = 'SELECT 1 FROM follows WHERE sender_id = ? AND receiver_id = ?';
    db.query(checkFollowSql, [sender_id, receiver_id], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('[FOLLOW] Error checking existing follow:', checkErr.message, checkErr.sql);
            return res.status(500).json({ error: 'Database error during follow check' });
        }
        if (checkResults.length > 0) {
            console.log(`[FOLLOW] Already following user ${receiver_id}`);
            return res.status(409).json({ error: 'Already following this user' });
        }

        // Insert into follows table
        const insertSql = 'INSERT INTO follows(sender_id, receiver_id) VALUES (?, ?)';
        db.query(insertSql, [sender_id, receiver_id], (err) => {
            if (err) {
                console.error('[FOLLOW] Error inserting into follows:', err.message, err.sql);
                return res.status(500).json({ error: 'Failed to follow user' });
            }
            console.log(`[FOLLOW] Follows record inserted for sender ${sender_id} to receiver ${receiver_id}`);

            // --- IMPORTANT ADDITION FOR COUNTS ---
            // Increment receiver's followers count
            const updateReceiverSql = 'UPDATE projecttables SET FOLLOWERS = (CASE WHEN FOLLOWERS IS NULL THEN 1 ELSE FOLLOWERS + 1 END) WHERE ID = ?';
            db.query(updateReceiverSql, [receiver_id], (updateErr) => {
                if (updateErr) {
                    console.error('[FOLLOW] Error updating receiver followers count:', updateErr.message, updateErr.sql);
                } else {
                    console.log(`[FOLLOW] Receiver ${receiver_id} followers count updated.`);
                }
            });

            // Increment sender's following count (the logged-in user)
            const updateSenderSql = 'UPDATE projecttables SET FOLLOWING = (CASE WHEN FOLLOWING IS NULL THEN 1 ELSE FOLLOWING + 1 END) WHERE ID = ?';
            db.query(updateSenderSql, [sender_id], (updateErr) => {
                if (updateErr) {
                    console.error('[FOLLOW] Error updating sender following count:', updateErr.message, updateErr.sql);
                } else {
                    console.log(`[FOLLOW] Sender ${sender_id} following count updated.`);
                }
                // Continue with notification and response after both updates are attempted.
                // Using Promise.all would be more robust here for ensuring all DB ops complete.
                // For now, we proceed assuming these fire quickly.
            });

            // Fetch sender's name for the notification message
            db.query('SELECT FULLNAME FROM projecttables WHERE ID = ?', [sender_id], (err, results) => {
                if (err) {
                    console.error('[FOLLOW] Error fetching sender name for notification:', err.message, err.sql);
                    return res.status(500).json({ error: 'Failed to fetch sender data for notification' });
                }

                const senderName = results[0]?.FULLNAME || 'A user';
                const notificationMessage = `${senderName} followed you`;

                // Store notification in DB
                const insertNotificationSql = 'INSERT INTO notifications(sender_id, receiver_id, message, type) VALUES(?,?,?,?)';
                db.query(insertNotificationSql, [sender_id, receiver_id, notificationMessage, 'follow'], (notificationErr, notificationResult) => {
                    if (notificationErr) {
                        console.error('[FOLLOW] Failed to create notification in DB:', notificationErr.message, notificationErr.sql);
                    } else {
                        console.log(`[FOLLOW] Notification created in DB for receiver ${receiver_id}. ID: ${notificationResult.insertId}`);
                    }

                    // WebSocket Part: Send real-time notification
                    const receiverSocketId = connectedUsers.get(String(receiver_id)); // Ensure ID is string if map keys are strings
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('newNotification', {
                            id: notificationResult ? notificationResult.insertId : null,
                            sender_id: sender_id,
                            receiver_id: receiver_id,
                            message: notificationMessage,
                            sender_name: senderName,
                            type: 'follow', // Explicitly send type
                            created_at: new Date().toISOString()
                        });
                        console.log(`[FOLLOW] Real-time notification sent to user ${receiver_id} via socket ${receiverSocketId}`);
                    } else {
                        console.log(`[FOLLOW] User ${receiver_id} is not currently online for WebSocket notification.`);
                    }

                    return res.json({ message: 'Follow successful and notification processed' });
                });
            });
        });
    });
})


app.post('/unfollow', (req, res) => {
    const { receiver_id } = req.body;
    const sender_id = req.session.user?.id;

    console.log(`[UNFOLLOW] Request received. Sender: ${sender_id}, Receiver: ${receiver_id}`);

    if (!sender_id) {
        console.log('[UNFOLLOW] Error: Not authenticated');
        return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!receiver_id) {
        console.log('[UNFOLLOW] Error: Receiver ID is required');
        return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (parseInt(receiver_id) === parseInt(sender_id)) {
        console.log('[UNFOLLOW] Error: Cannot unfollow self');
        return res.status(400).json({ error: 'You cannot unfollow yourself' });
    }

    const deleteSql = 'DELETE FROM follows WHERE sender_id = ? AND receiver_id = ?';
    db.query(deleteSql, [sender_id, receiver_id], (err, result) => {
        if (err) {
            console.error('[UNFOLLOW] Delete error:', err.message, err.sql); // Log SQL for debugging
            return res.status(500).json({ error: 'Failed to unfollow user' });
        }

        if (result.affectedRows === 0) {
            console.log(`[UNFOLLOW] No follow record found for sender ${sender_id} and receiver ${receiver_id}`);
            return res.status(404).json({ error: 'You are not following this user' });
        }

        console.log(`[UNFOLLOW] Follows record deleted. Affected rows: ${result.affectedRows}`);

        // --- IMPORTANT ADDITION FOR COUNTS ---
        // Decrement receiver's followers count, ensuring it doesn't go below 0
        const updateReceiverSql = 'UPDATE projecttables SET FOLLOWERS = GREATEST(0, (CASE WHEN FOLLOWERS IS NULL THEN 0 ELSE FOLLOWERS END) - 1) WHERE ID = ?';
        db.query(updateReceiverSql, [receiver_id], (updateErr) => {
            if (updateErr) {
                console.error('[UNFOLLOW] Error updating receiver followers count:', updateErr.message, updateErr.sql);
            } else {
                console.log(`[UNFOLLOW] Receiver ${receiver_id} followers count updated.`);
            }
        });

        // Decrement sender's following count, ensuring it doesn't go below 0
        const updateSenderSql = 'UPDATE projecttables SET FOLLOWING = GREATEST(0, (CASE WHEN FOLLOWING IS NULL THEN 0 ELSE FOLLOWING END) - 1) WHERE ID = ?';
        db.query(updateSenderSql, [sender_id], (updateErr) => {
            if (updateErr) {
                console.error('[UNFOLLOW] Error updating sender following count:', updateErr.message, updateErr.sql);
            } else {
                console.log(`[UNFOLLOW] Sender ${sender_id} following count updated.`);
            }
            // Send response ONLY after both updates are attempted, or use Promise.all
            // For simplicity, we'll send it here, but be aware of async nature.
            return res.status(200).json({ message: 'Unfollowed successfully' });
        });
    });
});

app.get('/notifications', (req, res) => {
  const receiver_id = req.session.user?.id;
  if (!receiver_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const sql = `
    SELECT n.*, u.FULLNAME as sender_name, u.image AS sender_image
    FROM notifications n
    JOIN projecttables u ON u.id = n.sender_id
    WHERE n.receiver_id = ?
    ORDER BY n.created_at DESC
  `;

  db.query(sql, [receiver_id], (err, results) => {
    if (err) {
      console.error('Failed to fetch notifications:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// In your backend:
app.get('/check-follow/:userId', (req, res) => {
  const loggedInUserId = req.session.user?.id;
  const targetUserId = req.params.userId;

  if (!loggedInUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
  }

  if (parseInt(loggedInUserId) === parseInt(targetUserId)) {
      // A user cannot follow themselves, so this check should return false for self-profile
      return res.json({ success: true, isFollowing: false });
  }

  const sql = 'SELECT 1 FROM follows WHERE sender_id = ? AND receiver_id = ?';
  db.query(sql, [loggedInUserId, targetUserId], (err, results) => {
      if (err) {
          console.error('Error checking follow status:', err);
          return res.status(500).json({ error: 'Database error' });
      }
      // If results.length > 0, a record exists, meaning the user is following
      const isFollowing = results.length > 0;
      res.json({ success: true, isFollowing });
  });
});

// Add this new route to your backend file
app.post('/notifications/mark-as-read', (req, res) => {
    const userId = req.session.user?.id; // Get user ID from session

    if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

   
    const updateSql = 'UPDATE notifications SET is_read = TRUE WHERE receiver_id = ? AND is_read = FALSE';
    db.query(updateSql, [userId], (err, result) => {
        if (err) {
            console.error('Error marking notifications as read:', err);
            return res.status(500).json({ error: 'Failed to mark notifications as read' });
        }
        console.log(`User ${userId} notifications marked as read. Affected rows: ${result.affectedRows}`);
        res.status(200).json({ message: 'Notifications marked as read' });
    });

});

app.get('/notifications/unread/count', (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const sql = 'SELECT COUNT(*) AS unreadCount FROM notifications WHERE receiver_id = ? AND is_read = FALSE';

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching unread count:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ unreadCount: results[0].unreadCount });
  });
});


app.get('/messages', (req, res) => {
    const { senderId, receiverId } = req.query;
  
    // SQL query to get all messages between two users, ordered by timestamp.
    const sql = `
      SELECT id, sender_id, receiver_id, type, text, image_uri, created_at AS timestamp
      FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `;
  
    // Use senderId and receiverId as parameters to prevent SQL injection.
    db.query(sql, [senderId, receiverId, receiverId, senderId], (err, results) => {
      if (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ error: 'Failed to fetch historical messages.' });
      }
      // Return the fetched messages to the frontend.
      res.status(200).json(results);
    });
  });
  
  // --- Socket.IO Real-Time Communication ---
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected with ID: ${userId}`);
  
    if (userId) {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} assigned to socket ID: ${socket.id}`);
    }
  
    db.query(
      'INSERT INTO users_online (user_id, socket_id, is_online, last_seen) VALUES (?, ?, TRUE, NOW()) ON DUPLICATE KEY UPDATE socket_id = VALUES(socket_id), is_online = TRUE, last_seen = NOW()',
      [userId, socket.id]
    );
  
    io.emit('user_online', userId);
  
    // --- sendMessage with block check ---
    socket.on('sendMessage', (data, callback) => {
      const { senderId, receiverId, type, text, imageUri } = data;
  
      // 1️⃣ Check if either user blocked the other
      const checkBlockSQL = `
        SELECT 1 FROM blocked_users
        WHERE (blocker_id = ? AND blocked_id = ?)
           OR (blocker_id = ? AND blocked_id = ?)
      `;
      db.query(checkBlockSQL, [senderId, receiverId, receiverId, senderId], (err, results) => {
        if (err) return callback({ error: 'Database error' });
  
        if (results.length > 0) {
          return callback({ error: 'Cannot send message — user is blocked' });
        }
  
        // 2️⃣ Save message to DB
        const sql = 'INSERT INTO messages(sender_id, receiver_id, type, text, image_uri, is_read) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [senderId, receiverId, type, text, imageUri, false], (err, result) => {
          if (err) {
            console.error('Database error on message insertion:', err);
            return callback({ error: 'Database error: Message could not be saved.' });
          }
  
          if (callback) callback({ success: true, messageId: result.insertId });
  
          const newMessage = {
            id: result.insertId.toString(),
            senderId,
            receiverId,
            type,
            text,
            imageUri,
            timestamp: new Date().toISOString(),
            isRead: false,
          };
  
          // Send to receiver if online
          const receiverSocketId = connectedUsers.get(String(receiverId));
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
          }
        });
      });
    });
  
    // --- Block / Unblock events ---
    socket.on('blockUser', ({ blockedId }) => {
      const sql = 'INSERT INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)';
      db.query(sql, [userId, blockedId], (err) => {
        if (!err) {
          io.to(socket.id).emit('user_blocked', blockedId);
          const blockedSocketId = connectedUsers.get(String(blockedId));
          if (blockedSocketId) io.to(blockedSocketId).emit('blocked_by_user', userId);
        }
      });
    });
  
    socket.on('unblockUser', ({ blockedId }) => {
      const sql = 'DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?';
      db.query(sql, [userId, blockedId], (err) => {
        if (!err) {
          io.to(socket.id).emit('user_unblocked', blockedId);
          const unblockedSocketId = connectedUsers.get(String(blockedId));
          if (unblockedSocketId) io.to(unblockedSocketId).emit('unblocked_by_user', userId);
        }
      });
    });
  
    // --- Disconnect ---
    socket.on('disconnect', () => {
      db.query('UPDATE users_online SET is_online = FALSE, last_seen = NOW() WHERE socket_id = ?', [socket.id]);
  
      if (userId) {
        connectedUsers.delete(userId);
        console.log(`User disconnected: ${userId}`);
      }
    });
  });
  


app.get('/conversations', (req, res) => {
    const { userId } = req.query; // This is the ID of the user requesting their inbox

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    const sql = `
        SELECT
            p.ID AS other_user_id,
            p.FULLNAME AS other_user_name,
            p.image AS other_user_image_uri,
            last_message.text AS last_message_text,
            last_message.created_at AS last_message_timestamp,
            last_message.sender_id AS last_message_sender_id,
            COALESCE(unread_counts.count, 0) AS unread_count -- This is the new part
        FROM (
            SELECT
                IF(sender_id = ?, receiver_id, sender_id) AS other_person_id,
                MAX(created_at) AS last_message_time
            FROM messages
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY other_person_id
        ) AS latest_messages_per_conversation
        JOIN messages AS last_message ON (
            (last_message.sender_id = ? AND last_message.receiver_id = latest_messages_per_conversation.other_person_id)
            OR
            (last_message.receiver_id = ? AND last_message.sender_id = latest_messages_per_conversation.other_person_id)
        ) AND last_message.created_at = latest_messages_per_conversation.last_message_time
        JOIN projecttables AS p ON latest_messages_per_conversation.other_person_id = p.ID
        LEFT JOIN ( -- Join to get unread counts for each conversation
            SELECT
                sender_id AS other_person_id_for_unread,
                COUNT(*) AS count
            FROM messages
            WHERE receiver_id = ? AND is_read = FALSE
            GROUP BY sender_id
        ) AS unread_counts ON unread_counts.other_person_id_for_unread = latest_messages_per_conversation.other_person_id
        ORDER BY last_message_timestamp DESC;
    `;

    // Note: There are 6 parameters now due to the added LEFT JOIN subquery
    const params = [userId, userId, userId, userId, userId, userId];

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching conversations:', err);
            return res.status(500).json({ error: 'Failed to fetch conversations.' });
        }
        res.status(200).json(results);
    });
});


  
app.get('/following', (req, res) => {
    const sender_id = req.session.user?.id;

    if (!sender_id) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const sql = `
        SELECT 
            p.id, 
            p.FULLNAME, 
            p.username, 
            p.image, 
            f.created_at AS follow_date
        FROM follows f
        JOIN projecttables p ON f.receiver_id = p.id
        WHERE f.sender_id = ?
        ORDER BY f.created_at DESC
    `;

    db.query(sql, [sender_id], (err, results) => {
        if (err) {
            console.error('Error fetching following list:', err);
            return res.status(500).json({ error: 'Failed to fetch following list.' });
        }
        res.status(200).json(results);
    });
});

app.get('/followers', (req, res) => {
    const currentUserId = req.session.user?.id;
    if (!currentUserId) return res.status(401).json({ error: 'Not logged in' });
  
    const sql = `
      SELECT 
        p.id,
        p.FULLNAME,
        p.username,
        p.email,
        p.image,
        f.created_at AS follow_date,
        CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM follows 
            WHERE sender_id = ? AND receiver_id = p.id
          ) THEN 1 ELSE 0
        END AS isFollowing
      FROM follows f
      JOIN projecttables p ON f.sender_id = p.id
      WHERE f.receiver_id = ?
      ORDER BY f.created_at DESC
    `;
  
    db.query(sql, [currentUserId, currentUserId], (err, results) => {
      if (err) {
        console.error('Error fetching followers:', err);
        return res.status(500).json({ error: 'Failed to load followers.' });
      }
      res.status(200).json(results);
    });
  });
  app.get('/users/:userId/following', (req, res) => {
    const requestedUserId = req.params.userId;
    const currentUserId = req.session.user?.id;

    if (!currentUserId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const sql = `
        SELECT 
            p.id, 
            p.FULLNAME, 
            p.username, 
            p.image, 
            f.created_at AS follow_date,
            CASE 
                WHEN EXISTS (
                    SELECT 1 
                    FROM follows 
                    WHERE sender_id = ? AND receiver_id = p.id
                ) THEN 1 ELSE 0
            END AS isFollowing
        FROM follows f
        JOIN projecttables p ON f.receiver_id = p.id
        WHERE f.sender_id = ?
        ORDER BY f.created_at DESC
    `;

    db.query(sql, [currentUserId, requestedUserId], (err, results) => {
        if (err) {
            console.error('Error fetching user following list:', err);
            return res.status(500).json({ error: 'Failed to fetch following list.' });
        }
        res.status(200).json(results);
    });
});
app.get('/users/:userId/followers', (req, res) => {
    const requestedUserId = req.params.userId;
    const currentUserId = req.session.user?.id;

    if (!currentUserId) return res.status(401).json({ error: 'Not logged in' });

    const sql = `
      SELECT 
        p.id,
        p.FULLNAME,
        p.username,
        p.email,
        p.image,
        f.created_at AS follow_date,
        CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM follows 
            WHERE sender_id = ? AND receiver_id = p.id
          ) THEN 1 ELSE 0
        END AS isFollowing
      FROM follows f
      JOIN projecttables p ON f.sender_id = p.id
      WHERE f.receiver_id = ?
      ORDER BY f.created_at DESC
    `;
 
    db.query(sql, [currentUserId, requestedUserId], (err, results) => {
      if (err) {
        console.error('Error fetching user followers:', err);
        return res.status(500).json({ error: 'Failed to load followers.' });
      }
      res.status(200).json(results);
    });
});
  // New API endpoint to mark messages in a specific conversation as read
app.post('/messages/mark-as-read', (req, res) => {
    const { senderId, receiverId } = req.body; // senderId here is the person the logged-in user is chatting WITH
  
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Sender ID and Receiver ID are required.' });
    }
  
    // Update messages where the logged-in user is the receiver and messages are from the specific sender
    const updateSql = `
      UPDATE messages
      SET is_read = TRUE
      WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE;
    `;
  
    db.query(updateSql, [receiverId, senderId], (err, updateResult) => {
      if (err) {
        console.error('Error marking messages as read:', err);
        return res.status(500).json({ error: 'Failed to mark messages as read.' });
      }
      console.log(`Marked ${updateResult.affectedRows} messages as read for receiver ${receiverId} from sender ${senderId}.`);
  
      // After updating, fetch the *total* unread count for the receiver
      const countSql = `
        SELECT COUNT(*) AS unreadCount
        FROM messages
        WHERE receiver_id = ? AND is_read = FALSE;
      `;
      db.query(countSql, [receiverId], (countErr, countResult) => {
        if (countErr) {
          console.error('Error fetching new unread count:', countErr);
          return res.status(500).json({ error: 'Failed to fetch new unread count.' });
        }
  
        const newUnreadCount = countResult[0].unreadCount;
        res.status(200).json({ message: 'Messages marked as read', newUnreadCount });
      });
    });
  });
  
  // New API endpoint to get the initial total unread count for a user
  app.get('/unread-messages-count', (req, res) => {
    const { userId } = req.query;
  
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }
  
    const sql = `
      SELECT COUNT(*) AS count
      FROM messages
      WHERE receiver_id = ? AND is_read = FALSE;
    `;
  
    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching unread messages count:', err);
        return res.status(500).json({ error: 'Failed to fetch unread messages count.' });
      }
      res.status(200).json({ count: results[0].count });
    });
  });

  app.delete('/messages/:id', async (req, res) => {
    const { id } = req.params;
    const sqlvalue = 'DELETE FROM messages WHERE id = ?';
  
    db.query(sqlvalue, [id], (err) => {
      if (err) {
        console.error('Error deleting message:', err);
        return res.status(500).json({ error: 'Failed to delete message' });
      }
  
      // ✅ Only emit after a successful delete
      io.emit('message_deleted', id);
  
      res.json({ success: true });
    });
  });
  
  // Block a user
app.post('/block/:blockedId', (req, res) => {
    const blockerId = req.session.user?.id;
    const blockedId = req.params.blockedId;
  
    if (!blockerId) return res.status(401).json({ error: 'Not logged in' });
  
    const sql = 'INSERT INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)';
    db.query(sql, [blockerId, blockedId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to block user' });
  
      // Notify both clients in real-time
      io.to(`user_${blockerId}`).emit('user_blocked', blockedId);
      io.to(`user_${blockedId}`).emit('blocked_by_user', blockerId);
  
      res.json({ success: true });
    });
  });
  app.get('/isBlocked/:userId', (req, res) => {
    const myId = req.session.user?.id;
    const userId = req.params.userId;
    if (!myId) return res.status(401).json({ error: 'Not logged in' });
  
    const sql = `
      SELECT * FROM blocked_users 
      WHERE (blocker_id = ? AND blocked_id = ?) 
         OR (blocker_id = ? AND blocked_id = ?) 
      LIMIT 1
    `;
    db.query(sql, [myId, userId, userId, myId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch status' });
      res.json({ blocked: results.length > 0 });
    });
  });
  
  
  // Unblock a user
  app.delete('/block/:blockedId', (req, res) => {
    const blockerId = req.session.user?.id;
    const blockedId = req.params.blockedId;
  
    const sql = 'DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?';
    db.query(sql, [blockerId, blockedId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to unblock user' });
  
      // Notify both clients
      io.to(`user_${blockerId}`).emit('user_unblocked', blockedId);
      io.to(`user_${blockedId}`).emit('unblocked_by_user', blockerId);
  
      res.json({ success: true });
    });
  });
  app.post('/Createmeet', (req, res) => {
    const host_id = req.session.user?.id;
    const {
      title,
      vibe,
      location,
      size,
      description,
      selectedYear,
      selectedMonth,
      selectedDay,
      selectedHour,
      selectedMinute,
      meetupcodeval,
    } = req.body;
  
    const isaccepted = 0;
  
    const sql = `
      INSERT INTO meetups (
        host_id, title, vibe, location, size, description, isaccepted,
        year, month, day, hour, minute,roomvalue
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;
  
    db.query(
      sql,
      [
        host_id,
        title,
        vibe,
        location,
        size,
        description,
        isaccepted,
        selectedYear,
        selectedMonth,
        selectedDay,
        selectedHour,
        selectedMinute,
        meetupcodeval,
      ],
      (err, result) => {
        if (err) {
          console.error('Error inserting meetup:', err);
          return res.status(500).json({ error: 'Database error', details: err });
        }
        res
          .status(201)
          .json({ message: 'Meetup created successfully', id: result.insertId });
      }
    );
  });
  
  app.get('/Createmeet', (req, res) => {
    const sql = 'SELECT * FROM meetups ORDER BY created_at DESC';
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching meetups:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results); // send all meetups as JSON
    });
  });
  app.get('/meetupusers',(req,res)=>{
    const sql='SELECT * FROM meetup_participants ';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching meetups users:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results); // send all meetups as JSON
    });
  })
  app.post('/joinRequest', (req, res) => {
    const senderId = req.session.user?.id;
    const { meetupId } = req.body;
  
    if (!senderId) return res.status(401).json({ error: 'Not logged in' });
    if (!meetupId) return res.status(400).json({ error: 'meetupId required' });
  
    // Step 1: get sender info,
    const userSql = 'SELECT image, FULLNAME FROM projecttables WHERE ID=?';
    db.query(userSql, [senderId], (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (results.length === 0) return res.status(404).json({ error: 'User not found' });
  
      const senderName = results[0].FULLNAME;
      const senderImage = results[0].image;
  
      // Step 2: get meetup host
      db.query('SELECT host_id, title FROM meetups WHERE id = ?', [meetupId], (err2, rows) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (rows.length === 0) return res.status(404).json({ error: 'Meetup not found' });
  
        const hostId = rows[0].host_id;
  
        // Step 3: prevent duplicate requests
        db.query('SELECT id FROM join_requests WHERE meetup_id = ? AND sender_id = ?', [meetupId, senderId], (err3, exists) => {
          if (err3) return res.status(500).json({ error: 'DB error' });
          if (exists.length) return res.status(409).json({ error: 'Already requested' });
  
          // Step 4: insert join request
          db.query('INSERT INTO join_requests (meetup_id, sender_id) VALUES (?, ?)', [meetupId, senderId], (err4, result) => {
            if (err4) return res.status(500).json({ error: 'Failed to create request' });
  
            const message = `${senderName} wants to join your meetup "${rows[0].title}"`;
  
            // Step 5: insert notification
            db.query(
              'INSERT INTO notifications (sender_id, receiver_id, message, type) VALUES (?, ?, ?, ?)',
              [senderId, hostId, message, 'JoinRoom'],
              (notifErr) => {
                if (notifErr) console.error('Notification insert failed:', notifErr);
  
                // Respond with useful info
                res.json({
                  success: true,
                  message: 'Join request sent successfully',
                  notification: {
                    sender_id: senderId,
                    receiver_id: hostId,
                    sender_name: senderName,
                    sender_image: senderImage,
                    text: message,
                    type: 'JoinRoom'
                  }
                });

                const Sendnotifi = connectedUsers.get(String(hostId));
if (Sendnotifi) {
  io.to(Sendnotifi).emit("newNotification", {
    text: message,
    sender_id: senderId,
    meetup_id: meetupId
  });
}

              }
            );
          });
        });
      });
    });
  });
  
  
  


  app.post('/acceptJoinRequest', (req, res) => {

    const hostId = req.session.user?.id;
    const { requestId } = req.body;
  
    if (!hostId) return res.status(401).json({ error: 'Not logged in' });
    if (!requestId) return res.status(400).json({ error: 'requestId required' });
  
    // Ensure request exists and that the logged-in user is the meetup host
    const getSql = `
      SELECT jr.id, jr.meetup_id, jr.sender_id, m.host_id
      FROM join_requests jr
      JOIN meetups m ON m.id = jr.meetup_id
      WHERE jr.sender_id = ?
    `;
    db.query(getSql, [requestId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });
  
      const row = rows[0];
      if (row.host_id !== hostId) return res.status(403).json({ error: 'Not authorized' });
  
      // update request status
      db.query('UPDATE join_requests SET status = ?, responded_at = NOW() WHERE id = ?', ['accepted', row.id], (err2) => {
        if (err2) return res.status(500).json({ error: 'Failed to update request' });
  
        // optionally add to participants
        db.query('INSERT IGNORE INTO meetup_participants (meetup_id, user_id) VALUES (?, ?)', [row.meetup_id, row.sender_id], (err3) => {
          if (err3) console.error('Failed to add participant:', err3);
  
          // notify the requester their request was accepted
          const notifMsg = `Your request to join meetup "${row.meetup_id}" was accepted`;
          db.query('INSERT INTO notifications (sender_id, receiver_id, message, type) VALUES (?, ?, ?, ?)', [hostId, row.sender_id, notifMsg, 'JoinAccepted'], (notifErr) => {
            // ignore notifErr or handle
            res.json({ success: true, message: 'Request accepted' });
            const acceptvalue=connectedUsers.get(String(requestId))
            if(acceptvalue){
              io.to(acceptvalue).emit("newNotification", {
                text: notifMsg,
                sender_id: requestId,
                meetup_id: hostId
              });
            }
          });
        });
      });
    });
  });
  
  app.get('/accepted', (req, res) => {
    const { meetupId } = req.query;
    const userId = req.session.user?.id;
  
    if (!userId) return res.status(401).json({ error: 'Not logged in' });
    if (!meetupId) return res.status(400).json({ error: 'meetupId required' });
  
    const sql = `
      SELECT status 
      FROM join_requests 
      WHERE sender_id=? AND meetup_id=? 
      ORDER BY responded_at DESC 
      LIMIT 1
    `;
    db.query(sql, [userId, meetupId], (err, results) => {
      if (err) return res.status(500).json({ error: 'An error occurred with the database' });
      if (results.length === 0) return res.status(404).json({ error: 'No request found' });
  
      res.json(results[0]); // returns { status: "accepted" }
    });
  });
  

 
  app.get('/meetupsmembers', (req, res) => {
    const { meetupid } = req.query;
  
    const sqlmeet = `
    SELECT 
    m.id AS meetupid,
    m.title AS meetuptitle,
    hostuser.FULLNAME AS meetupname,
hostuser.image AS meetupimage,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'senduserid', senduser.ID,
        'sendusername', senduser.FULLNAME,
        'senduserimage', senduser.image
      )
    ) AS attendees
FROM meetups m
JOIN projecttables hostuser ON m.host_id = hostuser.ID
LEFT JOIN meetup_participants mu ON mu.meetup_id = m.id
LEFT JOIN projecttables senduser ON mu.user_id = senduser.ID
WHERE m.id = ?
GROUP BY m.id, m.title, hostuser.FULLNAME, hostuser.image;

    `;
  
    db.query(sqlmeet, [meetupid], (err, results) => {
      if (err) {
        return res.status(500).json({ error: `A database error occurred ${err}` });
      }
      res.json({ results });
    });
  });
  
app.get('/meetupchat',(req,res)=>{
  const {meetupId}=req.query;
  const sql='SELECT * FROM meetups WHERE id=?'
   db.query(sql,[meetupId],(err,result)=>{
    if(err){
      console.error(err)
      res.status(500).json({Error:'An error occured'})
    }
    if(result.length===0){
      return res.status(400).json({message:'No meetups found'})
    }
    res.json(result[0]);
   })
})
app.get('/searchmeetupusers', (req, res) => {
  const { searchkey } = req.query;
  if (!searchkey || searchkey.trim() === '') {
    return res.json([]); // return empty array, not all meetups
  }

  const searchquery = `%${searchkey}%`;
  const sql = 'SELECT * FROM meetups WHERE title LIKE ? ORDER BY created_at DESC LIMIT 5';

  db.query(sql, [searchquery], (err, result) => {
    if (err) {
      return res.status(500).json({ error: `An error occurred: ${err.message}` });
    }
    res.json(result);
  });
});

    app.post('/api/submit-answers', (req, res) => {
    // Extract the userId and answers object from the request body.
    const { userId, answers } = req.body;

    if (!userId || !answers || Object.keys(answers).length === 0) {
        return res.status(400).json({ error: 'Invalid data provided.' });
    }

    // Step 1: Delete all previous answers for this user
    const deleteSql = `
        DELETE FROM user_answers
        WHERE user_id = ?
    `;
    
    db.query(deleteSql, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting old answers:', err);
            return res.status(500).json({ error: 'Database error on delete' });
        }

        // Step 2: Prepare a multi-row INSERT query for all new answers
        // We'll dynamically build the query and the values array.
        const values = [];
        const placeholders = [];

        for (const questionId in answers) {
            const answer = answers[questionId];
            if (answer) {
                // Add values for each row: [userId, questionId, answer]
                values.push(userId, parseInt(questionId), answer);
                // Create a placeholder string for each row: (?, ?, ?)
                placeholders.push('(?, ?, ?)');
            }
        }
        
        // Join the placeholders to create the final SQL string.
        const insertSql = `
            INSERT INTO user_answers (user_id, question_id, answer)
            VALUES ${placeholders.join(', ')}
        `;

        // Execute the multi-row insert query
        db.query(insertSql, values, (err, result) => {
            if (err) {
                console.error('Error inserting new answers:', err);
                return res.status(500).json({ error: 'Database error on insert' });
            }
            
            res.status(201).json({ 
                message: 'Answers submitted successfully!', 
                affectedRows: result.affectedRows 
            });
        });
    });
});
app.get('/api/matches',(req,res)=>{
  const {userId}=req.query;
  const sql = `
  WITH shared_all AS (
    SELECT
      a1.user_id AS base_user,
      a2.user_id AS other_user,
      a1.question_id
      from user_answers a1
    JOIN user_answers a2
      ON a1.question_id = a2.question_id
     AND a1.answer = a2.answer
     AND a1.user_id <> a2.user_id
     LEFT JOIN skipped_users su ON
     su.skipper_id=a1.user_id AND
     su.skipped_id=a2.user_id
    WHERE a1.user_id = ? and su.id is null
  ),
  
  similarity AS (
    SELECT
      other_user,
      COUNT(*) / 20 * 100 AS similarity_percent
    FROM shared_all 
    GROUP BY other_user
  ),
  
  shared_first_10 AS (
    SELECT
      a2.user_id AS other_user,
      a1.answer,
      ROW_NUMBER() OVER (
        PARTITION BY a2.user_id
        ORDER BY rand()
      ) AS rn
    FROM user_answers a1
    JOIN user_answers a2
      ON a1.question_id = a2.question_id
     AND a1.answer = a2.answer
     AND a1.user_id <> a2.user_id
    WHERE a1.user_id = ?
      AND a1.question_id <= 10
  ),
  
  picked_two AS (
    SELECT *
    FROM shared_first_10
    WHERE rn <= 4
  )
  
  SELECT
    s.other_user,
    s.similarity_percent,
    c.FULLNAME as thename,
      c.image as theimage,
    MAX(CASE WHEN p.rn = 1 THEN p.answer END) AS shared_answer_1,
    MAX(CASE WHEN p.rn = 2 THEN p.answer END) AS shared_answer_2,
    MAX(CASE WHEN p.rn = 3 THEN p.answer END) AS shared_answer_3,
    MAX(CASE WHEN p.rn = 4 THEN p.answer END) AS shared_answer_4
  FROM similarity s 
  LEFT JOIN projecttables c ON s.other_user=c.ID
  LEFT JOIN picked_two p
    ON s.other_user = p.other_user
  GROUP BY
    s.other_user,
    s.similarity_percent
  ORDER BY s.similarity_percent DESC
  LIMIT 100;
  
    `;
    db.query(sql,[userId,userId],(err,result)=>{
      if(err){
        res.status(500).json({error:'An error occured'})
      }
      res.json(result)
    })
})


app.post('/postscorevalue', (req, res) => {
  const { username, score } = req.body;

  const findUserSql = 'SELECT ID FROM projecttables WHERE USERNAME = ?';
  db.query(findUserSql, [username], (err, userResult) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (userResult.length === 0) return res.status(404).json({ error: 'User not found' });

    const userId = userResult[0].ID;

    const upsertScoreSql = `
      INSERT INTO user_scores (user_id, score) 
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE score = VALUES(score)
    `;

    db.query(upsertScoreSql, [userId, score], (upsertErr) => {
      if (upsertErr) return res.status(500).json({ error: 'Database error' });

      // ✅ after saving, fetch updated leaderboard
      const sql = `
        SELECT 
            p.USERNAME AS name, 
            s.score 
        FROM 
            user_scores s
        JOIN 
            projecttables p ON s.user_id = p.ID
        ORDER BY 
            s.score DESC
      `;

      db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        // ✅ broadcast leaderboard to all sockets
        io.emit("leaderboardUpdate", results);

        res.status(200).json({ message: 'Score posted successfully' });
      });
    });
  });
});
 
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // send initial leaderboard when a client connects
  const sql = `
    SELECT 
        p.USERNAME AS name, 
        s.score 
    FROM 
        user_scores s
    JOIN 
        projecttables p ON s.user_id = p.ID
    ORDER BY 
        s.score DESC
  `;
  db.query(sql, (err, results) => {
    if (!err) {
      socket.emit("leaderboardUpdate", results);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


app.post('/newAnonroom', (req, res) => {
  const { roomName, tags, duration, selectedHour,selectedMinute, roomRandomCode } = req.body;
  
  // The VALUES list should match the number of placeholders
  const inputSql = 'INSERT INTO newAnongroup(roomName, tags, roomRandomCode, hour, minute) VALUES(?, ?, ?, ?, ?)';

  // The array of values should match the placeholders
  db.query(inputSql, [roomName, tags, roomRandomCode,selectedHour,selectedMinute,], (error, value) => {
    if (error) {
      console.error('Error upserting score:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log(value);
    // You should send the roomRandomCode back to the client here
    res.status(200).json({ message: 'Room created', roomCode: roomRandomCode });
  });
});
app.get('/getanonroom/:roomcode',(req,res)=>{
  const sql='SELECT id ,roomName,roomRandomCode , duration  FROM newAnongroup WHERE roomRandomCode=?  ';
db.query(sql,[req.params.roomcode],(err,result)=>{
  if(err){
    console.log(`${err} Detected`);
  }
  if(result.length===0){
    return res.status(404).json({
      error:'Room not found '
    })
  }
  res.json(result[0]);
})
})


io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // This listener for a socket's disconnection MUST be inside the connection block.
  socket.on('disconnecting', () => {
    socket.rooms.forEach(roomCode => {
      if (roomCode !== socket.id) {
        if (activeAnonymousRooms.has(roomCode)) {
          activeAnonymousRooms.get(roomCode).members.delete(socket.id);
          io.to(roomCode).emit('userLeft', `${socket.id} has left the chat.`);
          if (activeAnonymousRooms.get(roomCode).members.size === 0) {
            activeAnonymousRooms.delete(roomCode);
            console.log(`Room ${roomCode} is now empty and has been deleted.`);
          }
        }
      }
    });
    console.log(`Socket disconnected: ${socket.id}`);
  });
  
  socket.on('joinRoom', (roomCode) => {
    if (!activeAnonymousRooms.has(roomCode)) {
      activeAnonymousRooms.set(roomCode, {
        members: new Set()
      });
      console.log(`Created new room: ${roomCode}`); // Corrected variable
    }

    socket.join(roomCode);
    activeAnonymousRooms.get(roomCode).members.add(socket.id); // Corrected variable
    console.log(`User ${socket.id} joined room: ${roomCode}`);

    io.to(roomCode).emit('userJoined', `${socket.id} has joined the chat.`);
  });

  socket.on('sendMessages', (data) => {
    const { roomCode, text, senderId } = data;
    // console.log(`Message received for room ${roomCode}: ${text}`);

    if (activeAnonymousRooms.has(roomCode)) {
      io.to(roomCode).emit('newMessages', {
        id: Date.now().toString(),
        text: text,
        senderId: senderId,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  
});

io.on("connection", (socket) => {
  // console.log(`User connected: ${socket.id}`);

  // 🟢 Join a meetup room
  socket.on("JoinMeet", (roomPass) => {
    if (!MeetupRoomUsers.has(roomPass)) {
      MeetupRoomUsers.set(roomPass, { members: new Set() });
    }

    socket.join(roomPass);
    MeetupRoomUsers.get(roomPass).members.add(socket.id);

    io.to(roomPass).emit("UserIn", `${socket.id} has joined the chat.`);
    // console.log(`${socket.id} joined room ${roomPass}`);
  });

  // 💬 Receive and broadcast messages
  socket.on("Getmessage", (data) => {
    const { id, senderId, sendername,type, text, roomPass , timeStamp} = data;
    
    if (!roomPass || !MeetupRoomUsers.has(roomPass)) return;

    const message = {
      id,
      senderId,
      sendername,
      type,
      text,
      roomPass,
      timeStamp,
    };
    const sql='INSERT INTO meetupmessages(senderid,sendername,typeofmessage,textmessage,roompass,timevalue) VALUES(?,?,?,?,?,?)'
    db.query(sql, [senderId, sendername, type, text, roomPass, timeStamp], (err, results) => {
      if (err) {
        console.error("❌ Database insert error:", err);
      return;
      } 
      const idvalue=results.insertId;
      const updatedmessage={
        id:idvalue,...message
      }
      io.to(roomPass).emit("NewMessage", updatedmessage);
    });
   
    // Broadcast to everyone in that room
    
    // console.log(`Message from ${senderId} in ${roomPass}: ${text}`);
  });

  // 🔴 Handle disconnect
  socket.on("disconnect", () => {
    for (const [roomPass, room] of MeetupRoomUsers.entries()) {
      if (room.members.has(socket.id)) {
        room.members.delete(socket.id);
        io.to(roomPass).emit("userLeft", `${socket.id} has left the chat.`);

        if (room.members.size === 0) {
          MeetupRoomUsers.delete(roomPass);
          // console.log(`Room ${roomPass} deleted (empty).`);
        }
      }
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.post('/api/upload',
upload.single('image'),(req,res)=>{
  if(!req.file){
    return res.status(400).json({message:'No file uploaded'})
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  // console.log(imageUrl);
  res.json({ imageUrl })
}
)

app.get('/groupmessages',(req,res)=>{
  const {roomvaue}=req.query;
  const sql=`SELECT * FROM meetupmessages WHERE roompass=? ORDER BY ID ASC`;
  db.query(sql,[roomvaue],(err,result)=>{
if(err){
  return res.status(500).json({error:'A database error occured'})
}
return res.json(result)
  })
})
app.get('/pulsedata', (req, res) => {
  const sql = 'SELECT * FROM campulsepulse'; // change 'id' as needed
  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'An error occurred' });
    }
    return res.json( result );
  });
});

app.post('/poststories', (req, res) => {
  const { title, myUserName, content, image, myUserId } = req.body;
  const sql = 'INSERT INTO campulsepulse (title, author, post, image, user) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [title, myUserName, content, image, myUserId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: `An error occurred: ${err.message}` });
    }
    return res.status(200).json({ message: 'Successful' });
  });
});

app.get('/getstoryuser', (req, res) => {
  const { StoryID} = req.query;
  const mysql='SELECT * FROM campulsepulse WHERE ID=? ';

  db.query(mysql, [StoryID], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'An error occurred' });
    }
    return res.json(result);
  });
});

io.on("connection", (socket) => {
  // console.log("🟢 User connected:", socket.id);

  // 🧠 Fetch all answers initially
  db.query("SELECT * FROM questionanswers ORDER BY ID DESC", (err, results) => {
    if (!err) {
      socket.emit("Questionget", results); // send all existing answers to new client
    }
  });

  // 📝 When a client posts a new answer
  socket.on("SendAnswers", (data) => {
    const { username, answer } = data;
    if (!username || !answer) return;

    // Insert into database
    const sql = "INSERT INTO questionanswers (author, answer) VALUES (?, ?)";
    db.query(sql, [username, answer], (err, result) => {
      if (err) {
        console.error("❌ Error inserting answer:", err);
        return;
      }

      const newAnswer = {
        ID: result.insertId,
        author: username,
        answer,
      };

      // console.log("✅ New answer saved:", newAnswer);

      // 🟢 Emit to all connected clients
      io.emit("Questionget", newAnswer);
    });
  });

  // 🔴 When a client disconnects
  socket.on("disconnect", () => {
    // console.log("🔴 User disconnected:", socket.id);
  });
});

app.post('/createinterestroom', (req, res) => {
  const { roomname, description,  roompasskey ,selectmode, selecttype,myUserId} = req.body;
  console.log("📥 Incoming data:", req.body); // <--- Add this line

  const sql = 'INSERT INTO createinterestroom (roomname, roomdescription, roompasskey,selectmode, selecttype,creatorid) VALUES (?, ?, ?, ?,?,?)';
  
  db.query(sql, [roomname, description,  roompasskey,selectmode, selecttype,myUserId], (err, result) => {
    if (err) {
      console.error("❌ DB Error:", err.message);
      return res.status(500).json({ error: 'An error occurred', details: err.message });
    }
    console.log("✅ Insert successful:", result);
    res.status(200).json({ message: 'It was successful' });
  });
});

app.get('/searchinterestroom',(req,res)=>{
  const {search}=req.query;
  const searchedit=`%${search}%`
  const sql='SELECT cr.*, COUNT(m.userroomid) AS members_count FROM createinterestroom AS cr LEFT JOIN roommembers AS m ON m.userroomid = cr.id WHERE cr.roomname LIKE ? GROUP BY cr.id;';
  db.query(sql,[searchedit],(err,result)=>{
    if(err){
      return res.status(500).json({error:err.message})
    }
    res.json(result)
  })
})
app.get('/getactiverooms',(req,res)=>{
  const sql=`select cr.id,cr.roomname,cr.roomdescription,cr.roompasskey,cr.selectmode,
   cr.selecttype,cr.creatorid, count(a.roomid) as members_count from createinterestroom cr 
   left join roomparticipants a on cr.id=a.roomid   group by cr.id,cr.roomname,
   cr.roomdescription,cr.roompasskey,
  cr.selectmode, cr.selecttype,cr.creatorid order by  coalesce(members_count,0) desc limit 6 ; `
    db.query(sql,(err,result)=>{
      if(err){
        return res.status(500).json({error:'An error occured'})
      }
      res.json(result)
    })
})
app.post('/postroommembers', (req, res) => {
  const { roomid, userid } = req.body;

  if (!roomid || !userid) {
    return res.status(400).json({ error: 'Missing roomid or userid' });
  }

  const sql =
    'INSERT IGNORE INTO roomparticipants(userid, roomid, isAdmin) VALUES (?, ?, ?)';

  db.query(sql, [userid, roomid, 0], (err, result) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }

    res.status(200).json({
      success: true,
      joined: result.affectedRows === 1,
    });
  });
});

app.get('/checkroommembers',(req,res)=>{
  const {userid,room_id}=req.query;

  const sql=`select * from roomparticipants where userid=? and roomid=?`
  db.query(sql,[userid,room_id],(err,result)=>{
    if(err){
      return res.status(500).json({error:'An error occured'})
    }
    res.json(result.length ? result[0] : null);

  })
})

app.get('/getjoinroom',(req,res)=>{
  const {yourid}=req.query;
  const sql=`select cr.id,cr.roomname,cr.roomdescription,cr.roompasskey,cr.selectmode,
  cr.selecttype,cr.creatorid, count(a.roomid) as members_count from createinterestroom cr 
  left join roomparticipants a on cr.id=a.roomid where a.userid=?  group by cr.id,cr.roomname,
  cr.roomdescription,cr.roompasskey,
 cr.selectmode, cr.selecttype,cr.creatorid  order by  coalesce(members_count,0) desc  limit 6   ;`;
  db.query(sql,[yourid],(err,result)=>{
    if(err){
      console.log(err.message);
    }
    res.json(result)
  })
})

app.get('/getpitches',(req,res)=>{
  const sql='SELECT * FROM pitches ORDER BY timeposted DESC';
db.query(sql,(err,result)=>{
  if(err){
  return  res.status(500).json({error:err.message})
  }
  res.json(result)
})
})
app.post('/postpitches',(req,res)=>{
  const { writepitch,title,username}=req.body;
  if (!title || !writepitch || !username) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  const sql='INSERT INTO pitches(pitch_title,pitch_description,pitch_creator) VALUES(?,?,?)' ;
  db.query(sql,[title,writepitch,username],(err,result)=>{
if(err){
 return res.status(500).json({error:err.message})
}
 return res.status(200).json({success:true, message:'Posted succesfully'})
  })

})
app.get('/searchpitchval',(req,res)=>{
  const {search}=req.query;
  const searched=`%${search}%`
  const sql='SELECT * FROM pitches WHERE pitch_title LIKE? LIMIT 5 '
  db.query(sql,[searched],(err,result)=>{
    if(err){
     return res.status(500).json({error:err.message})
    }
    res.json(result)
  })
})

app.get('/fetchuserpitch',(req,res)=>{
  const {pitch}=req.query;
  const sql='SELECT * FROM pitches WHERE ID=?';
  db.query(sql,[pitch],(err,result)=>{
if(err){
return  res.status(500).json({error:err.message})
}
res.json(result)
  })
})
io.on('connection',(socket)=>{
  const { userId } = socket.handshake.query;
  socket.on('joinPitch', (pitchId) => {
    socket.join(pitchId);
  });

  socket.on('SendComment', (data) => {
    const { username, comment, pitchuser } = data;
    if (!username || !comment || !pitchuser) return;
    const sql = 'INSERT INTO pitchcomment (users_name,comment_text,pitchid) VALUES(?,?,?)';
    db.query(sql, [username, comment, pitchuser], (err, result) => {
      if (err) return console.log(err);
      const commentformat = {
        id: result.insertId,
        user: username,
        commenttext: comment,
        pitchid: pitchuser,
      };
      io.to(pitchuser).emit('comment', commentformat);
    });
  });
  

  
socket.on('disconnect',()=>{
  // console.log('Disconnectd');
})
})

app.get('/fetchpitchcomment',(req,res)=>{
  const {pitch}=req.query;
  const sql='select * from pitchcomment where pitchid=?';
  db.query(sql,[pitch],(err,result)=>{
    if(err){
    return  res.status(500).json({error:err.message})
    }
    res.json(result)
  })
})

io.on('connection',(socket)=>{
  socket.on('Joinroom',(searchid)=>{
    socket.join(searchid)
  })
  socket.on('SendImage',(data)=>{
    const {image,userI}=data;
    io.to(userI).emit('Resend',image)
  })
  socket.on('disconnect',()=>{
    // console.log('User disconnected');
  })
})
app.post('/postnewtextval',(req,res)=>{
  const {searchid,
    posttext,
    uploadedImageUrl,
    finalvideo,roomid}=req.body;
  const sql='insert into roomposts(sender_id,post,post_image,posted_at,room_of_posts_id,postvideo) values(?,?,?,?,?,?)';
  db.query(sql,[searchid,posttext,uploadedImageUrl,curdate(),roomid,finalvideo],(err,result)=>{
    if(err){
      return res.status(500).json({error:err.message});
    }
    res.status(200).json({success:true})
  })
});

app.post('/api/videoupload',upload.single('video'),(req,res)=>{
  if(!req.file){
return res.status(400).json({message:'No file uploaded'})
  }
  const VideoUrl=`/uploads/${req.file.filename}`;
  res.json({VideoUrl})
})


app.post('/postshowcases',(req,res)=>{
  const {title,pickercategory,sendvideo,userId,describe}=req.body;
  const sql='INSERT INTO showcases(sender_id,caption,video,showcase_category)VALUES(?,?,?,?)';
  db.query(sql,[userId,describe,sendvideo,pickercategory],(err,result)=>{
if(err){
 return res.status(500).json({error:`An error occured-${err.message}`})
}
res.status(200).json({success:true, message:'Posted Succesfully'})
  })
})
app.get('/gettingvideo',(req,res)=>{
  const {userId}=req.query;
  const sql=`WITH base AS (
    SELECT 
        cr.id,
        cr.sender_id,
        cr.caption,
        cr.video,
        cr.time_joined,
        cr.showcase_category,
        cr.likes,
        MAX(a.username) AS username,
        MAX(a.image) AS userimage,
        COUNT(v.actaul_comment) AS comment_count,
        COALESCE(MAX(sa.score), 0) AS affinity_score,

        CASE
            WHEN MAX(sa.score) >= 20 THEN 'affinity'
            WHEN MAX(sa.score) > 0 THEN 'recent'
            ELSE 'random'
        END AS bucket

    FROM showcases cr
    LEFT JOIN showcase_affinity sa
        ON sa.creator_id = cr.sender_id
       AND sa.viewerid = ?
    LEFT JOIN battlearenacomment v
        ON v.videoid = cr.id
    LEFT JOIN projecttables a
        ON a.ID = cr.sender_id
    LEFT JOIN showcase_hide seen
        ON seen.video_id = cr.id
       AND seen.user_id = ?
    WHERE seen.video_id IS NULL
    GROUP BY cr.id, cr.sender_id, cr.caption, cr.video, cr.time_joined, cr.showcase_category, cr.likes
),

ranked AS (
    SELECT *,
        ROW_NUMBER() OVER (
            PARTITION BY bucket
            ORDER BY
                CASE
                    WHEN bucket = 'affinity' THEN affinity_score
                    WHEN bucket = 'recent' THEN time_joined
                    ELSE RAND()
                END DESC
        ) AS bucket_rank
    FROM base
),

interleaved AS (
    SELECT *,
        ROW_NUMBER() OVER (
            ORDER BY
                CASE bucket
                    WHEN 'affinity' THEN 1
                    WHEN 'recent' THEN 2
                    ELSE 3
                END,
                bucket_rank
        ) AS global_rank
    FROM ranked
)

SELECT
    id,
    sender_id,
    caption,
    video,
    time_joined,
    showcase_category,
    likes,
    username,
    userimage,
    comment_count,
    affinity_score
FROM interleaved
ORDER BY
    (global_rank % 3),   -- shuffle pattern
    global_rank
LIMIT 100;

  `;
  db.query(sql,[userId,userId],(err,result)=>{
if(err){
  return res.status(500).json({error:message})
}
res.json(result)
  })
});
app.get('/trending',(req,res)=>{
 
  const sql=`select cr.id,cr.sender_id,cr.caption,cr.video,cr.time_joined,cr.showcase_category,cr.likes,a.username,a.image as userimage,
  count(v.actaul_comment) as comment_count from showcases cr left join battlearenacomment v on cr.id=v.videoid left join projecttables a 
  on a .ID=cr.sender_id where cr.time_joined>=now()-interval 1 week group by cr.id,cr.sender_id,cr.caption,cr.video,cr.time_joined,cr.showcase_category,cr.likes,a.username,a.image
  order by cr.likes desc limit 3;`;
  db.query(sql,(err,resultvalue)=>{
    if(err){
return res.status(500).json({err:`this error occured ${err}`})
    }
    res.json(resultvalue)
  })
})

app.post('/postlikesincrease', (req, res) => {
  const { postId, userValue, posteruser } = req.body;

  // 1. Check if already liked
  const checkLikeSql =
    'SELECT * FROM showcase_likes WHERE liker_id=? AND video_id=?';

  db.query(checkLikeSql, [userValue, postId], (err, liked) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (liked.length > 0) {
      return res.status(400).json({ error: 'Already liked' });
    }

    // 2. Increase likes
    const updateLikeSql =
      'UPDATE showcases SET likes=likes+1 WHERE id=?';

    db.query(updateLikeSql, [postId], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // 3. Insert into likes table
      const insertLikeSql =
        'INSERT INTO showcase_likes(liker_id, video_id) VALUES(?,?)';

      db.query(insertLikeSql, [userValue, postId], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // 4. Affinity logic
        const affinityCheckSql =
          'SELECT * FROM showcase_affinity WHERE viewerid=? AND creator_id=?';

        db.query(affinityCheckSql, [userValue, posteruser], (err, affinity) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          if (affinity.length > 0) {
            db.query(
              'UPDATE showcase_affinity SET score=score+5 WHERE viewerid=? AND creator_id=?',
              [userValue, posteruser]
            );
          } else {
            db.query(
              'INSERT INTO showcase_affinity(viewerid, creator_id, score) VALUES(?,?,?)',
              [userValue, posteruser, 5]
            );
          }

          // 5. Optional hide
          const hideSql =
            'INSERT IGNORE INTO showcase_hide(user_id, video_id) VALUES(?,?)';

          db.query(hideSql, [userValue, postId], (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.status(200).json({
              success: true,
              message: 'Post liked successfully'
            });
          });
        });
      });
    });
  });
});



app.post('/postlikesdecrease', (req, res) => {
  const { postId, userValue } = req.body;

  // 1. Check if like exists
  const checkLikeSql =
    'SELECT * FROM showcase_likes WHERE liker_id=? AND video_id=?';

  db.query(checkLikeSql, [userValue, postId], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (existing.length === 0) {
      return res.status(400).json({ error: 'Like does not exist' });
    }

    // 2. Decrease likes (never below 0)
    const decreaseLikeSql =
      'UPDATE showcases SET likes = GREATEST(likes-1, 0) WHERE id=?';

    db.query(decreaseLikeSql, [postId], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // 3. Remove from likes table
      const deleteLikeSql =
        'DELETE FROM showcase_likes WHERE liker_id=? AND video_id=?';

      db.query(deleteLikeSql, [userValue, postId], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // 4. Remove from hide table
        const deleteHideSql =
          'DELETE FROM showcase_hide WHERE user_id=? AND video_id=?';

        db.query(deleteHideSql, [userValue, postId], (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.status(200).json({
            success: true,
            message: 'Like removed successfully'
          });
        });
      });
    });
  });
});


app.get('/getshowcase', (req, res) => {
  const { showcase, userId } = req.query;

  const sql = `
  WITH base AS (
    SELECT 
      cr.id,
      cr.sender_id,
      cr.caption,
      cr.video,
      cr.time_joined,
      cr.showcase_category,
      cr.likes,
      MAX(a.username) AS username,
      MAX(a.image) AS userimage,
      COUNT(v.actaul_comment) AS comment_count,
      COALESCE(MAX(sa.score), 0) AS affinity_score,

      -- Bucket assignment
      CASE
        WHEN MAX(sa.score) >= 20 THEN 'affinity'
        WHEN MAX(sa.score) > 0 THEN 'recent'
        ELSE 'random'
      END AS bucket
    FROM showcases cr
    LEFT JOIN showcase_affinity sa 
      ON sa.creator_id = cr.sender_id AND sa.viewerid = ?
    LEFT JOIN battlearenacomment v 
      ON v.videoid = cr.id
    LEFT JOIN projecttables a 
      ON a.ID = cr.sender_id
    LEFT JOIN showcase_hide seen 
      ON seen.video_id = cr.id AND seen.user_id = ?
    WHERE cr.showcase_category = ? 
      AND seen.video_id IS NULL
    GROUP BY 
      cr.id, cr.sender_id, cr.caption, cr.video, cr.time_joined, cr.showcase_category, cr.likes
  ),

  ranked AS (
    SELECT *,
      ROW_NUMBER() OVER (
        PARTITION BY bucket
        ORDER BY
          CASE
            WHEN bucket = 'affinity' THEN affinity_score
            WHEN bucket = 'recent' THEN time_joined
            ELSE RAND()
          END DESC
      ) AS bucket_rank
    FROM base
  ),

  interleaved AS (
    SELECT *,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE bucket
            WHEN 'affinity' THEN 1
            WHEN 'recent' THEN 2
            ELSE 3
          END,
          bucket_rank
      ) AS global_rank
    FROM ranked
  )

  SELECT 
    id,
    sender_id,
    caption,
    video,
    time_joined,
    showcase_category,
    likes,
    username,
    userimage,
    comment_count,
    affinity_score
  FROM interleaved
  ORDER BY (global_rank % 3), global_rank
  LIMIT 100;
  `;

  db.query(sql, [userId, userId, showcase], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.get('/fetchsearchvideo',(req,res)=>{
  const {searchparams}=req.query;
  const searchval=`%${searchparams}%`
  const sql=`select cr.id,cr.sender_id,cr.caption,cr.video,cr.time_joined,cr.showcase_category,cr.likes,a.username,a.image as userimage,
  count(v.actaul_comment) as comment_count from showcases cr left join battlearenacomment v on cr.id=v.videoid left join projecttables a 
  on a .ID=cr.sender_id  where cr.caption like ? or a.username like ? group by cr.id,cr.sender_id,cr.caption,cr.video,cr.time_joined,cr.showcase_category,cr.likes,a.username,a.image
   order by cr.likes desc;`
   db.query(sql,[searchval,searchval],(err,result)=>{
    if(err){
      return res.status(500).json({error:err.message})
    }
    res.json(result)
   })
});
app.get('/fetchingcomment',(req,res)=>{
  const {userId,videovalue}=req.query;
  const sql=`SELECT 
  cr.id,
  cr.videoid,
  cr.userid,
  cr.actaul_comment,
  a.USERNAME AS usersname,
  a.image AS usersimage
FROM battlearenacomment cr
LEFT JOIN projecttables a 
  ON cr.userid = a.id
LEFT JOIN comment_likes cl
  ON cr.id = cl.comment_id
WHERE cr.videoid = ?
GROUP BY cr.id;
`;
db.query(sql,[videovalue],(err,result)=>{
  if(err){
    return res.status(500).json({error:err.message});
  }
  res.json(result);
})
})
io.on('connection', (socket) => {

  socket.on('JoinComment', (videoId) => {
    socket.join(videoId);
  });

  socket.on('SendVideoComment', (data) => {
    const { videoo, user, comment, usersimage, usersname } = data;

    const sql = `
      INSERT INTO battlearenacomment(videoid, userid, actaul_comment)
      VALUES (?, ?, ?)
    `;

    db.query(sql, [videoo, user, comment], (err, result) => {
      if (err) console.log(err);
        
       
     

      db.query(sql, [videoo, user, comment], (err, result) => {
        if (err) return console.log(err);
      
        const commentId = result.insertId;
      
        db.query(
          `SELECT 
            cr.id,
            cr.videoid,
            cr.userid,
            cr.actaul_comment,
            a.USERNAME AS usersname,
            a.image AS usersimage
           FROM battlearenacomment cr
           LEFT JOIN projecttables a ON cr.userid = a.id
           WHERE cr.id = ?`,
          [commentId],
          (err, rows) => {
            if (err) return console.log(err);
      
            io.to(videoo).emit('NewComment', rows[0]);
          }
        );
      });
      
      

     
    });
  });

  socket.on('updateaffinity', (data) => {
    const { user, posterid } = data;

    const check = `
      SELECT * FROM showcase_affinity
      WHERE viewerid=? AND creator_id=?
    `;

    db.query(check, [user, posterid], (err, result) => {
      if (err) return console.log(err);

      if (result.length > 0) {
        db.query(
          `UPDATE showcase_affinity SET score=score+5 WHERE viewerid=? AND creator_id=?`,
          [user, posterid]
        );
      } else {
        db.query(
          `INSERT INTO showcase_affinity(viewerid, creator_id, score) VALUES(?,?,?)`,
          [user, posterid, 5]
        );
      }
    });
  });
  socket.on('LeaveComment',(videoId)=>{
    socket.leave(videoId)
  })
});

app.get('/getshowcaserank', (req, res) => {
  const user = req.query.user;

  const sql = `
    SELECT sender_id,
      SUM(likes) AS totallikes,
      ROUND(SUM(likes)/100) AS totalvalue,
      CASE 
        WHEN ROUND(SUM(likes)/100) BETWEEN 0 AND 499 THEN 'Rising'
        WHEN ROUND(SUM(likes)/100) BETWEEN 500 AND 999 THEN 'Challenger'
        WHEN ROUND(SUM(likes)/100) > 999 THEN 'Specialist'
      END AS category
    FROM showcases 
    WHERE sender_id = ? 
    GROUP BY sender_id;
  `;

  db.query(sql, [user], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result[0] || null);  // return null cleanly
  });
});
app.get('/showcasetopusers',(req,res)=>{
  const sql=`select cr.sender_id,a.FULLNAME as username,a.image as usersimage,sum(cr.likes) as totallikes ,round(sum(cr.likes)/100) as totalvalue , 
  case when round(sum(likes)/100) between 0 and 499 then 'Rising' when round(sum(likes)/100) between 500 and 999
   then 'Challenger' when round(sum(likes)/100) >999 then
   'Specialist' end as Category from showcases cr left join projecttables a on cr.sender_id=a.ID where cr.time_joined<=now()-interval 1 week group  by sender_id;`;
   db.query(sql,(err,result)=>{
    if(err){
      return res.status(500).json({error:err.message});

    }
    res.json(result);
   })
})
app.get('/Firstlikesearch',(req,res)=>{
  const {user,video}=req.query;
  const sql=`select * from showcase_likes cr where cr.liker_id=? and cr.video_id=?`;
  db.query(sql,[user,video],(err,result)=>{
    if(err){
      return res.status(500).json({error:err.message});
    }
    res.json(result)
  })
})
app.get('/gettrendingbyuser',(req,res)=>{
 
  const sql=`select cr.id,cr.sender_id,cr.caption,cr.video,cr.time_joined,cr.showcase_category,cr.likes,a.username,a.image as userimage,
  count(v.actaul_comment) as comment_count from showcases cr left join battlearenacomment v on cr.id=v.videoid left join projecttables a 
  on a .ID=cr.sender_id where cr.time_joined>=now()-interval 1 week group by cr.id,cr.sender_id,cr.caption,cr.video,cr.time_joined,cr.showcase_category,cr.likes,a.username,a.image
  order by cr.likes desc;;
   `
   db.query(sql,(err,result)=>{
    if(err){
   return res.status(500).json({error:err.message})
    }
    res.json(result)
   })
})
app.post('/increasescore', (req, res) => {
  const { user, posterid } = req.body;

  const sql = `
    INSERT INTO showcase_affinity (creator_id, viewerid, score)
    VALUES (?, ?, 5)
    ON DUPLICATE KEY UPDATE score = score + 5
  `;

  db.query(sql, [posterid, user], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json({ success: true, message: 'Score increased' });
  });
});

app.post('/reducescore', (req, res) => {
  const { user, posterid } = req.body;

  const sql = `
    INSERT INTO showcase_affinity (creator_id, viewerid, score)
    VALUES (?, ?, 0)
    ON DUPLICATE KEY UPDATE score = GREATEST(score - 5, 0)
  `;

  db.query(sql, [posterid, user], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json({ success: true, message: 'Score reduced' });
  });
});
app.post('/postcompetitionscore',(req,res)=>{
  const{usersid,score}=req.body;
  const sql=`insert into showcaseleaderboard(user_id,score)values(?,?) on duplicate key update score=score+?
  `
  db.query(sql,[usersid,score,score],(err,result)=>{
    if(err){
      return res.status(500).json({error:`An error occured`})
    }
    res.status(200).json({success:true,message:'Posted succesfully'})
  })
})
// io.on(connection,(socket)=>{

//   socket.on('Up')
// socket.on('disconnect',()=>{
//   console.log('User cleared');
// })
// })
app.get('/fetchleader',(req,res)=>{
  const sql=`select cr.id,cr.user_id,cr.score,a.FULLNAME as usersname,a.image from showcaseleaderboard 
  cr join projecttables a on cr.user_id=a.ID order by score desc limit 20;`
  db.query(sql,(err,result)=>{
    if(err){
      return res.status(500).json({error:'An error occured'})
    }
    res.json(result)
  })
})
app.post(
  "/api/uploads/images",
  upload.array("images", 10), // up to 10 images
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const imageUrls = req.files.map(
      file => `/uploads/${file.filename}`
    );

    res.json({ imageUrls });
  }
);
app.post(
  "/api/uploads/videos",
  upload.array("videos", 10), // up to 10 images
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const videoUrls = req.files.map(
      file => `/uploads/${file.filename}`
    );

    res.json({ videoUrls });
  }
);
app.post('/join-private-room', (req, res) => {
  const { roomId, userId, passcode } = req.body;

  if (!roomId || !userId || !passcode) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  db.query(
    'SELECT roompasskey FROM createinterestroom WHERE id = ?',
    [roomId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!rows.length)
        return res.status(404).json({ error: 'Room not found' });

      if (rows[0].roompasskey !== passcode) {
        return res.status(401).json({ error: 'Wrong passcode' });
      }

      db.query(
        'INSERT IGNORE INTO roomparticipants(userid, roomid, isAdmin) VALUES (?, ?, ?)',
        [userId, roomId, 0],
        (err2) => {
          if (err2) return res.status(500).json({ error: 'DB error' });
          res.json({ success: true });
        }
      );
    }
  );
});

app.post('/postscreen', (req, res) => {
  const { searchid, roomid, posttext, sentimage, sentvideo } = req.body;

  db.query(
    `INSERT INTO roomposts(sender_id, post, room_of_posts_id, postvideo, postimage) 
     VALUES (?, ?, ?, ?, ?)`,
    [searchid, posttext, roomid, JSON.stringify(sentvideo), JSON.stringify(sentimage)],
    (err, result) => {
      if (err) {
        console.log(err); // log the actual error
        return res.status(500).json({ error: 'An error occurred' });
      }
      res.status(200).json({ success: true });
    }
  );
});

app.get('/getroom',(req,res)=>{
  const {roomid}=req.query;
  db.query(`select cr.id,cr.sender_id,cr.post,cr.posted_at,cr.room_of_posts_id,
  cr.postvideo,cr.postimage,a.USERNAME as usersname,a.FULLNAME as fullname,a.image 
   from roomposts cr  inner join projecttables a on cr.sender_id=a.ID where cr.room_of_posts_id=? order by  cr.posted_at desc`,[roomid],(err,result)=>{
if(err){
  res.status(500).json({error:'An error occured'})
}
res.json(result)
   })
})

const roomOnlineUsers = new Map();
io.on('connection', (socket) => {
  let roomid = null;
  const userId = socket.handshake.query.userId;

  console.log('user connected:', userId);

  socket.on('joingrouproom', (receiveroomid) => {
    roomid = receiveroomid;
    socket.join(roomid);

    if (!roomOnlineUsers.has(roomid)) {
      roomOnlineUsers.set(roomid, new Set());
    }

    roomOnlineUsers.get(roomid).add(userId);

    io.to(roomid).emit(
      'online-count',
      roomOnlineUsers.get(roomid).size
    );
  });

  socket.on('sendimage', (image) => {
    if (!roomid) return console.log('sendimage: no roomid');

    db.query(
      `UPDATE createinterestroom SET room_image=? WHERE id=?`,
      [image, roomid],
      (err) => {
        if (err) return console.log(err);

        db.query(
          `SELECT room_image FROM createinterestroom WHERE id=?`,
          [roomid],
          (err, result) => {
            if (err) return console.log(err);

            io.to(roomid).emit('getimage', result[0].room_image);
          }
        );
      }
    );
  });

  socket.on('updatebio', (data) => {
    if (!roomid) return console.log('updatebio: no roomid');

    db.query(
      `UPDATE createinterestroom SET roombio=? WHERE id=?`,
      [data, roomid],
      (err) => {
        if (err) return console.log(err);

        db.query(
          `SELECT roombio FROM createinterestroom WHERE id=?`,
          [roomid],
          (err, result) => {
            if (err) return console.log(err);

            io.to(roomid).emit('gottenbio', result[0].roombio);
          }
        );
      }
    );
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', userId);

    for (const [rid, users] of roomOnlineUsers.entries()) {
      if (users.has(userId)) {
        users.delete(userId);

        io.to(rid).emit('online-count', users.size);

        if (users.size === 0) {
          roomOnlineUsers.delete(rid);
        }
      }
    }
  });
});



app.get('/roomimage',(req,res)=>{
  const {roompassid}=req.query
  db.query(`select room_image,roombio from createinterestroom where id=?`,[roompassid],(err,result)=>{
    if(err){
      return res.status(500).json({error:'An database error occured'})
    }
    res.json(result[0])
  })
})

app.get('/imagefromusers',(req,res)=>{
  const {roomidforimage}=req.query
  db.query(`select cr.id,cr.roomid,a.image from roomparticipants cr 
  inner join projecttables a on cr.userid=a.ID where cr.userid=? order by cr.joined desc limit 5`,[roomidforimage],(err,result)=>{
    if(err){
    return res.status(500).json({error:'An error occured'})
    }
    res.json(result)
  })
})
io.on('connection',(socket)=>{
  socket.on('Removeuser',(data)=>{
    const {skipper,skipped}=data
    db.query(`insert ignore into skipped_users(skipper_id,skipped_id)values(?,?)`,[skipper,skipped],(err,result)=>{
      if (err) {
        socket.emit('Removeuser:error', 'db_failed');
        return;
      }
    })
  })
  socket.on('Updatenotifi',(data)=>{
    const {sender,receiver,type,message}=data;
    db.query(`insert into notifications(sender_id,receiver_id,message,type)values(?,?,?,?)`,[sender,receiver,message,type],(err,result)=>{
      if(err){
        console.log('Error in pushing buddy matching DB');
      }
    })
  })
  socket.on('Removethisnotification',(notificationId)=>{
    const {yourid,notid}=notificationId
  
    if(!yourid || !notid){
      socket.emit('error','unreached values')
      return 
    }
    db.query(`delete from notifications where id=? and receiver_id=?`,[notid,yourid],(err,result)=>{
      if(err){
        console.log(`${err} in notifactions remmoval line 2890`);
        return;
      }
      db.query(
         `
          SELECT n.*, u.FULLNAME as sender_name, u.image AS sender_image
          FROM notifications n
          JOIN projecttables u ON u.id = n.sender_id
          WHERE n.receiver_id = ?
          ORDER BY n.created_at DESC
        `,[yourid],(err,result)=>{
          if(err){
            console.log(`${err} in notifications remmoval line 2902`);
            return;
          }
          socket.emit('UpdateAfterdeletenotication',(result))
        })
    })
  })

  socket.on('disconnect', () => {
    console.log('bye');
  });
})

app.get('/fetchlikestate',(req,res)=>{
  const {user,room}=req.query;
  db.query(`select * from roomlikes where userid=? and roomid=?`,[user,room],(err,result)=>{
    if(err){
     return res.status(500).json({error:err.message})
    }
  res.json(result[0])
  })
})
app.get('/fetchlikes',(req,res)=>{
  const {room}=req.query;
  db.query(`select roomid,count(roomid) as roomlikenum from roomlikes where roomid=? group by roomid ;`,[room],(err,result)=>{
    if(err){
    return  res.status(500).json({error:err.message})
    }
  res.json(result[0])
  })
})
app.post('/addroomlikes',(req,res)=>{
  const {searchid,roomdetais}=req.body;
  db.query(`insert into roomlikes(userid,roomid)values(?,?)`,[searchid,roomdetais],(err,result)=>{
    if(err){
      return  res.status(500).json({error:err.message})
      }    
      res.status(200).json({success:true})
  })

})
app.post('/removeroomlikes',(req,res)=>{
  const {searchid,roomdetais}=req.body;
  db.query(`delete from roomlikes where userid=? and roomid=?`,[searchid,roomdetais],(err,result)=>{
    if(err){
      return  res.status(500).json({error:err.message})
      }    
      res.status(200).json({success:true})
  })

})
app.get('/fetchroommen', (req, res) => {
  const { roomid } = req.query;

  if (!roomid) {
    return res.status(400).json({ error: 'roomid is required' });
  }

  const sql = `
    SELECT 
      cr.id,
      cr.userid,
      cr.isAdmin,
      a.USERNAME AS usersname,
      a.FULLNAME AS fullname,
      a.image
    FROM roomparticipants cr
    LEFT JOIN projecttables a ON a.ID = cr.userid
    WHERE cr.roomid = ?
    ORDER BY cr.joined
  `;

  db.query(sql, [roomid], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.get('/searchmember',(req,res)=>{
  const { roomid ,search} = req.query;

  if (!roomid || search) {
    return res.status(400).json({ error: 'roomid is required' });
  }

  const sql = `
    SELECT 
      cr.id,
      cr.userid,
      cr.isAdmin,
      a.USERNAME AS usersname,
      a.FULLNAME AS fullname,
      a.image
    FROM roomparticipants cr
    LEFT JOIN projecttables a ON a.ID = cr.userid
    WHERE cr.roomid = ? and a.USERNAME like ?
    ORDER BY cr.joined
  `;

  db.query(sql, [roomid,`%${search}%`], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
})


app.get('/memberscount',(req,res)=>{
  const {roomid}=req.query
  db.query(`select count(userid) as members from roomparticipants where roomid=? group by userid;`,[roomid],(err,result)=>{
    if(err){
      return res.status(500).json({error:err.message})
    }
    res.json(result[0])
  })
})

io.on('connection', (socket) => {
  let roomValueId = null;

  socket.on('JoinViewMembers', (roomValue) => {
    if (!roomValue) return;
    roomValueId = roomValue;
    socket.join(`room_${roomValue}`);
  });

  socket.on('MakeAdmin', (userid) => {
    if (!userid || !roomValueId) return;

    db.query(
      `SELECT isAdmin FROM roomparticipants WHERE userid=? AND roomid=?`,
      [userid, roomValueId],
      (err, result) => {
        if (err || !result.length || result[0].isAdmin === 1) return;

        db.query(
          `UPDATE roomparticipants SET isAdmin=1 WHERE userid=? AND roomid=?`,
          [userid, roomValueId],
          () => emitMembers(roomValueId)
        );
      }
    );
  });

  socket.on('RemoveAdmin', (userid) => {
    if (!userid || !roomValueId) return;

    db.query(
      `SELECT isAdmin FROM roomparticipants WHERE userid=? AND roomid=?`,
      [userid, roomValueId],
      (err, result) => {
        if (err || !result.length || result[0].isAdmin === 0) return;

        db.query(
          `UPDATE roomparticipants SET isAdmin=0 WHERE userid=? AND roomid=?`,
          [userid, roomValueId],
          () => emitMembers(roomValueId)
        );
      }
    );
  });

  socket.on('RemoveMember', (userid) => {
    if (!userid || !roomValueId) return;

    db.query(
      `DELETE FROM roomparticipants WHERE userid=? AND roomid=?`,
      [userid, roomValueId],
      () => emitMembers(roomValueId, true)
    );
  });

  function emitMembers(roomid, isDelete = false) {
    db.query(
      `
      SELECT cr.id, cr.userid, cr.isAdmin,
      a.USERNAME AS usersname,
      a.FULLNAME AS fullname,
      a.image
      FROM roomparticipants cr
      LEFT JOIN projecttables a ON a.ID = cr.userid
      WHERE cr.roomid = ?
      ORDER BY cr.joined
      `,
      [roomid],
      (err, result) => {
        if (err) return;
        const room = `room_${roomid}`;
        io.to(room).emit(
          isDelete ? 'UpdateAfterDelete' : 'UpdateAfterAdmin',
          result
        );
      }
    );
  }
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
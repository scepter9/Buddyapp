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
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});


db.connect((err) => {
    if (err) {
        console.error('MySQL connection failed:', err.message);
    } else {
        console.log('Connected to MySQL database');
    }
});

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
            image:user.IMAGE,
        };

        return res.json({ message: 'Login successful', user: req.session.user });
    });
});

// **FIXED** Profile route — uses session
// You had this route duplicated below, I've moved the correct one here
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


// Note: bcrypt is imported but not used in the reset-password route's update.
// This is fine if you're not hashing passwords, but be aware of the security implications.
// const bcrypt = require('bcrypt'); // This import was out of scope. Moved to the top if needed globally.

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

// The original Profile route was duplicated; I've used the first one.
// This route '/get-profile' appears to be a duplicate or unused.
// If it's intended to be a different endpoint, clarify its purpose.
// If not, it can likely be removed to avoid confusion.
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

// Remove the /create-notification route as it's no longer needed for real-time
// app.post('/create-notification', (req, res) => { /* ... */ });
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






// app.post('/create-notification',(req,res)=>{
//   const{sender_id,receiver_id,message}=req.body;
//   if(!sender_id || !receiver_id || !message){
//     return res.status(400).json({error:'sender,receiver and messages are required'})
//   }
//   const sql='INSERT INTO notifications(sender_id,receiver_id,message) VALUES(?,?,?)';
//   db.query(sql, [sender_id, receiver_id,message], (err ) => {
//     if (err) {
//       console.error('Failed to create notification:', err);
//       return res.status(500).json({ error: 'Database error' });
//     }
//     res.json({success:true})
//   });
// })


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
    // Get the user ID from the query parameters when the user connects.
    const userId = socket.handshake.query.userId;
    console.log(`User connected with ID: ${userId}`);
  
    // Store user and their socket ID in the map for real-time lookups.
    if (userId) {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} assigned to socket ID: ${socket.id}`);
    }
  
    // Listen for 'sendMessage' events from the frontend.
    // The 'callback' parameter is used to send a response back to the sender.
    socket.on('sendMessage', (data, callback) => {
      const { senderId, receiverId, type, text, imageUri } = data;
      console.log('Received message data:', data);
      
      
      const sql = 'INSERT INTO messages(sender_id, receiver_id, type, text, image_uri) VALUES (?, ?, ?, ?, ?)';
      db.query(sql, [senderId, receiverId, type, text, imageUri], (err, result) => {
        if (err) {
          console.error('Database error on message insertion:', err);
          // Send a failure response back to the sender.
          if (callback) callback({ error: 'Database error: Message could not be saved.' });
          return;
        }
  
        console.log('Message saved to database.');
        // Send a success response back to the sender.
        if (callback) callback({ success: true, messageId: result.insertId });
  
        // Create a new message object with a generated ID and timestamp.
        const newMessage = {
          id: result.insertId.toString(),
          senderId,
          receiverId,
          type,
          text,
          imageUri,
          timestamp: new Date().toISOString(),
        };
  
        // Get the socket ID of the receiver from our connectedUsers map.
        const receiverSocketId = connectedUsers.get(String(receiverId));
        
        // If the receiver is currently connected, emit the new message to them.
        if (receiverSocketId) {
          console.log(`Broadcasting new message to receiver: ${receiverId}`);
          io.to(receiverSocketId).emit('newMessage', newMessage);
        }
      });
    });
  
    // Handle disconnection event.
    socket.on('disconnect', () => {
      if (userId) {
        connectedUsers.delete(userId);
        console.log(`User disconnected: ${userId}`);
      }
    });
  });
  
  
  
server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
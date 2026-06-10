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
const { result, last } = require('lodash');
const bcrypt = require('bcrypt');
const cron=require('node-cron');
const { report } = require('process');
const cloudinary=require("cloudinary")
const {CloudinaryStorage}=require("multer-storage-cloudinary")

//"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u root -p buddy > backup.sql
//very important
// CORS middleware 
app.use(cors({
    origin: true, // Or specify your frontend origin like 'http://localhost:19006'
    credentials: true
}));

// JSON parser
app.use(express.json());
// app.use('/uploads', express.static('uploads'));

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


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

console.log('[Cloudinary]', {
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY ? 'set' : 'MISSING',
  api_secret: process.env.CLOUD_API_SECRET ? 'set' : 'MISSING',
});

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
    socket.on('register', (userId) => {
        if (userId) {
            connectedUsers.set(String(userId), socket.id);
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
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
   
  console.log('MySQL pool created');
  

  setInterval(() => {
    db.query(`DELETE FROM pending_registrations WHERE expires_at < NOW()`, (err) => {
      if (err) console.error('Cleanup error:', err);
      else console.log('Cleared expired pending registrations');
    });
  }, 60 * 60 * 1000);
  
  app.post('/check-availability', (req, res) => {
    const { email, username } = req.body;
  
    const sql = `
      SELECT 
        SUM(EMAIL = ?) as emailTaken,
        SUM(USERNAME = ?) as usernameTaken
      FROM projecttables
      WHERE EMAIL = ? OR USERNAME = ?
    `;
  
    db.query(sql, [email, username, email, username], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
  
      return res.status(200).json({
        emailTaken: results[0].emailTaken > 0,
        usernameTaken: results[0].usernameTaken > 0,
      });
    });
  });
  
// Register route
app.post('/send-verification', (req, res) => {
  const { fullname, username, email, phone, password,
      selectedValueschool,selectinterestname } = req.body;

      if (!fullname || !username || !email || !phone || !password || !selectedValueschool || !selectinterestname) {
          return res.status(400).json({ error: 'All fields are required' });
      }
// Check duplicates in main table
const checkSql = `
  SELECT ID FROM projecttables 
  WHERE EMAIL = ? OR USERNAME = ?
`;

db.query(checkSql, [email, username], async (err, results) => {
  if (err) return res.status(500).json({ error: 'Database error' });

  if (results.length > 0) {
    return res.status(409).json({ error: 'Email or username already taken' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    // Clear any previous pending entry for this email
    db.query(`DELETE FROM pending_registrations WHERE email = ?`, [email], (err2) => {
      if (err2) return res.status(500).json({ error: 'Database error' });

      const insertSql = `
        INSERT INTO pending_registrations 
        (fullname, username, email, phone, passworde, code, expires_at,uni,interest)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
      `;

      db.query(
        insertSql,
        [fullname, username, email, phone, hashedPassword, code, expires,selectedValueschool,JSON.stringify(selectinterestname)],
        (err3) => {
          if (err3) return res.status(500).json({ error: 'Failed to save registration' ,err3});

          const mailOptions = {
            from: `"Buddy App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to Buddy 🎉 — Confirm your email',
            html: `
              <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#ffffff;border-radius:16px;overflow:hidden">
                <div style="background:linear-gradient(135deg,#00D2FF,#7C3AED);padding:32px;text-align:center">
                  <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:-1px">buddy</h1>
                  <p style="margin:6px 0 0;font-size:13px;opacity:0.85">Your campus, your people.</p>
                </div>
                <div style="padding:32px">
                  <p style="font-size:16px;margin:0 0 8px">Hey <strong>${fullname.split(' ')[0]}</strong> 👋,</p>
                  <p style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;margin:0 0 20px">
                    Welcome to Buddy — we're genuinely glad you're here.<br><br>
                    Buddy was built for Nigerian university students, by someone who knows exactly what campus life feels like. Finding your people, connecting with coursemates, building your circle — that's what this is for. And you're one of the first to be part of it.
                  </p>
                  <p style="font-size:14px;color:rgba(255,255,255,0.7);margin:0 0 20px">
                    Before you dive in, confirm it's really you with the code below.
                  </p>
                  <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
                    <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase">Your verification code</p>
                    <p style="margin:0;font-size:36px;font-weight:900;letter-spacing:8px;color:#00D2FF">${code}</p>
                    <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.3)">Expires in 10 minutes</p>
                  </div>
                  <p style="font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;margin:0 0 28px">
                    If you didn't create a Buddy account, you can safely ignore this email.
                  </p>
                  <p style="font-size:14px;color:rgba(255,255,255,0.7);margin:0">
                    See you on campus,<br>
                    <strong style="color:#ffffff">The Buddy Team 🚀</strong>
                  </p>
                </div>
                <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2)">© 2025 Buddy — Nigerian Universities Network</p>
                </div>
              </div>
            `
          };

          transporter.sendMail(mailOptions, (mailErr) => {
            if (mailErr) {
              console.error('Email error:', mailErr);
              return res.status(500).json({ error: 'Failed to send email' });
            }
            return res.status(200).json({
              success: true,
              message: 'Verification code sent to email'
            });
          });
        }
      );
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});
});


app.post('/verify-registration', (req, res) => {
const { email, code } = req.body;

if (!email || !code) {
  return res.status(400).json({ error: 'Email and code are required' });
}

const checkSql = `
  SELECT * FROM pending_registrations
  WHERE email = ? AND code = ? AND expires_at > NOW()
`;

db.query(checkSql, [email, code], (err, results) => {
  if (err) return res.status(500).json({ error: 'Database error' });

  if (results.length === 0) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }

  const user = results[0];

  const insertSql = `
  INSERT INTO projecttables 
  (FULLNAME, USERNAME, EMAIL, PHONE, PASSWORD, VERIFICATION, university, interests, join_date)
  VALUES (?, ?, ?, ?, ?, 'verified', ?, ?, CURDATE())
`;

db.query(
  insertSql,
  [user.fullname, user.username, user.email, user.phone, user.passworde, user.uni,   JSON.stringify(user.interest)],
    (err2, result) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: 'Failed to create account' });
      }

      // Clean up pending table
      db.query(`DELETE FROM pending_registrations WHERE email = ?`, [email]);

      // Start session
      req.session.user = {
        id: result.insertId,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        phone: user.phone,
      };

      return res.status(201).json({
        success: true,
        message: 'Account created',
        user: req.session.user
      });
    }
  );
});
});



app.post('/resend-verification', (req, res) => {
const { email } = req.body;

if (!email) {
  return res.status(400).json({ error: 'Email is required' });
}

const checkSql = `SELECT * FROM pending_registrations WHERE email = ?`;

db.query(checkSql, [email], (err, results) => {
  if (err) return res.status(500).json({ error: 'Database error' });

  if (results.length === 0) {
    return res.status(404).json({ error: 'No pending registration found' });
  }

  const user = results[0];
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  const newExpires = new Date(Date.now() + 10 * 60 * 1000);

  const updateSql = `
    UPDATE pending_registrations 
    SET code = ?, expires_at = ? 
    WHERE email = ?
  `;

  db.query(updateSql, [newCode, newExpires, email], (err2) => {
    if (err2) return res.status(500).json({ error: 'Failed to update code' });

    const mailOptions = {
      from: `"Buddy App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your new Buddy verification code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#ffffff;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#00D2FF,#7C3AED);padding:32px;text-align:center">
            <h1 style="margin:0;font-size:28px;font-weight:900">buddy</h1>
          </div>
          <div style="padding:32px">
            <p style="font-size:15px;color:rgba(255,255,255,0.8);margin:0 0 20px">
              Hey ${user.fullname.split(' ')[0]} 👋, here's your new verification code:
            </p>
            <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;text-align:center">
              <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase">Verification code</p>
              <p style="margin:0;font-size:36px;font-weight:900;letter-spacing:8px;color:#00D2FF">${newCode}</p>
              <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.3)">Expires in 10 minutes</p>
            </div>
          </div>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (mailErr) => {
      if (mailErr) return res.status(500).json({ error: 'Failed to send email' });
      return res.status(200).json({ success: true, message: 'New code sent' });
    });
  });
});
});

// Login route


app.post('/Login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `SELECT * FROM projecttables WHERE trim(USERNAME) = ?`;

  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Invalid username' });
    }

    const user = results[0];

    // Compare typed password against the hash in DB
    const isMatch = await bcrypt.compare(password, user.PASSWORD);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check email is verified before allowing login
    if (user.VERIFICATION !== 'verified') {
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    req.session.user = {
      id: user.ID,
      fullname: user.FULLNAME,
      username: user.USERNAME,
      email: user.EMAIL,
      phone: user.PHONE,
      image:user.image,
    role:user.userrole,
    uni:user.university
    };

    return res.status(200).json({
      message: 'Login successful',
      user: req.session.user
    });
  });
}); 
 

app.get('/Profile', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const sql = `
    SELECT ID as id, FULLNAME as name, EMAIL as email, BIO as about, FOLLOWERS, FOLLOWING,
           IS_PRO as isPro, DATE_FORMAT(join_date, '%M %Y') as joinDate, IMAGE as image,university,interests
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
    const sql=`SELECT a.ID as id , a.FullNAME as name , a.IMAGE as image,a.userrole,coalesce(count(u.id),0)
    as roomcount FROM projecttables a join createinterestroom u where a.ID=? group by u.id  
   `;
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
    SELECT ID as id, FULLNAME as name, EMAIL as email, BIO as about,
           IS_PRO as isPro, DATE_FORMAT(join_date, '%M %Y') as joinDate, IMAGE as image, FOLLOWERS AS followers, FOLLOWING AS following,
           university,interests
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
                    email: email,
                    thecode:code // or any ID you want to pass to ResetPassword screen
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

            const updateSql = `
            UPDATE projecttables
            SET PASSWORD = ?, reset_token = NULL, token_expires = NULL
            WHERE EMAIL = ?
          `;
            db.query(updateSql, [newPassword, email], (err2) => { // Using newPassword directly
                if (err2) return res.status(500).json({ error: 'Failed to update password' });

                return res.status(200).json({ message: 'Password reset successful' });
            });
       
    });
});


// Store images in uploads/
// const storage = multer.diskStorage({
//     destination: 'uploads/',
//     filename: (req, file, cb) => {
//         const ext = path.extname(file.originalname);
//         const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
//         cb(null, uniqueName);
//     },
// });

const audioStorage = new CloudinaryStorage({
  cloudinary,
  params:{
    folder:'buddyapp/audio',
    allowed_formats:['mp3','aac','m4a','wav'],
    resource_type:'video'
  }
})
const imageStorage=new CloudinaryStorage({
  cloudinary,
  params:{
    folder:'buddyapp/images',
    allowed_formats:['jpg','jpeg','png','webp'],
    resource_type:'image'
  }
})
const videoStorage=new CloudinaryStorage({
  cloudinary,
  params:{
    folder:'buddyapp/videos',
    allowed_formats:['mp4','mov','avi'],
    resource_type:'video'
  }
})
const uploadAudio = multer({ storage: audioStorage});
const uploadVideo = multer({ storage: videoStorage});
const uploadImage = multer({ storage: imageStorage});


app.post('/api/upload-audio', uploadAudio.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ audioUrl:req.file.path });
});

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
app.post('/update-profile', uploadImage.single('image'), (req, res) => {
  const { name, about, university } = req.body;
  const image = req.file;
  const userId = req.session.user?.id;

  if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
  }

  let updates = [];
  let values = [];

  // NAME
  if (name && name.trim() !== '') {
      updates.push('FULLNAME = ?');
      values.push(name.trim());
  }

  // BIO
  if (about && about.trim() !== '') {
      updates.push('BIO = ?');
      values.push(about.trim());
  }

  // UNIVERSITY
  if (university && university.trim() !== '') {
      updates.push('UNIVERSITY = ?');
      values.push(university.trim());
  }

  // IMAGE

  if (image) {
    updates.push('IMAGE = ?');
    values.push(image.path); // full Cloudinary URL
  }


  // NO CHANGES
  if (updates.length === 0) {
      return res.status(400).json({
          error: 'No data provided for update.',
      });
  }

  // FINAL QUERY
  const sql = `
      UPDATE projecttables 
      SET ${updates.join(', ')} 
      WHERE id = ?
  `;

  values.push(userId);

  db.query(sql, values, (err, result) => {
      if (err) {
          console.error('Update profile error:', err);

          return res.status(500).json({
              error: 'Database error.',
          });
      }

      res.json({
          message: 'Profile updated successfully.',
      });
  });
});

app.get('/checkuser', (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const { SearchValue } = req.query;
  if (!SearchValue?.trim()) return res.status(200).json([]);

  const pattern = `%${SearchValue.trim()}%`;

  db.query(
    `SELECT id, email, image, username, FULLNAME 
     FROM projecttables 
     WHERE (USERNAME LIKE ? OR FULLNAME LIKE ?)
       AND id != ?
     LIMIT 20`,
    [pattern, pattern, userId],
    (err, results) => {
      if (err) {
        console.error('Search error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    }
  );
});

app.get('/getusersyoumayknow', (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  // First fetch the user's university so the filter is dynamic
  db.query(
    'SELECT university FROM projecttables WHERE id = ?',
    [userId],
    (err, rows) => {
      if (err || rows.length === 0) {
        return res.status(500).json({ error: 'Could not fetch user data' });
      }

      const university = rows[0].university;

    
      const sql = `
        WITH firstfilter AS (
          SELECT n.*
          FROM projecttables n
          WHERE n.id != ?
            AND n.university = ?
            AND NOT EXISTS (
              SELECT 1 FROM follows
              WHERE sender_id = ? AND receiver_id = n.id
            )
        ),
        mutual_count AS (
          SELECT p.id AS user_id, COUNT(*) AS mutuals
          FROM firstfilter p
          INNER JOIN follows f  ON f.receiver_id = ?
          INNER JOIN follows f2 ON f.sender_id = f2.sender_id
                                AND f2.receiver_id = p.id
          GROUP BY p.id
        ),
        room_overlap AS (
          SELECT DISTINCT p1.userid AS user_id
          FROM roomparticipants p1
          WHERE p1.userid IN (SELECT id FROM firstfilter)
            AND p1.roomid IN (
              SELECT roomid FROM roomparticipants WHERE userid = ?
            )
        )
        SELECT
          p.*,
          COALESCE(mc.mutuals, 0) AS mutual_follower_count,
          (
            1 +
            CASE WHEN ro.user_id IS NOT NULL THEN 2 ELSE 0 END +
            CASE
              WHEN COALESCE(mc.mutuals, 0) >= 5 THEN 6
              WHEN COALESCE(mc.mutuals, 0) >= 2 THEN 4
              ELSE 0
            END
          ) AS total_score
        FROM firstfilter p
        LEFT JOIN mutual_count  mc ON mc.user_id = p.id
        LEFT JOIN room_overlap  ro ON ro.user_id = p.id
        ORDER BY total_score DESC
        LIMIT 20
      `;

      db.query(sql, [userId, university, userId, userId, userId], (err, result) => {
        if (err) {
          console.error('People you may know error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(result);
      });
    }
  );
});

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
  if (!receiver_id) return res.status(401).json({ error: 'Not authenticated' });

  const sql = `
    SELECT 
      n.*,
      u.FULLNAME AS sender_name,
      u.image    AS sender_image
    FROM notifications n
    LEFT JOIN projecttables u ON u.id = n.sender_id
    WHERE n.receiver_id = ?
    ORDER BY n.created_at DESC
  `;

  db.query(sql, [receiver_id], (err, results) => {
    if (err) {
      console.error('Fetch notifications error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// ── Mark all as read ──
app.post('/notifications/mark-as-read', (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  db.query(
    'UPDATE notifications SET is_read = TRUE WHERE receiver_id = ? AND is_read = FALSE',
    [userId],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(200).json({ message: 'Marked as read' });
    }
  );
});

// ── Unread count ──
app.get('/notifications/unread/count', (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  db.query(
    'SELECT COUNT(*) AS unreadCount FROM notifications WHERE receiver_id = ? AND is_read = FALSE',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ unreadCount: results[0].unreadCount });
    }
  );
});

// ── Clear all notifications ──

app.post('/notifications/clear-all', (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  db.query(
    'DELETE FROM notifications WHERE receiver_id = ?',
    [userId],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(200).json({ success: true });
    }
  );
});

app.post('/deletesinglenotification', (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const { notid } = req.body;
  if (!notid) return res.status(400).json({ error: 'Missing notification ID' });

  // Verify ownership before deleting
  db.query(
    'DELETE FROM notifications WHERE id = ? AND receiver_id = ?',
    [notid, userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (result.affectedRows === 0) {
        return res.status(403).json({ error: 'Not authorized or notification not found' });
      }
const usersocket=connectedUsers.get(String(userId))
      io.to(usersocket).emit('UpdateAfterdeletenotication', { deletedId: notid });

      res.status(200).json({ success: true });
    }
  );
});

// ── Check follow status ──
app.get('/check-follow/:userId', (req, res) => {
  const loggedInUserId = req.session.user?.id;
  const targetUserId = req.params.userId;
  if (!loggedInUserId) return res.status(401).json({ error: 'Not authenticated' });
  if (parseInt(loggedInUserId) === parseInt(targetUserId)) {
    return res.json({ success: true, isFollowing: false });
  }
  db.query(
    'SELECT 1 FROM follows WHERE sender_id = ? AND receiver_id = ?',
    [loggedInUserId, targetUserId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true, isFollowing: results.length > 0 });
    }
  );
});


  
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
        connectedUsers.set(userId, socket.id);
    }

    db.query(
        'INSERT INTO users_online (user_id, socket_id, is_online, last_seen) VALUES (?, ?, TRUE, NOW()) ON DUPLICATE KEY UPDATE socket_id = VALUES(socket_id), is_online = TRUE, last_seen = NOW()',
        [userId, socket.id]
    );

    io.emit('user_online', userId);

    socket.on('typing', ({ receiverId }) => {
        const receiverSocketId = connectedUsers.get(String(receiverId));
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('typing', { senderId: userId });
        }
    });

    socket.on('sendMessage', (data, callback) => {
        const { senderId, receiverId, type, text, imageUri, audioUri, replyToId } = data;

        const checkBlockSQL = `
            SELECT 1 FROM blocked_users
            WHERE (blocker_id = ? AND blocked_id = ?)
               OR (blocker_id = ? AND blocked_id = ?)
        `;
        db.query(checkBlockSQL, [senderId, receiverId, receiverId, senderId], (err, results) => {
            if (err) return callback?.({ error: 'Database error' });
            if (results.length > 0) return callback?.({ error: 'Cannot send message — user is blocked' });

            const sql = `
                INSERT INTO messages (sender_id, receiver_id, type, text, image_uri, audio_uri, reply_to_id, is_read)
                VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)
            `;
            db.query(sql, [senderId, receiverId, type, text || null, imageUri || null, audioUri || null, replyToId || null], (err, result) => {
                if (err) {
                    console.error('Message insert error:', err);
                    return callback?.({ error: 'Message could not be saved.' });
                }

                const messageId = result.insertId.toString();
                callback?.({ success: true, id: messageId });

                const newMessage = {
                    id: messageId,
                    senderId,
                    receiverId,
                    type,
                    text: text || null,
                    imageUri: imageUri || null,
                    audioUri: audioUri || null,
                    replyToId: replyToId || null,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                };

                const receiverSocketId = connectedUsers.get(String(receiverId));
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('newMessage', newMessage);
                }
            });
        });
    });
    socket.on('mark-read', ({ themessages, sender, receiver }) => {
      if (!themessages?.length) return;
      db.query(
        `UPDATE messages SET is_read=1 WHERE id IN (?) AND sender_id=? AND receiver_id=?`,
        [themessages, sender, receiver],
        (err) => {
          if (err) return console.log('mark-read error:', err);
    
        
          const senderSocketId = connectedUsers.get(String(sender));
          if (senderSocketId) {
            io.to(senderSocketId).emit('messages_read', { messageIds: themessages });
          }
        }
      );
    });

    socket.on('blockUser', ({ blockedId }) => {
        const sql = 'INSERT IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)';
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

    socket.on('disconnect', () => {
        db.query('UPDATE users_online SET is_online = FALSE, last_seen = NOW() WHERE socket_id = ?', [socket.id]);
        if (userId) connectedUsers.delete(userId);
    });
})
app.get('/messages', (req, res) => {
  const { senderId, receiverId } = req.query;
  if (!senderId || !receiverId) return res.status(400).json({ error: 'senderId and receiverId required' });

  const sql = `
      SELECT
          id, sender_id, receiver_id, type, text,
          image_uri, audio_uri, reply_to_id,
          created_at AS timestamp, is_read
      FROM messages
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
  `;
  db.query(sql, [senderId, receiverId, receiverId, senderId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch messages' });
      res.json(results);
  });
});


app.delete('/messages/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM messages WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete message' });
      io.emit('message_deleted', String(id));
      res.json({ success: true });
  });
});

app.get('/conversations', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID is required.' });

  const sql = `
      SELECT
          p.ID AS other_user_id,
          p.FULLNAME AS other_user_name,
          p.image AS other_user_image_uri,
          last_message.text AS last_message_text,
          last_message.type AS last_message_type,
          last_message.created_at AS last_message_timestamp,
          last_message.sender_id AS last_message_sender_id,
          COALESCE(unread_counts.count, 0) AS unread_count
      FROM (
          SELECT
              IF(sender_id = ?, receiver_id, sender_id) AS other_person_id,
              MAX(created_at) AS last_message_time
          FROM messages
          WHERE sender_id = ? OR receiver_id = ?
          GROUP BY other_person_id
      ) AS latest
      JOIN messages AS last_message ON (
          (last_message.sender_id = ? AND last_message.receiver_id = latest.other_person_id)
          OR
          (last_message.receiver_id = ? AND last_message.sender_id = latest.other_person_id)
      ) AND last_message.created_at = latest.last_message_time
      JOIN projecttables AS p ON latest.other_person_id = p.ID
      LEFT JOIN (
          SELECT sender_id AS other_person_id_for_unread, COUNT(*) AS count
          FROM messages
          WHERE receiver_id = ? AND is_read = FALSE
          GROUP BY sender_id
      ) AS unread_counts ON unread_counts.other_person_id_for_unread = latest.other_person_id
      ORDER BY last_message_timestamp DESC
  `;

  db.query(sql, [userId, userId, userId, userId, userId, userId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch conversations.' });
      res.json(results);
  });
});


app.get('/isBlocked/:userId', (req, res) => {
  const myId = req.session.user?.id;
  const { userId } = req.params;
  if (!myId) return res.status(401).json({ error: 'Not logged in' });

  const sql = `
      SELECT 1 FROM blocked_users
      WHERE (blocker_id = ? AND blocked_id = ?)
         OR (blocker_id = ? AND blocked_id = ?)
      LIMIT 1
  `;
  db.query(sql, [myId, userId, userId, myId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch status' });
      res.json({ blocked: results.length > 0 });
  });
});


app.post('/messages/mark-as-read', (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) return res.status(400).json({ error: 'senderId and receiverId required' });

  db.query(
      'UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE',
      [receiverId, senderId],
      (err) => {
          if (err) return res.status(500).json({ error: 'Failed to mark messages as read.' });
          db.query(
              'SELECT COUNT(*) AS unreadCount FROM messages WHERE receiver_id = ? AND is_read = FALSE',
              [receiverId],
              (countErr, countResult) => {
                  if (countErr) return res.status(500).json({ error: 'Failed to fetch unread count.' });
                  res.json({ message: 'Messages marked as read', newUnreadCount: countResult[0].unreadCount });
              }
          );
      }
  );
});


app.get('/unread-messages-count', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  db.query(
      'SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
      [userId],
      (err, results) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch unread count.' });
          res.json({ count: results[0].count });
      }
  );
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
 
  


//     app.post('/api/submit-answers', (req, res) => {
//     // Extract the userId and answers object from the request body.
//     const { userId, answers } = req.body;

//     if (!userId || !answers || Object.keys(answers).length === 0) {
//         return res.status(400).json({ error: 'Invalid data provided.' });
//     }

//     // Step 1: Delete all previous answers for this user
//     const deleteSql = `
//         DELETE FROM user_answers
//         WHERE user_id = ?
//     `;
    
//     db.query(deleteSql, [userId], (err, result) => {
//         if (err) {
//             console.error('Error deleting old answers:', err);
//             return res.status(500).json({ error: 'Database error on delete' });
//         }

//         // Step 2: Prepare a multi-row INSERT query for all new answers
//         // We'll dynamically build the query and the values array.
//         const values = [];
//         const placeholders = [];

//         for (const questionId in answers) {
//             const answer = answers[questionId];
//             if (answer) {
//                 // Add values for each row: [userId, questionId, answer]
//                 values.push(userId, parseInt(questionId), answer);
//                 // Create a placeholder string for each row: (?, ?, ?)
//                 placeholders.push('(?, ?, ?)');
//             }
//         }
        
//         // Join the placeholders to create the final SQL string.
//         const insertSql = `
//             INSERT INTO user_answers (user_id, question_id, answer)
//             VALUES ${placeholders.join(', ')}
//         `;

//         // Execute the multi-row insert query
//         db.query(insertSql, values, (err, result) => {
//             if (err) {
//                 console.error('Error inserting new answers:', err);
//                 return res.status(500).json({ error: 'Database error on insert' });
//             }
            
//             res.status(201).json({ 
//                 message: 'Answers submitted successfully!', 
//                 affectedRows: result.affectedRows 
//             });
//         });
//     });
// });
// app.get('/api/matches',(req,res)=>{
//   const {userId}=req.query;
//   const sql = `
//   WITH shared_all AS (
//     SELECT
//       a1.user_id AS base_user,
//       a2.user_id AS other_user,
//       a1.question_id
//       from user_answers a1
//     JOIN user_answers a2
//       ON a1.question_id = a2.question_id
//      AND a1.answer = a2.answer
//      AND a1.user_id <> a2.user_id
//      LEFT JOIN skipped_users su ON
//      su.skipper_id=a1.user_id AND
//      su.skipped_id=a2.user_id
//     WHERE a1.user_id = ? and su.id is null
//   ),
  
//   similarity AS (
//     SELECT
//       other_user,
//       COUNT(*) / 20 * 100 AS similarity_percent
//     FROM shared_all 
//     GROUP BY other_user
//   ),
  
//   shared_first_10 AS (
//     SELECT
//       a2.user_id AS other_user,
//       a1.answer,
//       ROW_NUMBER() OVER (
//         PARTITION BY a2.user_id
//         ORDER BY rand()
//       ) AS rn
//     FROM user_answers a1
//     JOIN user_answers a2
//       ON a1.question_id = a2.question_id
//      AND a1.answer = a2.answer
//      AND a1.user_id <> a2.user_id
//     WHERE a1.user_id = ?
//       AND a1.question_id <= 10
//   ),
  
//   picked_two AS (
//     SELECT *
//     FROM shared_first_10
//     WHERE rn <= 4
//   )
  
//   SELECT
//     s.other_user,
//     s.similarity_percent,
//     c.FULLNAME as thename,
//       c.image as theimage,
//     MAX(CASE WHEN p.rn = 1 THEN p.answer END) AS shared_answer_1,
//     MAX(CASE WHEN p.rn = 2 THEN p.answer END) AS shared_answer_2,
//     MAX(CASE WHEN p.rn = 3 THEN p.answer END) AS shared_answer_3,
//     MAX(CASE WHEN p.rn = 4 THEN p.answer END) AS shared_answer_4
//   FROM similarity s 
//   LEFT JOIN projecttables c ON s.other_user=c.ID
//   LEFT JOIN picked_two p
//     ON s.other_user = p.other_user
//   GROUP BY
//     s.other_user,
//     s.similarity_percent
//   ORDER BY s.similarity_percent DESC
//   LIMIT 100;
  
//     `;
//     db.query(sql,[userId,userId],(err,result)=>{
//       if(err){
//         res.status(500).json({error:'An error occured'})
//       }
//       res.json(result)
//     })
// })



 


app.post('/newAnonroom', (req, res) => {
  const {
    roomName, tags, selectedHour, selectedMinute,
    roomRandomCode, starthours, startminutes,
  } = req.body;

  const starttime = new Date();
  starttime.setHours(starttime.getHours() + (Number(starthours) || 0));
  starttime.setMinutes(starttime.getMinutes() + (Number(startminutes) || 0));

  const endtime = new Date(starttime); 
  endtime.setHours(endtime.getHours() + (Number(selectedHour) || 0));
  endtime.setMinutes(endtime.getMinutes() + (Number(selectedMinute) || 0));

  const sql = `
    INSERT INTO newanongroup(roomName, tags, roomRandomCode, hour, minute, starttime, stoptime, status)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [roomName, tags, roomRandomCode, selectedHour, selectedMinute, starttime, endtime, 'waiting'], (err) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'Room created', roomCode: roomRandomCode });
  });
});
app.get('/getanonroom/:roomcode', (req, res) => {
  db.query(
    'SELECT * FROM newanongroup WHERE roomRandomCode = ?',
    [req.params.roomcode],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (result.length === 0) return res.status(404).json({ error: 'Room not found' });
      res.json(result[0]);
    }
  );
});
app.post('/deleteanonroom', (req, res) => {
  const { roomName, roomCode } = req.body;

  db.query(
    'DELETE FROM newanongroup WHERE roomName = ? AND roomRandomCode = ?',
    [roomName, roomCode],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      db.query('DELETE FROM anontemp WHERE roomcode = ?', [roomCode], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ success: true });
      });
    }
  );
});


io.on('connection', (socket) => {
  
  socket.on('Addasmember', (data) => {
    const { usersid, generatedCode } = data;

    db.query(
      'INSERT IGNORE INTO anontemp (userid, roomcode) VALUES (?, ?)',
      [usersid, generatedCode],
      (err) => {
        if (err) {
          console.error('Addasmember error:', err);
          socket.emit('Error', 'Failed to subscribe to room');
          return;
        }
        console.log(`User ${usersid} subscribed to room ${generatedCode}`);
 
      }
    );
  });

  // ── Anon room join ──
  socket.on('joinRoom', (roomCode) => {
    if (!activeAnonymousRooms.has(roomCode)) {
      activeAnonymousRooms.set(roomCode, { members: new Set() });
    }
    socket.join(roomCode);
    activeAnonymousRooms.get(roomCode).members.add(socket.id);
    io.to(roomCode).emit('userJoined', socket.id);
  });

  // ── Send message ──
  socket.on('sendMessages', (data) => {
    const { roomCode, text, senderId } = data;
    if (!activeAnonymousRooms.has(roomCode)) return;
    io.to(roomCode).emit('newMessages', {
      id: Date.now().toString(),
      text,
      senderId,
      timestamp: new Date().toISOString(),
    });
  });
  socket.on('sendEmoji',({emojiId,messageId})=>{
    if(!emojiId || !messageId) return;
    io.to(roomCode).emit('Receiveemoji',(
      {messageId,emojiId}
    ))
  })

  // ── Disconnecting ──
  socket.on('disconnecting', () => {
    socket.rooms.forEach(roomCode => {
      if (roomCode !== socket.id && activeAnonymousRooms.has(roomCode)) {
        activeAnonymousRooms.get(roomCode).members.delete(socket.id);
        io.to(roomCode).emit('userLeft', socket.id);
        if (activeAnonymousRooms.get(roomCode).members.size === 0) {
          activeAnonymousRooms.delete(roomCode);
        }
      }
    });
  });

});

 
// cron.schedule('*/5 * * * *', async () => {
//   const userId=req.session.user.id
//   try {
//     const usersocket=connectedUsers.get(String(userId))
//     const [rows] = await db.promise().query(`
//       SELECT 
//         k.userid,
//         k.roomcode,
//         a.roomName
//       FROM anontemp k
//       JOIN newanongroup a ON k.roomcode = a.roomRandomCode
//       WHERE a.starttime <= NOW() + INTERVAL 30 MINUTE
//         AND a.starttime >= NOW()
//         AND a.status = 'waiting'
//     `);

//     if (rows.length === 0) return;

//     for (const row of rows) {
//       // Insert notification
//       await db.promise().query(`
//         INSERT INTO notifications (sender_id, receiver_id, message, type, is_read)
//         VALUES (?, ?, ?, ?, ?)
//       `, [null, row.userid, `Your anonymous room "${row.roomName}" starts in 30 minutes`, 'anon', 0]);



//       // Emit real-time notification if user is online
//       io.to(usersocket).emit('newNotification', {
//         message: `Your anonymous room "${row.roomName}" starts in 30 minutes`,
//         type: 'anon',
//       });
//     }

    
//     const roomCodes = [...new Set(rows.map(r => r.roomcode))];
//     if (roomCodes.length > 0) {
//       const placeholders = roomCodes.map(() => '?').join(',');
//       await db.promise().query(
//         `UPDATE newanongroup SET status = 'sent' WHERE roomRandomCode IN (${placeholders})`,
//         roomCodes
//       );
//     }

//     console.log(`Cron: notified ${rows.length} subscribers`);
//   } catch (err) {
//     // BUG FIX: never throw from cron — log and continue
//     console.error('Cron error:', err.message);
//   }
// }, { timezone: 'Africa/Lagos' });

// Use uploadImage which uses Cloudinary storage ✅
app.post('/api/upload', uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ imageUrl: req.file.path }); // full Cloudinary URL
});



app.get('/pulsedata', (req, res) => {
  const {userid,useruni}=req.query
  const sql = `SELECT cr.ID, cr.title, cr.author, cr.post, cr.image, cr.user, cr.posted_at,a.university,
  IF(cl.userid IS NULL, 0, 1) AS pulselikestate,
  COUNT(cl_all.pulseid) AS pulselikecount
FROM campulsepulse cr
LEFT JOIN campuslikes cl ON cl.pulseid = cr.ID AND cl.userid = ?
LEFT JOIN projecttables a on cr.user=a.ID and a.university=?
LEFT JOIN campuslikes cl_all ON cl_all.pulseid = cr.ID
GROUP BY cr.ID
ORDER BY pulselikecount DESC
LIMIT 15`;
  db.query(sql,[userid,useruni], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'An error occurred' });
    }
    return res.json( result );
  });
});
app.get('/mystories',(req,res)=>{
  const {user}=req.query;
  db.query(`SELECT cr.ID, cr.title, cr.author, cr.post, cr.image, cr.user, cr.posted_at,
  IF(cl.userid IS NULL, 0, 1) AS pulselikestate,
  COUNT(cl_all.pulseid) AS pulselikecount
FROM campulsepulse cr 
LEFT JOIN campuslikes cl ON cl.pulseid = cr.ID AND cl.userid = ?
LEFT JOIN campuslikes cl_all ON cl_all.pulseid = cr.ID
where cr.user=?
GROUP BY cr.ID 
ORDER BY pulselikecount DESC
LIMIT 15`,[user,user],(err,result)=>{
  if(err){
    return res.status(500).json({error:'Database error occured when fetching personal stories'})
  }
  res.json(result)
})
})

app.get('/olderstories', (req, res) => {
  const {userid,lasttime}=req.query
  const sql = `SELECT cr.ID, cr.title, cr.author, cr.post, cr.image, cr.user, cr.posted_at,
  IF(cl.userid IS NULL, 0, 1) AS pulselikestate,
  COUNT(cl_all.pulseid) AS pulselikecount
FROM campulsepulse cr

LEFT JOIN campuslikes cl ON cl.pulseid = cr.ID AND cl.userid = ?
LEFT JOIN projecttables a on cr.user=a.ID and a.university=?
LEFT JOIN campuslikes cl_all ON cl_all.pulseid = cr.ID
where cr.posted_at<?
GROUP BY cr.ID
ORDER BY pulselikecount DESC
LIMIT 15; `;
  db.query(sql,[userid,lasttime], (err, result) => {
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
   left join roomparticipants a on cr.id=a.roomid group by cr.id,cr.roomname,
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
   join roomparticipants a on cr.id=a.roomid 
    left join roomparticipants w on cr.id=w.roomid and w.userid=? group by cr.id,cr.roomname,
  cr.roomdescription,cr.roompasskey,
 cr.selectmode, cr.selecttype,cr.creatorid  order by  coalesce(members_count,0) desc  limit 10  ;`;
  db.query(sql,[yourid],(err,result)=>{
    if(err){
      console.log(err.message);
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

app.post('/api/videoupload',uploadVideo.single('video'),(req,res)=>{
  if(!req.file){
return res.status(400).json({message:'No file uploaded'})
  }
  const VideoUrl=req.file.path;
  res.json({VideoUrl})

  })


  
app.post(
  "/api/uploads/images",
  uploadImage.array("images", 10), // up to 10 images
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const imageUrls = req.files.map(
      file => file.path
    );

    res.json({ imageUrls });
  }
);
app.post(
  "/api/uploads/videos",
  uploadVideo.array("videos", 10), // up to 10 images
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const videoUrls = req.files.map(
      file => file.path
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
   from roomposts cr  inner join projecttables a on cr.sender_id=a.ID where cr.room_of_posts_id=? order by  cr.posted_at desc 
   limit 20 `,[roomid],(err,result)=>{
if(err){
  res.status(500).json({error:'An error occured'})
}
res.json(result)
   })
})
app.get('/getroomolder',(req,res)=>{
  const {lasttime,roomid}=req.query;
db.query(`select cr.id,cr.sender_id,cr.post,cr.posted_at,cr.room_of_posts_id,
cr.postvideo,cr.postimage,a.USERNAME as usersname,a.FULLNAME as fullname,a.image 
 from roomposts cr  inner join projecttables a on cr.sender_id=a.ID where cr.room_of_posts_id=? and cr.posted_at< ?
order by  cr.posted_at desc 
 limit 20 `,[roomid,lasttime],(err,result)=>{
  if(err){
   return res.status(500).json({error:'A database error occured'})
  }
  res.json(result)
 })
})
app.get('/getroomlater',(req,res)=>{
  const {checktime,roomid}=req.query;
db.query(`select cr.id,cr.sender_id,cr.post,cr.posted_at,cr.room_of_posts_id,
cr.postvideo,cr.postimage,a.USERNAME as usersname,a.FULLNAME as fullname,a.image 
 from roomposts cr  inner join projecttables a on cr.sender_id=a.ID where cr.room_of_posts_id=? and cr.posted_at> ?
order by  cr.posted_at desc 
 limit 20 `,[roomid,checktime],(err,result)=>{
  if(err){
   return res.status(500).json({error:'A database error occured'})
  }
  res.json(result)
 })
})
const roomOnlineUsers = new Map();
io.on('connection', (socket) => {
  let roomid = null;
  // const userId = socket.handshake.query.userId;

  // console.log('user connected:', userId);

  socket.on('joingrouproom', ({ receiveroomid, usersValue }) => {
    roomid = receiveroomid;
    socket.userId = usersValue; 
    socket.join(`room-${roomid}`);
  
    if (!roomOnlineUsers.has(receiveroomid)) {
      roomOnlineUsers.set(receiveroomid, new Set());
    }
  
    roomOnlineUsers.get(receiveroomid).add(usersValue);
  
    io.to(`room-${roomid}`).emit(
      'online-count',
      roomOnlineUsers.get(receiveroomid).size
    );
    console.log( roomOnlineUsers.get(receiveroomid).size);
  });
  socket.on('Pushpost',({searchid,roomid,posttext,sentimage,sentvideo})=>{
    db.query(
      `INSERT INTO roomposts(sender_id, post, room_of_posts_id, postvideo, postimage) 
       VALUES (?, ?, ?, ?, ?)`,
      [searchid, posttext, roomid, JSON.stringify(sentvideo), JSON.stringify(sentimage)],
      (err, result) => {
        if (err) {
          console.log(err); 
          return 
        }
        db.query(`select cr.id,cr.sender_id,cr.post,cr.posted_at,cr.room_of_posts_id,
        cr.postvideo,cr.postimage,a.USERNAME as usersname,a.FULLNAME as fullname,a.image 
         from roomposts cr  inner join projecttables a on cr.sender_id=a.ID where cr.room_of_posts_id=? and cr.sender_id=? and cr.id=? ;`,[roomid,searchid,result.insertId],
         (err,pushresult)=>{
          if (err) {
            console.log(err); 
            return 
          }
          io.to(`room-${roomid}`).emit('PushResponse',pushresult[0])
         })
      }
    );
  })

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

            io.to(`room-${roomid}`).emit('getimage', result[0].room_image);
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

            io.to(`room-${roomid}`).emit('gottenbio', result[0].roombio);
          }
        );
      }
    );
  });

  socket.on('RoomComment',(data)=>{
    const {postid,roomid,usersId,comment,replycommentid,replyusersid,replyuserstext}=data;
    if(!postid || !roomid || !usersId || !comment) return
    db.query(`
    insert into commenting(commenttext,senderid,room_of_posts_id,postid,replyid,replyuserid,replytext)values(?,?,?,?,?,?,?)`,[comment,usersId,roomid,postid,replycommentid,replyusersid,replyuserstext],(err,insertresult)=>{
      if(err){
        console.log('A database error occured while inserting room comment');
        return;
      }
      const insertid=insertresult.insertId
      db.query(`select cr.id,cr.commenttext,cr.senderid,cr.posted_at,cr.replyid,cr.replytext ,a.USERNAME as usersname ,a.FULLNAME as usersfull, a.image,b.image 
      as replyUserImage,b.FULLNAME as replyUserName  from commenting cr join projecttables a 
 on a.ID=cr.senderid left join projecttables b on b.ID=cr.replyuserid where cr.id=? and cr.postid=? and cr.room_of_posts_id=?;`,[insertid,postid,roomid],(err,result)=>{
        if(err){
          console.log('A databse error occured while inserthing room comment');
          return;
        }
        io.to(`room-${roomid}`).emit('ReleaseComment',{
          postid,newComment:result[0]
        })
      })
    })
  })
  socket.on('leavegrouproom', () => {
    if (!roomid || !socket.userId) return;
  
    const users = roomOnlineUsers.get(roomid);
    if (!users) return;
  
    users.delete(socket.userId);
  
    io.to(`room-${roomid}`).emit('online-count', users.size);
  
    if (users.size === 0) {
      roomOnlineUsers.delete(roomid);
    }
  });
  socket.on('disconnect', () => {
    if (!roomid || !socket.userId) return;
  
    const users = roomOnlineUsers.get(roomid);
    if (!users) return;
  
    users.delete(socket.userId);
  
    io.to(`room-${roomid}`).emit('online-count', users.size);
  
    if (users.size === 0) {
      roomOnlineUsers.delete(roomid);
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
  inner join projecttables a on cr.userid=a.ID where cr.roomid=? order by cr.joined desc limit 5`,[roomidforimage],(err,result)=>{
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
  res.json(result)
  })
})
app.get('/fetchcommentlikestate',(req,res)=>{
  const {user,comment}=req.query;
  db.query(`select * from roomcommentlikes where user_id=? and commentid=?`,[user,comment],(err,result)=>{
    if(err){
     return res.status(500).json({error:err.message})
    }
  res.json(result)
  })
})
app.get('/fetchlikes',(req,res)=>{
  const {room}=req.query;
  db.query(`select roomid,count(roomid) as roomlikenum from roomlikes where roomid=? group by roomid ;`,[room],(err,result)=>{
    if(err){
    return  res.status(500).json({error:err.message})
    }
  res.json({count:result[0]?.roomlikenum || 0})
  })
})
app.get('/fetchcommentlikes',(req,res)=>{
  const {comment}=req.query;
  db.query(`select commentid,count(commentid) as commentlikenum from roomcommentlikes where commentid=? group by commentid ;`,[comment],(err,result)=>{
    if(err){
    return  res.status(500).json({error:err.message})
    }
  res.json({count:result[0]?.commentlikenum || 0})
  })
})
app.post('/addroomlikes',(req,res)=>{
  const {searchid,roomdetais}=req.body;
  db.query(`INSERT IGNORE INTO roomlikes(userid,roomid) VALUES(?,?)`,[searchid,roomdetais],(err,result)=>{
    if(err){
      return  res.status(500).json({error:err.message})
      }    
      res.status(200).json({success:true})
      console.log('yes');
  })

})
app.post('/addcommentroomlikes',(req,res)=>{
  const {userisId,commentid}=req.body;
  db.query(`INSERT IGNORE INTO roomcommentlikes(user_id,commentid) VALUES(?,?)`,[userisId,commentid],(err,result)=>{
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
app.post('/removecommentroomlikes',(req,res)=>{
  const {userisId,commentid}=req.body;
  db.query(`delete from roomcommentlikes where user_id=? and commentid=?`,[userisId,commentid],(err,result)=>{
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

  if (!roomid || !search || !search.trim()) {
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


app.get('/memberscount', (req,res)=>{
  const {roomid}=req.query;
  db.query(
    `SELECT COUNT(*) AS userscount FROM roomparticipants WHERE roomid=?;`,
    [roomid],
    (err,result)=>{
      if(err){
        return res.status(500).json({error: err.message});
      }
      res.json({ members: result[0].userscount }); // wrap in an object
    }
  );
});


io.on('connection', (socket) => {
  let roomValueId = null;

  socket.on('JoinViewMembers', (roomValue) => {
    if (!roomValue) return;
    console.log('socket joined room_', roomValue);
    roomValueId = roomValue;
    socket.join(`room_${roomValue}`);
  });

  socket.on('MakeAdmin', ({ userid, roomid, senderid }) => {
    if (!userid || !roomid || !senderid) return;
  
    db.query(
      `SELECT creatorid FROM createinterestroom WHERE id=?`,
      [roomid],
      (err, result) => {
        if (err || !result.length) return;
        if (Number(result[0].creatorid) !== Number(senderid)) return;
  
        db.query(
          `SELECT isAdmin FROM roomparticipants WHERE userid=? AND roomid=?`,
          [userid, roomid],
          (err, result) => {
            if (err || !result.length || result[0].isAdmin === 1) return;
  
            db.query(
              `UPDATE roomparticipants SET isAdmin=1 WHERE userid=? AND roomid=?`,
              [userid, roomid],
              () => emitMembers(roomid)
            );
          }
        );
      }
    );
  });
  
  

  socket.on('RemoveAdmin', ({ userid, roomid, senderid }) => {
    if (!userid || !roomid || !senderid) return;
  
    db.query(
      `SELECT creatorid FROM createinterestroom WHERE id=?`,
      [roomid],
      (err, result) => {
        if (err || !result.length) return;
        if (Number(result[0].creatorid) !== Number(senderid)) return;
  
        db.query(
          `SELECT isAdmin FROM roomparticipants WHERE userid=? AND roomid=?`,
          [userid, roomid],
          (err, result) => {
            if (err || !result.length || result[0].isAdmin === 0) return;
  
            db.query(
              `UPDATE roomparticipants SET isAdmin=0 WHERE userid=? AND roomid=?`,
              [userid, roomid],
              () => emitMembers(roomid)
            );
          }
        );
      }
    );
  });
  
  
  socket.on('RemoveMember', ({ userid, roomid, senderid }) => {
    if (!userid || !roomid || !senderid) return;
  
    db.query(
      `SELECT creatorid FROM createinterestroom WHERE id=?`,
      [roomid],
      (err, result) => {
        if (err || !result.length) return;
  
        // 🔒 Permission check
        if (Number(result[0].creatorid) !== Number(senderid)) return;
  
        db.query(
          `DELETE FROM roomparticipants WHERE userid=? AND roomid=?`,
          [userid, roomid],
          () => emitMembers(roomid, true)
        );
      }
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
        io.to(`room_${roomid}`).emit(
          isDelete ? 'UpdateAfterDelete' : 'UpdateAfterAdmin',
          result
        );
      }
    );
  }
  socket.on('disconnect', () => {
    if (roomValueId) {
      socket.leave(`room_${roomValueId}`);
    }
  });
  
  
});
app.post('/leaveroom',(req,res)=>{
  const {roomid,searchid}=req.body;
db.query(`delete from roomparticipants where roomid=? and userid=?`,[roomid,searchid],(err,result)=>{
  if(err){
    return res.status(500).json({error:'Database Error'})
  }
  res.status(200).json({success:true})
})
})

app.post('/Deleteroom',(req,res)=>{
  const {roomid,searchid}=req.body;
db.query(`delete from createinterestroom where id=? and creatorid=?`,[roomid,searchid],(err,result)=>{
  if(err){
    return res.status(500).json({error:'Database Error'})
  }
  db.query(`delete from roomparticipants where roomid=?`,[roomid],(err,result)=>{
    if(err){
      return res.status(500).json({error:'Database Error'})
    }
    res.status(200).json({success:true})
  })
})
})
app.get('/fetchpostcomment',(req,res)=>{
  const {postid,roomid,userIs}=req.query;
  
  db.query(`SELECT 
  cr.id,
  cr.commenttext,
  cr.senderid,
  cr.posted_at,
  cr.replyid,
  cr.replytext,
  
  a.USERNAME as usersname,
  a.FULLNAME as usersfull,
  a.image,
  
  b.image as replyUserImage,
  b.FULLNAME as replyUserName,
  
  (
  SELECT COUNT(*)
  FROM roomcommentlikes
  WHERE user_id = ?
  AND commentid = cr.id
  ) as likestate,
  
  (
  SELECT COUNT(*)
  FROM roomcommentlikes
  WHERE commentid = cr.id
  ) as likecount
  
  FROM commenting cr
  
  JOIN projecttables a 
  ON a.ID = cr.senderid
  
  LEFT JOIN projecttables b 
  ON b.ID = cr.replyuserid
  
  WHERE cr.postid = ?
  AND cr.room_of_posts_id = ? order by likecount desc limit 15 ;`,[userIs, postid, roomid],(err,result)=>{
    if(err){
      return res.status(500).json({error:'A database Error occured'})
    }
    res.json(result)
  })
})
app.get('/getcommentolder',(req,res)=>{
  const {lasttime,postid,roomid,userIs}=req.query;
  
  db.query(`SELECT 
  cr.id,
  cr.commenttext,
  cr.senderid,
  cr.posted_at,
  cr.replyid,
  cr.replytext,
  
  a.USERNAME as usersname,
  a.FULLNAME as usersfull,
  a.image,
  
  b.image as replyUserImage,
  b.FULLNAME as replyUserName,
  
  (
  SELECT COUNT(*)
  FROM roomcommentlikes
  WHERE user_id = ?
  AND commentid = cr.id
  ) as likestate,
  
  (
  SELECT COUNT(*)
  FROM roomcommentlikes
  WHERE commentid = cr.id
  ) as likecount
  
  FROM commenting cr
  
  JOIN projecttables a 
  ON a.ID = cr.senderid
  
  LEFT JOIN projecttables b 
  ON b.ID = cr.replyuserid
  
  WHERE cr.postid = ?
  AND cr.room_of_posts_id = ? and cr.posted_at<? order by likecount desc limit 15 ;`,[userIs, postid, roomid,lasttime],(err,result)=>{
    if(err){
      return res.status(500).json({error:'A database Error occured'})
    }
    res.json(result)
  })
})
app.get('/isFollowingformembers',(req,res)=>{
  const {senderid}=req.query;
  db.query(`SELECT receiver_id 
  FROM follows 
  WHERE sender_id = ?
  `,[senderid],(err,result)=>{
    if(err){
      return res.status(500).json({error:'A database Error occured'})
    }
    res.json(result)
  })
})
app.post('/deleteroompostlogic',(req,res)=>{
  const {roomdetais,searchid}=req.body;
  db.query('delete from roomposts where id=? and sender_id=?',[roomdetais,searchid],(err,result)=>{
    if(err){
      return res.status(500).json({error:'An error ocuured'})
    }
    res.status(200).json({success:true})
  })
})
app.get('/roomstats',(req,res)=>{
  db.query(`select (select count(*) from createinterestroom) as amountofrooms ,
   (select count(userid) from roomparticipants) as amountofusers `,(err,result)=>{
    if(err){
      return res.status(500).json({error:`A database Error occured`})
    }
    res.json(result)
   })
})
app.post('/removeroomcomment',(req,res)=>{
  const {commentid,thepostid,Roomid}=req.body;
  db.query(`delete from commenting where room_of_posts_id=? and postid=? and id=?`,[Roomid,thepostid,commentid],(err,result)=>{
    if(err){
      res.status(500).json({error:'A database error occured'})
    }
    res.status(200).json({success:true})
  })
})
app.post('/increasecampuslikes',(req,res)=>{
  const {campusid,myUserId}=req.body;
  db.query(`insert ignore into campuslikes(userid,pulseid)values(?,?) `,[myUserId,campusid],(err,result)=>{
    if(err){
      return res.status(500).json({error:'An error occured while increasing campuslikes'})
    }
    res.status(200).json({success:true})
  })
})
app.post('/decreasecampuslikes',(req,res)=>{
  const {campusid,myUserId}=req.body;
  db.query(`delete from campuslikes where userid=? and pulseid=? `,[myUserId,campusid],(err,result)=>{
    if(err){
      return res.status(500).json({error:'An error occured while increasing campuslikes'})
    }
    res.status(200).json({success:true})
  })
})

app.post('/clearchat', (req, res) => {
  const { myUserId, recipientId } = req.body;
  if (!myUserId || !recipientId) return res.status(400).json({ error: 'Missing IDs' });

  const sql = `
      DELETE FROM messages
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
  `;
  db.query(sql, [myUserId, recipientId, recipientId, myUserId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to clear chat' });
      io.to(connectedUsers.get(String(recipientId)))?.emit('chat_cleared', { by: myUserId });
      res.json({ success: true });
  });
});
const isMod = (req, res, next) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (user.role !== 'mod' && user.role !== 'Admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  next();
};

// ── Submit a report ──
app.post('/postreport', (req, res) => {
  const { senderId, reporthead, reportedname, reason, details } = req.body;

  if (!senderId || !reporthead || !reportedname || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // BUG FIX: ON DUPLICATE KEY only works if you have a UNIQUE constraint
  // on (reportidentity, reportname, reason) — see note above
  db.query(
    `INSERT INTO reports
      (reporterid, reportidentity, reportname, reason, alternatetext, reportstate, reportcount, reporttime)
     VALUES (?, ?, ?, ?, ?, 'pending', 1, NOW())
     ON DUPLICATE KEY UPDATE
       reportcount = reportcount + 1,
       reporttime  = NOW()`,
    [senderId, reporthead, reportedname, reason, details ?? null],
    (err) => {
      if (err) {
        console.error('Insert report error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json({ success: true });
    }
  );
});

// ── Fetch all reports — mod only ──
// BUG FIX: added isMod middleware + reporttime in SELECT
app.get('/modreports', isMod, (req, res) => {
  db.query(
    `SELECT 
       n.*,
       n.reporttime,
       a.USERNAME AS reporter_name
     FROM reports n
     LEFT JOIN projecttables a ON a.ID = n.reporterid
     WHERE n.reportstate = 'pending'
     ORDER BY n.reportcount DESC, n.reporttime DESC`,
    (err, result) => {
      if (err) {
        console.error('Fetch reports error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(result);
    }
  );
});

// ── Fetch stats separately ──
app.get('/modreports/stats', isMod, (req, res) => {
  db.query(
    `SELECT
       SUM(reportstate = 'pending')  AS pending,
       SUM(reportstate = 'inReview') AS inReview,
       SUM(reportstate = 'resolved') AS resolved
     FROM reports`,
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(result[0]);
    }
  );
});

// ── Dismiss a report ──
app.post('/modreports/:id/dismiss', isMod, (req, res) => {
  db.query(
    `UPDATE reports SET reportstate = 'resolved' WHERE id = ?`,
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(200).json({ success: true });
    }
  );
});


app.post('/modreports/warn', isMod, (req, res) => {
  const { theid, sender, message } = req.body;

  if (!theid || !sender || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  db.query(
    `INSERT INTO notifications (sender_id, receiver_id, message, type, is_read)
     VALUES (?, ?, ?, 'warning', 0)`,
    [null, sender, message],
    (err) => {
      if (err) {
        console.error('Warn notification error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.query(
        `UPDATE reports SET reportstate = 'inReview' WHERE id = ?`,
        [theid],
        (err) => {
          if (err) {
            console.error('Update report state error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // BUG FIX: emit AFTER both DB operations succeed
          // BUG FIX: sender is the reported user's ID — emit to their socket
          const userSocket = connectedUsers.get(String(sender));
          if (userSocket) {
            io.to(userSocket).emit('newNotification', {
              message,
              type: 'warning',
            });
          }

          res.status(200).json({ success: true });
        }
      );
    }
  );
});

// ── Remove reported content ──
// Removes the content itself + resolves the report
app.post('/modreports/:id/remove', isMod, (req, res) => {
  const { reportidentity, reportname, reporterid } = req.body;

  let deleteQuery = '';
  let deleteParams = [];

  if (reportidentity === 'user') {
    // Suspend/flag user rather than hard delete
    deleteQuery = `UPDATE projecttables SET suspended = 1 WHERE id = ?`;
    deleteParams = [reporterid];
  } else if (reportidentity === 'room') {
    deleteQuery = `DELETE FROM interestrooms WHERE id = ?`;
    deleteParams = [reporterid];
  } else if (reportidentity === 'story') {
    deleteQuery = `DELETE FROM campuspulse WHERE ID = ?`;
    deleteParams = [reporterid];
  } else {
    return res.status(400).json({ error: 'Unknown report type' });
  }

  db.query(deleteQuery, deleteParams, (err) => {
    if (err) {
      console.error('Remove content error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    db.query(
      `UPDATE reports SET reportstate = 'resolved' WHERE id = ?`,
      [req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ success: true });
      }
    );
  });
});




// ✅ Render assigns the port dynamically
const PORT = process.env.DB_PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));

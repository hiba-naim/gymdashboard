import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database initialization
const dbPath = path.join(__dirname, 'gym_dashboard.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database connected successfully');
    initializeDatabase();
    seedUsers();
  }
});

// Promisify database methods
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Create tables
function initializeDatabase() {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      member_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
  });

  // Create activity_logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      activity TEXT NOT NULL,
      activity_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating activity_logs table:', err);
    else console.log('Database tables initialized');
  });
}

// Seed users (with hashed passwords)
function seedUsers() {
  setTimeout(() => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        console.error('Error checking users:', err);
        return;
      }

      if (row.count === 0) {
        console.log('No users found. Run: npm run seed-users');
        console.log('This will create accounts for all 1000 members from the CSV file');
      }
    });
  }, 500);
}

// Logging utility
function logActivity(username, activity) {
  try {
    const logEntry = `[${new Date().toISOString()}] User: ${username}, Activity: ${activity}\n`;
    const logsDir = path.join(__dirname, 'logs');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
    
    const logFilePath = path.join(logsDir, 'activities.log');
    fs.appendFileSync(logFilePath, logEntry);
    
    // Also save to database
    db.run('INSERT INTO activity_logs (username, activity) VALUES (?, ?)', 
      [username, activity],
      (err) => {
        if (err) console.error('Error logging to database:', err);
      }
    );
  } catch (error) {
    console.error('Error logging activity:', error.message);
  }
}

// Routes

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Get user from database
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      logActivity(username, 'Failed login attempt - user not found');
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Compare passwords
    const isPasswordValid = bcryptjs.compareSync(password, user.password);

    if (!isPasswordValid) {
      logActivity(username, 'Failed login attempt - invalid password');
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Successful login
    logActivity(username, `Logged in successfully (Role: ${user.role})`);
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        member_id: user.member_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check auth endpoint
app.post('/api/check-auth', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (username) {
      const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
      
      if (user) {
        res.json({ authenticated: true, username: user.username });
      } else {
        res.json({ authenticated: false });
      }
    } else {
      res.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ authenticated: false });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  try {
    const { username } = req.body;
    logActivity(username, 'Logged out');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get activity logs endpoint (for testing/admin)
app.get('/api/activity-logs', async (req, res) => {
  try {
    const logs = await dbAll('SELECT * FROM activity_logs ORDER BY activity_date DESC LIMIT 50', []);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Database location: ${dbPath}`);
  console.log(`✓ API endpoints ready`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST /api/login - Login with username and password`);
  console.log(`  POST /api/logout - Logout user`);
  console.log(`  GET /api/activity-logs - Get activity logs`);
  console.log(`  GET /api/health - Server health check\n`);
});

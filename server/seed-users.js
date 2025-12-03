import sqlite3 from 'sqlite3';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read CSV file manually
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  const members = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const values = lines[i].split(',');
    const member = {};
    
    headers.forEach((header, index) => {
      member[header.trim()] = values[index]?.trim() || '';
    });
    
    members.push(member);
  }

  return members;
}

const dbPath = path.join(__dirname, 'gym_dashboard.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }

  // Parse CSV
  const csvPath = path.join(__dirname, '../public/gym_membership.csv');
  console.log('Reading CSV file...');
  const members = parseCSV(csvPath);
  console.log(`Found ${members.length} members in CSV`);

  // Create tables if not exist
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

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      activity TEXT NOT NULL,
      activity_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating activity_logs table:', err);
  });

  // Check existing user count
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      console.error('Error checking users:', err);
      process.exit(1);
    }

    if (row.count === 0) {
      console.log('Creating user accounts for all members...');
      let createdCount = 0;
      let errorCount = 0;

      // Create user for each member
      members.forEach((member, index) => {
        const memberId = parseInt(member.id);
        const username = `user_${memberId}`;
        const password = `pass_${memberId}`;
        const hashedPassword = bcryptjs.hashSync(password, 10);

        db.run(
          'INSERT INTO users (username, password, role, member_id) VALUES (?, ?, ?, ?)',
          [username, hashedPassword, 'user', memberId],
          (err) => {
            if (err) {
              if (!err.message.includes('UNIQUE')) {
                console.error(`Error creating user_${memberId}:`, err.message);
                errorCount++;
              }
            } else {
              createdCount++;
              if (createdCount % 100 === 0) {
                console.log(`  Created ${createdCount} users...`);
              }
            }

            // If this is the last member, create admin and exit
            if (index === members.length - 1) {
              setTimeout(() => {
                const adminPassword = bcryptjs.hashSync('admin456', 10);
                db.run(
                  'INSERT INTO users (username, password, role, member_id) VALUES (?, ?, ?, ?)',
                  ['admin', adminPassword, 'admin', null],
                  (err) => {
                    if (err && !err.message.includes('UNIQUE')) {
                      console.error('Error creating admin:', err);
                    }

                    setTimeout(() => {
                      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                        console.log('\n✓ User seeding completed!');
                        console.log(`✓ Total users created: ${row.count}`);
                        console.log(`✓ Members: user_1 to user_${members.length}`);
                        console.log(`✓ Login format: user_ID / pass_ID (e.g., user_1 / pass_1)`);
                        console.log(`✓ Admin: admin / admin456`);
                        db.close();
                        process.exit(0);
                      });
                    }, 500);
                  }
                );
              }, 500);
            }
          }
        );
      });
    } else {
      console.log(`Database already has ${row.count} users. Skipping seeding.`);
      db.close();
      process.exit(0);
    }
  });
});

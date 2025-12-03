# Testing Guide - Gym Dashboard

## User Account System

All **1000 gym members** have been automatically converted into user accounts. Each member can now log in and see their personal gym data.

### How to Access

**Frontend:** http://localhost:5173/
**Backend API:** http://localhost:5000/

---

## User Credentials

### Format
```
Username: user_ID
Password: pass_ID
```

### Examples
- **Member 1:** `user_1` / `pass_1` → Views Member 1's data
- **Member 2:** `user_2` / `pass_2` → Views Member 2's data
- **Member 50:** `user_50` / `pass_50` → Views Member 50's data
- **Member 500:** `user_500` / `pass_500` → Views Member 500's data
- **Member 1000:** `user_1000` / `pass_1000` → Views Member 1000's data

### Admin Account
```
Username: admin
Password: admin456
Role: Administrator
```

Admin can:
- View the dashboard with all 1000 members
- Click "View" button on any member to see their detailed profile

---

## What Each User Can See

When logged in as a regular user (e.g., `user_15`), they see their personal profile with:

- **Personal Information**: Gender, Age, Subscription Type
- **Activity Statistics**: 
  - Visits per week
  - Average check-in/check-out times
  - Total gym time (minutes)
- **Services**: Personal training, Sauna access
- **Group Classes**: Preferred classes (BodyPump, Yoga, Zumba, etc.)
- **Weekly Schedule**: Which days they typically visit
- **Lessons**: Personal training details
- **Drinks**: Favorite drinks and beverage subscription status

---

## Testing Workflow

### 1. Test Individual Member Access
1. Open http://localhost:5173/
2. Log in with any user: e.g., `user_1` / `pass_1`
3. Verify you see that member's data (gender, age, visits, etc.)
4. Log out

### 2. Test Admin Dashboard
1. Log in with `admin` / `admin456`
2. See dashboard with all 1000 members in a table
3. Click "View" on any member to see their details
4. Navigate back to dashboard

### 3. Spot Check Random Members
```
user_10 / pass_10    → Member 10's profile
user_100 / pass_100  → Member 100's profile
user_505 / pass_505  → Member 505's profile
user_999 / pass_999  → Member 999's profile
```

### 4. Verify Data Consistency
- Login as a member user
- Check that their displayed data matches the CSV file
- All 1000 members should have complete profiles

---

## Database Information

**Location:** `server/gym_dashboard.db`

**User Credentials Setup:**
```javascript
// Each of the 1000 members has:
- username: user_1, user_2, ..., user_1000
- password: bcryptjs-hashed (pass_1, pass_2, ..., pass_1000)
- role: 'user'
- member_id: 1, 2, ..., 1000 (links to CSV data)
```

**Admin Account:**
```javascript
- username: admin
- password: bcryptjs-hashed (admin456)
- role: 'admin'
- member_id: null (can access all members)
```

---

## Activity Logging

Every login attempt is logged with:
- Timestamp
- Username
- Success/Failure status
- User role

**Log Files:**
- Console output when logging in
- Database: `activity_logs` table
- File: `server/logs/activities.log`

---

## Backend Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/login` | POST | Authenticate user |
| `/api/logout` | POST | Log out user |
| `/api/activity-logs` | GET | View activity history |
| `/api/health` | GET | Server health check |

---

## Quick Start

### First Time Setup
```bash
# Backend
cd server
npm run seed-users  # Creates all 1000 users (1-time only)
npm start

# Frontend (new terminal)
npm run dev
```

### Subsequent Runs
```bash
# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend
npm run dev
```

---

## Troubleshooting

### "User not found" error
- Check the username format: `user_ID` (e.g., `user_1`, not `user1`)
- Verify the ID is between 1-1000

### Can't see member data
- Ensure you're logged in as the correct user for that member ID
- Admin can view any member via the dashboard View button

### Servers not running
```bash
# Check if ports are in use
# Kill node processes and restart
Get-Process node | Stop-Process -Force
npm start
npm run dev
```

### Database issues
```bash
# Reset database and re-seed (⚠️ loses login history)
rm server/gym_dashboard.db
npm run seed-users
npm start
```

---

## Architecture

```
Frontend (React, Vite) → http://localhost:5173
         ↓ (HTTP)
Backend (Express.js) → http://localhost:5000
         ↓ (SQL)
Database (SQLite) → server/gym_dashboard.db
         ↓ (Read)
CSV Data → public/gym_membership.csv (1000 member records)
```

Each member's user account is linked to their CSV record via `member_id`.

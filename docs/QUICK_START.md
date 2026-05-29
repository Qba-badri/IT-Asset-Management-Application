# Quick Start Guide - IT Asset Management

## Prerequisites
- PostgreSQL 18+ installed and running
- Node.js installed
- Frontend already running at http://localhost:3000

## Step 1: Set Up PostgreSQL Database

### Option A: Using setup-database.bat (Windows)
1. Edit `setup-database.bat` and update the PostgreSQL password if needed
2. Double-click `setup-database.bat` to run
3. Enter your PostgreSQL password when prompted

### Option B: Manual Setup
1. Open PostgreSQL command prompt or pgAdmin
2. Create database:
```sql
CREATE DATABASE "IT Asset Management" ENCODING 'UTF8';
```
3. Run the SQL script:
```bash
psql -U postgres -d "IT Asset Management" -f database/init.sql
```

## Step 2: Configure Backend

1. Edit `backend/.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=IT Asset Management
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
PORT=3000
```

## Step 3: Start Backend Server

```bash
cd backend
npm run start:dev
```

The backend API will run on `http://localhost:3000`

## Step 4: Frontend is already running

Frontend is available at `http://localhost:3000` (React dev server)

## API Endpoints Available

- `POST /auth/login` - User login
- `POST /auth/forgot-password` - Request password reset OTP
- `POST /auth/verify-otp` - Verify OTP code
- `POST /auth/reset-password` - Reset password

## Test Login

You can test the API using Postman or curl. First, you'll need to:
1. Create a test user in the database:
```sql
INSERT INTO users (email, password_hash, first_name, last_name, is_verified)
VALUES ('test@example.com', '$2b$10$...hashed_password...', 'Test', 'User', true);
```

2. Then test login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### Database Connection Error
- Check if PostgreSQL is running
- Verify credentials in .env file
- Ensure database name matches exactly

### Port Already in Use
- Backend default port: 3000
- Frontend default port: 3000
- Change PORT in backend/.env if needed

### Module Not Found Errors
- Run `npm install --legacy-peer-deps` in backend folder
- Delete node_modules and package-lock.json, then reinstall

## Next Steps
1. ✅ Frontend login page running
2. ✅ Backend API ready
3. 🔄 Create seed users in database
4. 🔄 Implement email notifications
5. 🔄 Add JWT token refresh logic
6. 🔄 Create asset management features

## Project Structure
```
IT Asset Management/
├── frontend/           # React app (port 3000)
├── backend/            # NestJS API (port 3000)
├── database/
│   └── init.sql        # Database initialization script
├── DATABASE_SETUP.md   # Detailed database setup
└── setup-database.bat  # Windows setup script
```

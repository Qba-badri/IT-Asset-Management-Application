# IT Asset Management Database Setup Guide

## PostgreSQL Installation & Setup

### Step 1: Install PostgreSQL

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Set a password for the `postgres` user (remember this!)
4. Choose port 5432 (default)
5. Install pgAdmin 4 (optional but recommended)

**Verify Installation:**
```bash
psql --version
```

### Step 2: Create Database and User

**Option A: Using pgAdmin 4 (GUI)**
1. Open pgAdmin 4
2. Connect to the server
3. Right-click on "Databases" and select "Create" → "Database"
4. Enter name: `IT Asset Management`
5. Click "Save"

**Option B: Using Command Line**
```bash
psql -U postgres

# Then in psql terminal:
CREATE DATABASE "IT Asset Management" ENCODING 'UTF8';
```

### Step 3: Create Tables

Run the SQL initialization script:

```bash
psql -U postgres -d "IT Asset Management" -f database/init.sql
```

Or copy and paste the contents of `database/init.sql` in pgAdmin Query Editor.

**Tables Created:**
- `users` - User login details and profile information
- `password_reset_tokens` - OTP tokens for password reset
- `audit_logs` - Audit trail for system actions

## Backend Setup

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

Edit `.env` file with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=IT Asset Management

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production

# Application Configuration
NODE_ENV=development
PORT=3000
```

### Step 3: Start the Backend Server

**Development Mode:**
```bash
npm run start:dev
```

**Production Mode:**
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication Endpoints

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Forgot Password (Request OTP)
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "message": "OTP sent to your email",
  "success": true
}
```

#### Verify OTP
```
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Response:
{
  "message": "OTP verified successfully",
  "success": true
}
```

#### Reset Password
```
POST /auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}

Response:
{
  "message": "Password reset successfully",
  "success": true
}
```

## Database Schema

### Users Table
```
id (SERIAL PRIMARY KEY)
email (VARCHAR(255) UNIQUE NOT NULL)
password_hash (VARCHAR(255) NOT NULL)
first_name (VARCHAR(100))
last_name (VARCHAR(100))
is_active (BOOLEAN DEFAULT true)
is_verified (BOOLEAN DEFAULT false)
last_login (TIMESTAMP)
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
deleted_at (TIMESTAMP)
```

### Password Reset Tokens Table
```
id (SERIAL PRIMARY KEY)
user_id (INTEGER FOREIGN KEY)
token (VARCHAR(255) UNIQUE NOT NULL)
otp (VARCHAR(10))
expires_at (TIMESTAMP NOT NULL)
is_used (BOOLEAN DEFAULT false)
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

### Audit Logs Table
```
id (SERIAL PRIMARY KEY)
user_id (INTEGER FOREIGN KEY)
action (VARCHAR(50) NOT NULL)
entity_type (VARCHAR(50))
entity_id (INTEGER)
old_values (JSONB)
new_values (JSONB)
ip_address (VARCHAR(50))
user_agent (TEXT)
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

## Testing the Database

### Connect to Database
```bash
psql -U postgres -d "IT Asset Management"
```

### View Tables
```sql
\dt
```

### Query Users Table
```sql
SELECT * FROM users;
```

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL service is running
- Verify credentials in `.env` file
- Check if port 5432 is not blocked by firewall

### Database Not Found
- Make sure database name matches exactly (case-sensitive)
- Run the init.sql script again

### Permission Denied
- Ensure postgres user has proper permissions
- Try connecting with admin credentials

## Next Steps

1. ✅ Database created and configured
2. ✅ Backend API set up with authentication
3. 🔄 Create seed data for testing
4. 🔄 Implement email notifications for OTP
5. 🔄 Add JWT authentication middleware
6. 🔄 Create additional API endpoints for asset management

## Security Notes

- Change `JWT_SECRET` in production
- Use strong passwords for database users
- Enable SSL for database connections in production
- Implement rate limiting on auth endpoints
- Hash passwords using bcrypt (already implemented)
- Validate all inputs using class-validator (already implemented)

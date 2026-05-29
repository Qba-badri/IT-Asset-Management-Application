# IT Asset Management System - Complete Documentation

## Table of Contents
1. [Features](#features)
2. [Architecture](#architecture)
3. [Development Guide](#development-guide)
4. [API Documentation](#api-documentation)
5. [Deployment](#deployment)
6. [Security](#security)

---

## Features

### Core Asset Management
- **Asset Tracking**: Comprehensive tracking of IT assets including computers, laptops, mobile devices, servers, and network equipment
- **Asset Lifecycle**: Track assets from procurement to disposal
- **Depreciation Calculator**: Automatic depreciation calculation based on configurable methods
- **Asset Assignment**: Assign assets to users, departments, or locations
- **Warranty Management**: Track warranty expiration and maintenance schedules

### License Management
- **Software License Tracking**: Track SaaS, cloud platform, on-premise, and perpetual licenses
- **License Types**: Support for user-based, device-based, site, usage, and concurrent licenses
- **License Categories**: SaaS, Cloud Platform, On-Prem Subscription, Perpetual, Maintenance
- **Billing Management**: Track costs, billing frequency (monthly, quarterly, yearly, one-time)
- **License Compliance**: Monitor license usage vs. available seats
- **Renewal Tracking**: Automatic renewal reminders and tracking

### Inventory Management
- **Stock Tracking**: Track inventory items like cables, accessories, chargers
- **Minimum Stock Alerts**: Get notified when stock falls below minimum levels
- **Supplier Management**: Track suppliers and procurement details

### User & Access Management
- **Role-Based Access Control (RBAC)**: Granular permission system
- **Azure AD Integration**: Sync users from Azure Active Directory
- **Multi-role Support**: Admin, Manager, Employee roles with customizable permissions
- **Audit Logging**: Track all user actions and changes

### Procurement & Workflow
- **Deployment Policies**: Category-specific deployment rules
- **Workflow Automation**: Automated workflows for asset requests and approvals
- **Vendor Management**: Track vendors, contacts, and monthly rentals

### Reporting & Analytics
- **Dashboard**: Real-time analytics and KPIs
- **Asset Reports**: Comprehensive asset reports by category, status, location
- **License Reports**: License utilization and compliance reports
- **Audit Reports**: Complete audit trail of all system changes
- **Depreciation Reports**: Asset depreciation tracking and reporting

### Additional Features
- **Responsive Design**: Mobile-friendly interface
- **Search & Filter**: Advanced search and filtering capabilities
- **Export Functionality**: Export data to CSV/Excel
- **File Attachments**: Attach documents and images to assets
- **Custom Fields**: Extensible data model for custom requirements

---

## Architecture

### Technology Stack

#### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL 18+
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator, class-transformer

#### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Radix UI
- **Charts**: ApexCharts
- **HTTP Client**: Axios
- **Routing**: React Router v6

### Database Schema

#### Core Entities
- **Users**: User accounts and authentication
- **Roles**: User roles (Admin, Manager, Employee)
- **Permissions**: Granular permissions
- **Assets**: IT assets and equipment
- **Licenses**: Software licenses
- **Inventory**: Stock items
- **Vendors**: Supplier information
- **Departments**: Organizational units
- **Locations**: Physical locations
- **Categories**: Asset categories
- **Brands**: Equipment brands

#### Supporting Entities
- **Assignments**: Asset-to-user assignments
- **AuditLogs**: System audit trail
- **LicenseAssignments**: License-to-user assignments
- **LicensePlans**: License plan templates
- **WorkflowRules**: Automated workflow rules
- **Settings**: System configuration

### API Structure

```
/api
├── /auth
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /forgot-password
│   ├── POST /reset-password
│   └── POST /change-password
├── /users
│   ├── GET /users
│   ├── POST /users
│   ├── GET /users/:id
│   ├── PUT /users/:id
│   └── DELETE /users/:id
├── /assets
│   ├── GET /assets
│   ├── POST /assets
│   ├── GET /assets/:id
│   ├── PUT /assets/:id
│   ├── DELETE /assets/:id
│   └── POST /assets/:id/assign
├── /licenses
│   ├── GET /licenses
│   ├── POST /licenses
│   ├── GET /licenses/:id
│   ├── PUT /licenses/:id
│   └── DELETE /licenses/:id
├── /inventory
├── /departments
├── /locations
├── /vendors
├── /analytics
└── /reports
```

---

## Development Guide

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 18+
- Git

### Initial Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd IT-Asset-Management
```

2. **Setup Database**
```bash
# Create PostgreSQL database
createdb "IT Asset Management"

# Or use the provided script
cd database
psql -U postgres -f init.sql
```

3. **Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# IMPORTANT: Set DB_PASSWORD and JWT_SECRET

# Run database seeds
npm run seed:permissions
npm run seed:masters

# Start development server
npm run start:dev
```

4. **Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm start
```

### Development Workflow

#### Running the Application
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm start
```

#### Code Quality
```bash
# Backend
npm run lint        # Run ESLint
npm run format      # Format with Prettier
npm run test        # Run tests
npm run test:cov    # Run tests with coverage

# Frontend
npm run build       # Build for production
npm test            # Run tests
```

#### Database Management
```bash
# Run seeds
npm run seed:permissions    # Seed permissions and roles
npm run seed:masters        # Seed master data (brands, vendors, etc.)

# Note: Migrations are managed by TypeORM synchronize in development
# For production, use proper migrations
```

### Project Structure

```
backend/
├── src/
│   ├── analytics/          # Analytics module
│   ├── assets/             # Asset management
│   ├── auth/               # Authentication
│   ├── entities/           # TypeORM entities
│   ├── licenses/           # License management
│   ├── users/              # User management
│   ├── rbac/               # Role-based access control
│   ├── config/             # Configuration
│   └── main.ts             # Application entry point
├── test/                   # E2E tests
├── .env.example            # Environment template
└── package.json

frontend/
├── src/
│   ├── components/         # React components
│   │   ├── Admin/          # Admin components
│   │   ├── Assets/         # Asset components
│   │   ├── Licenses/       # License components
│   │   └── ui/             # Reusable UI components
│   ├── services/           # API services
│   ├── context/            # React context
│   ├── hooks/              # Custom hooks
│   └── App.tsx             # Main app component
├── public/                 # Static assets
└── package.json
```

---

## API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@qbadvisory.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@qbadvisory.com",
    "firstName": "System",
    "lastName": "Administrator",
    "role": { "name": "Admin" }
  }
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Assets

#### List Assets
```http
GET /api/assets?page=1&limit=10&category=laptop&status=available
Authorization: Bearer <token>

Response:
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### Create Asset
```http
POST /api/assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "MacBook Pro M2",
  "category": "laptop",
  "serialNumber": "MBP2024001",
  "brand": "Apple",
  "model": "MacBook Pro 14\"",
  "purchaseCost": 2499.99,
  "purchaseDate": "2024-01-15",
  "warrantyExpiry": "2027-01-15",
  "status": "available",
  "condition": "excellent",
  "location": "Office Floor 1"
}
```

### Licenses

#### List Licenses
```http
GET /api/licenses?category=saas
Authorization: Bearer <token>
```

#### Create License
```http
POST /api/licenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "softwareName": "Microsoft 365 E5",
  "category": "saas",
  "type": "user",
  "totalSeats": 100,
  "usedSeats": 75,
  "unitPrice": 35.00,
  "billingFrequency": "monthly",
  "purchaseDate": "2024-01-01",
  "expiryDate": "2024-12-31"
}
```

---

## Deployment

### Production Build

#### Backend
```bash
cd backend

# Build
npm run build

# Start production server
npm run start:prod
```

#### Frontend
```bash
cd frontend

# Build
npm run build

# Serve build folder with a static server
# Or deploy to hosting service (Vercel, Netlify, etc.)
```

### Environment Variables

**Critical Production Settings:**
- Set strong `DB_PASSWORD`
- Generate secure `JWT_SECRET` using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Set `NODE_ENV=production`
- Configure proper `CORS_ORIGIN`
- Set up email SMTP for notifications

### Database Migration

For production, disable `synchronize: true` in TypeORM config and use proper migrations:

```bash
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run
```

### Docker Deployment (Recommended)

Create `docker-compose.yml` in root:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_DB: IT Asset Management
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "4000:4000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Security

### Best Practices Implemented

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Password hashing with bcrypt (salt rounds: 10)
   - Secure password reset flow with OTP

2. **Input Validation**
   - class-validator for DTO validation
   - SQL injection prevention via TypeORM
   - XSS protection

3. **Environment Security**
   - No hardcoded credentials
   - Environment variables for sensitive data
   - .env files excluded from version control

4. **API Security**
   - CORS configuration
   - Rate limiting (recommended)
   - JWT expiration
   - Helmet.js for HTTP headers (recommended)

### Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong database password
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Enable audit logging
- [ ] Regular backups
- [ ] Implement 2FA (future enhancement)

### Default Credentials

**Development Only:**
- Email: `admin@qbadvisory.com`
- Password: `password123`

**⚠️ IMPORTANT:** Change these credentials immediately in production!

---

## Support & Contributing

### Getting Help
- Check the documentation
- Review existing issues
- Create a new issue with detailed information

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

This project is licensed under the UNLICENSED license - see LICENSE file for details.

---

## Changelog

### Version 0.1.0 (Current)
- Initial release
- Core asset management features
- License management
- User management with RBAC
- Azure AD integration
- Reporting and analytics
- Responsive UI

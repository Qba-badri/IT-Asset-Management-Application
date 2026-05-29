# 🚀 Project Context: IT Asset Management System

## 📌 Overview
This is a full-stack enterprise-grade IT Asset Management (ITAM) system. It enables organizations to track the complete lifecycle of IT assets, manage software licenses, monitor inventory levels, and handle user assignments with role-based access control.

## 🛠️ Tech Stack
- **Backend**: NestJS (Node.js), TypeScript, TypeORM, PostgreSQL.
- **Frontend**: React 18, TypeScript, TailwindCSS, Radix UI, ApexCharts.
- **Authentication**: JWT-based with Role-Based Access Control (RBAC).
- **Integrations**: Azure AD (for user synchronization).

## 📁 Project Structure (Best Practice)
```text
IT-Asset-Management/
├── backend/            # NestJS API
│   ├── src/            # Source code
│   │   ├── entities/   # TypeORM entities
│   │   ├── modules/    # Feature modules (Assets, Licenses, Users, etc.)
│   │   └── ...
│   └── test/           # Unit & E2E tests
├── frontend/           # React SPA
│   ├── src/            # Source code
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API communication
│   │   └── context/    # State management
├── database/           # SQL migration and seed scripts
├── docs/               # System documentation
│   └── archive/        # Past session reports and logs
└── scripts/            # Utility scripts for setup and maintenance
```

## 🚦 Current State
- **Backend**: Fully functional with modules for Assets, Licenses, Inventory, RBAC, and Azure Sync.
- **Frontend**: React application with dashboard, asset listing, license management, and reports.
- **Database**: PostgreSQL schema is initialized via `database/init.sql`.
- **Status**: The project is currently in a "Restart" phase, having been cleaned of legacy log files and redundant session reports.

## 🏃 Quick Start for AI Agents
1. **Database**: Ensure PostgreSQL is running. Use `database/init.sql` to setup.
2. **Backend**:
   - `cd backend`
   - `npm install`
   - Configure `.env` (DB_HOST, DB_USER, DB_PASSWORD, etc.)
   - `npm run seed:all` (Seeds permissions, roles, and master data)
   - `npm run start:dev`
3. **Frontend**:
   - `cd frontend`
   - `npm install`
   - `npm start` (Runs on http://localhost:3000)

## 📝 Recent Changes & Cleanup
- Removed legacy `.txt` and `.log` files from `backend` and `frontend`.
- Archived one-time session markdown reports into `docs/archive/`.
- Consolidated documentation into `docs/`.
- Created this `PROJECT_CONTEXT.md` for better AI onboarding.

## 🎯 Next Steps / Goals
- Implement Barcode/QR code scanning.
- Enhance reporting with custom filters.
- Add Dark Mode support to the UI.
- Improve Azure AD sync error handling.

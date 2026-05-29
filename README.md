# 🏢 IT Asset Management System

A comprehensive, enterprise-grade IT Asset Management system built with NestJS and React. Track and manage your organization's IT assets, software licenses, inventory, and more with powerful features and an intuitive interface.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-18%2B-blue.svg)

---

## ✨ Features

### 🖥️ Asset Management
- **Complete Asset Lifecycle Tracking** - From procurement to disposal
- **Multi-Category Support** - Computers, laptops, mobile devices, servers, network equipment, and more
- **Depreciation Calculator** - Automatic asset depreciation tracking
- **Assignment Management** - Assign assets to users, departments, or locations
- **Warranty Tracking** - Never miss a warranty expiration

### 📜 License Management
- **Software License Tracking** - SaaS, cloud, on-premise, and perpetual licenses
- **Compliance Monitoring** - Track license usage vs. available seats
- **Cost Management** - Monitor licensing costs and billing cycles
- **Renewal Alerts** - Automatic renewal reminders
- **Multi-Type Support** - User-based, device-based, site, usage, and concurrent licenses

### 📦 Inventory Management
- **Stock Tracking** - Monitor inventory levels for accessories and supplies
- **Low Stock Alerts** - Get notified when items need reordering
- **Supplier Management** - Track vendors and procurement details

### 👥 User & Access Control
- **Role-Based Access Control (RBAC)** - Granular permission system
- **Azure AD Integration** - Seamless user synchronization
- **Audit Logging** - Complete audit trail of all system changes
- **Multi-Role Support** - Admin, Manager, and Employee roles

### 📊 Analytics & Reporting
- **Real-Time Dashboard** - Key metrics and KPIs at a glance
- **Comprehensive Reports** - Assets, licenses, inventory, and audit reports
- **Data Export** - Export to CSV/Excel for further analysis
- **Visual Analytics** - Charts and graphs powered by ApexCharts

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **PostgreSQL** 18+
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IT-Asset-Management
   ```

2. **Setup Database**
   ```bash
   # Create PostgreSQL database
   createdb "IT Asset Management"
   
   # Run initialization script
   cd database
   psql -U postgres -f init.sql
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   npm run seed:permissions
   npm run seed:masters
   npm run start:dev
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm start
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Default credentials: `admin@qbadvisory.com` / `password123`

---

## 📚 Documentation

- **[Complete Documentation](docs/COMPLETE_DOCUMENTATION.md)** - Comprehensive guide covering all features
- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running quickly
- **[Database Setup](docs/DATABASE_SETUP.md)** - Detailed database configuration

---

## 🛠️ Technology Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **PostgreSQL** - Robust relational database
- **TypeORM** - Powerful ORM
- **JWT** - Secure authentication
- **Passport** - Authentication middleware

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe components
- **TailwindCSS** - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **ApexCharts** - Beautiful data visualization
- **Axios** - HTTP client
- **React Router v6** - Client-side routing

---

## 📁 Project Structure

```
IT-Asset-Management/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── entities/        # Database entities
│   │   ├── ...
│   └── package.json
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   └── ...
│   └── package.json
├── database/                # Database initialization scripts
├── docs/                    # System documentation
│   ├── archive/             # Archived session reports
│   ├── COMPLETE_DOCUMENTATION.md
│   └── ...
├── scripts/                 # Utility scripts (e.g., database setup)
├── PROJECT_CONTEXT.md       # AI-onboarding context file
├── package.json             # Root package file for managing the project
└── README.md                # This file
```

---

## 🔒 Security

### Security Features
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Environment variable security
- ✅ Audit logging

### Security Best Practices
1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong passwords** - Especially for database and JWT secret
3. **Change default credentials** - Immediately after installation
4. **Enable HTTPS** - In production environments
5. **Regular updates** - Keep dependencies up to date
6. **Implement rate limiting** - Protect against brute force attacks

---

## 🧪 Development

### Running Tests
```bash
# Backend
cd backend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report

# Frontend
cd frontend
npm test                  # Run tests
```

### Code Quality
```bash
# Backend
npm run lint              # Run ESLint
npm run format            # Format with Prettier

# Frontend
npm run build             # Production build
```

### Database Seeding
```bash
cd backend
npm run seed:permissions  # Seed permissions and roles
npm run seed:masters      # Seed master data (brands, vendors, etc.)
```

---

## 🚢 Deployment

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

**Frontend:**
```bash
cd frontend
npm run build
# Deploy the build/ folder to your hosting service
```

### Environment Configuration

**Critical Production Settings:**
- Set a strong `DB_PASSWORD`
- Generate secure `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Set `NODE_ENV=production`
- Configure proper `CORS_ORIGIN`
- Set up SMTP for email notifications

### Docker Deployment (Recommended)

See [Complete Documentation](docs/COMPLETE_DOCUMENTATION.md#deployment) for Docker configuration.

---

## 📊 Default Users & Roles

### Seeded Users (Development)
| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| admin@qbadvisory.com | password123 | Admin | Full access |
| john.doe@qbadvisory.com | password123 | Manager | Assets, Licenses, Inventory |
| mike.johnson@qbadvisory.com | password123 | Employee | View only |

**⚠️ IMPORTANT:** Change these credentials in production!

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the UNLICENSED license.

---

## 🆘 Support

- **Documentation**: Check the [Complete Documentation](docs/COMPLETE_DOCUMENTATION.md)
- **Issues**: Report bugs or request features via GitHub Issues
- **Questions**: Review existing issues or create a new one

---

## 🗺️ Roadmap

### Upcoming Features
- [ ] Mobile application (React Native)
- [ ] Advanced reporting with custom report builder
- [ ] Integration with popular IT service management tools
- [ ] Barcode/QR code scanning
- [ ] Asset maintenance scheduling
- [ ] Contract management
- [ ] Two-factor authentication (2FA)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced analytics with ML predictions

---

## 📸 Screenshots

*Coming soon - Add screenshots of your application here*

---

## 👏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Charts powered by [ApexCharts](https://apexcharts.com/)

---

<div align="center">
  <strong>Made with ❤️ for IT Asset Management</strong>
</div>

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/Login';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import AppShell from './components/layout/AppShell';
import DashboardHome from './features/Dashboard/DashboardHome';
import UserManagement from './features/UserManagement/UserManagement';
import RoleMaster from './features/Admin/RoleMaster';
import PermissionMaster from './features/Admin/PermissionMaster';
import CategoryMaster from './features/Admin/CategoryMaster';
import { BrandMaster, VendorMaster, ConditionMaster, StatusMaster, DisposalMethodMaster, PlanMaster } from './features/Admin/MasterPages';
import SystemSettings from './features/Admin/SystemSettings';
import AssetManagement from './features/Assets/AssetManagement';
import AssetDetails from './features/Assets/AssetDetails';
import AssetAuditLog from './features/Assets/AssetAuditLog';
import LicenseManagement from './features/Licenses/LicenseManagement';
import AnalyticsDashboard from './features/Analytics/AnalyticsDashboard';
import { ToastProvider } from './context/ToastContext';
import { CurrencyProvider } from './context/CurrencyContext';

/* ─── New Inventory-Management Pages ─── */
import CatalogPage from './features/Catalog/CatalogPage';
import StockPage from './features/Stock/StockPage';
import AssetsListPage from './features/AssetUnits/AssetsListPage';
import AssetDetailPage from './features/AssetUnits/AssetDetailPage';
import IssueReturnPage from './features/IssueReturn/IssueReturnPage';
import HoldingsPage from './features/Holdings/HoldingsPage';
import OverduePage from './features/Overdue/OverduePage';
import AuditPage from './features/Audit/AuditPage';
import AuditReportPage from './features/Audit/AuditReportPage';
import ReportsPage from './features/Reports/ReportsPage';
import UserProfile from './features/UserManagement/UserProfile';
import UserSettings from './features/UserManagement/UserSettings';
import InventoryManagementModule from './features/ConsumableInventory/InventoryManagementModule';
import CategoryManagement from './features/ConsumableInventory/CategoryManagement';
import ErrorBoundary from './components/shared/ErrorBoundary';

function App() {
  return (
    <ToastProvider>
      <CurrencyProvider>
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route path="/dashboard" element={<AppShell />}>
                <Route index element={<DashboardHome />} />
                <Route path="admin/users" element={<UserManagement />} />
                <Route path="assets" element={<AssetManagement />} />
                <Route path="assets/:id" element={<AssetDetails />} />
                <Route path="assets/:id/audit" element={<AssetAuditLog />} />
                <Route path="licenses" element={<LicenseManagement />} />
                <Route path="inventory" element={<InventoryManagementModule />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
                <Route path="admin/roles" element={<RoleMaster />} />
                <Route path="admin/permissions" element={<PermissionMaster />} />
                <Route path="admin/categories" element={<CategoryMaster />} />
                <Route path="admin/inventory-categories" element={<CategoryManagement />} />
                <Route path="admin/brands" element={<BrandMaster />} />
                <Route path="admin/vendors" element={<VendorMaster />} />
                <Route path="admin/conditions" element={<ConditionMaster />} />
                <Route path="admin/statuses" element={<StatusMaster />} />
                <Route path="admin/disposal-methods" element={<DisposalMethodMaster />} />
                <Route path="admin/plans" element={<PlanMaster />} />
                <Route path="admin/settings" element={<SystemSettings />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="settings" element={<UserSettings />} />

                {/* ─── New Inventory-Management Routes ─── */}
                <Route path="catalog" element={<CatalogPage />} />
                <Route path="stock" element={<StockPage />} />
                <Route path="asset-units" element={<AssetsListPage />} />
                <Route path="asset-units/:id" element={<AssetDetailPage />} />
                <Route path="issue-return" element={<IssueReturnPage />} />
                <Route path="holdings" element={<HoldingsPage />} />
                <Route path="employees/:id/holdings" element={<HoldingsPage />} />
                <Route path="overdue" element={<OverduePage />} />
                <Route path="audit" element={<AuditPage />} />
                <Route path="audit-report" element={<AuditReportPage />} />
                <Route path="reports" element={<ReportsPage />} />
              </Route>

              <Route path="/" element={<Login />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </CurrencyProvider>
    </ToastProvider>
  );
}

export default App;

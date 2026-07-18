import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Monitor,
  KeyRound,
  Package,
  BarChart3,
  Settings,
  Users,
  Shield,
  Tag,
  ChevronDown,
  ChevronLeft,
  LogOut,
  Menu,
  X,
  Loader2,
  ClipboardList,
  Archive,
  FileSearch,
  Briefcase,
  Bell,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { authService } from "../../services/authService";
import { useCurrency } from "../../context/CurrencyContext";
import { useAuth } from "../../hooks/useAuth";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

// ─── Nav type definitions ────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  /** Backend permission slug required to see this item. Omit = always visible. */
  requiredPermission?: string;
  /** Visible if the user holds ANY of these slugs (used for multi-tier items). */
  requiredAnyPermission?: string[];
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isNavGroup(item: NavEntry): item is NavGroup {
  return "children" in item;
}

// ─── Navigation definition (permission-slug gated) ───────────────────────────
// Each item's `requiredPermission` must match a slug in the user's permissions[].
// This mirrors the backend @Permissions() decorator exactly.

const navigation: NavEntry[] = [
  // Org dashboard — only for users with a dashboard scope (global or department).
  // Standard Users (no dashboard.view.*) land on My Portfolio instead.
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", requiredAnyPermission: ["dashboard.view.all", "dashboard.view.department"] },
  { label: "My Portfolio", icon: Briefcase, path: "/dashboard/profile" },
  { label: "Assets",    icon: Monitor,         path: "/dashboard/assets",    requiredPermission: "assets.view" },
  { label: "Licenses",  icon: KeyRound,        path: "/dashboard/licenses",  requiredPermission: "licenses.view" },
  // Gates on inventory-mgmt.view: /dashboard/inventory renders InventoryManagementModule,
  // which calls /api/inventory-management/* exclusively. The inventory.* slugs belong to
  // the separate catalog/stock module.
  { label: "Inventory", icon: Archive,         path: "/dashboard/inventory", requiredPermission: "inventory-mgmt.view" },
  { label: "Analytics", icon: BarChart3,       path: "/dashboard/analytics", requiredPermission: "reports.view" },
  {
    label: "Audit",
    icon: FileSearch,
    children: [
      { label: "Audit Overview",  icon: ClipboardList, path: "/dashboard/audit-report",             requiredPermission: "reports.view" },
      { label: "Asset Audit",     icon: Monitor,       path: "/dashboard/audit-report?tab=assets",    requiredPermission: "reports.view" },
      { label: "License Audit",   icon: KeyRound,      path: "/dashboard/audit-report?tab=licenses",  requiredPermission: "reports.view" },
      { label: "Inventory Audit", icon: Archive,       path: "/dashboard/audit-report?tab=inventory", requiredPermission: "reports.view" },
    ],
  },
  {
    label: "Admin",
    icon: Settings,
    children: [
      // users.view is a read permission that Audit pages also require — gate the admin
      // screen on manage-level rights so read-only roles don't see the Admin group.
      { label: "Users",                icon: Users,         path: "/dashboard/admin/users",                requiredAnyPermission: ["users.manage", "users.create", "users.edit"] },
      { label: "Access Control",       icon: Shield,        path: "/dashboard/admin/access-control",       requiredPermission: "roles.view" },
      { label: "Asset Setup",          icon: Tag,           path: "/dashboard/admin/asset-setup",          requiredAnyPermission: ["categories.manage", "brands.manage", "vendors.manage", "assets.manage"] },
      { label: "Inventory Categories", icon: Package,       path: "/dashboard/admin/inventory-categories", requiredPermission: "categories.manage" },
      { label: "License Plans",        icon: KeyRound,      path: "/dashboard/admin/plans",                requiredPermission: "licenses.manage" },
      { label: "System Settings",      icon: Settings,      path: "/dashboard/admin/settings",             requiredPermission: "settings.manage" },
      { label: "Notifications",        icon: Bell,          path: "/dashboard/admin/notifications",        requiredPermission: "settings.manage" },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  // useAuth reads permission slugs from localStorage — synced with the backend PermissionsGuard
  const { hasPermission, hasAnyPermission, roleName } = useAuth();
  const { availableCurrencies, selectedCurrency, setCurrency, reloadCurrencies } = useCurrency();

  const [collapsed,      setCollapsed]      = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Admin", "Audit"]);
  const [profile,        setProfile]        = useState<any>(null);
  const [loadingUser,    setLoadingUser]    = useState(true);

  useEffect(() => {
    authService.getProfile()
      .then(setProfile)
      .catch((err) => console.error("Failed to load user profile", err))
      .finally(() => setLoadingUser(false));
    // AppShell only mounts once authenticated — fetch the auth-guarded currency
    // list here (the fetch on app mount happens on the login screen and 401s).
    reloadCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    const [pathOnly, query] = path.split("?");
    if (query) {
      return location.pathname === pathOnly && location.search === `?${query}`;
    }
    if (pathOnly === "/dashboard/audit-report") {
      // Bare "Audit Overview" link should only match when there's no tab query
      return location.pathname === pathOnly && !location.search;
    }
    return location.pathname.startsWith(pathOnly);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  // ── Permission-based nav filtering ──────────────────────────────────────────
  /** Is a flat nav item visible to this user? */
  const isItemVisible = (item: NavItem): boolean => {
    if (item.requiredAnyPermission) return hasAnyPermission(item.requiredAnyPermission);
    return !item.requiredPermission || hasPermission(item.requiredPermission);
  };

  /** Build the filtered nav list — keeps only items the user can access. */
  const filteredNav: NavEntry[] = navigation.reduce<NavEntry[]>((acc, entry) => {
    if (isNavGroup(entry)) {
      const visibleChildren = entry.children.filter(isItemVisible);
      // Only show the Admin group if at least one child is accessible
      if (visibleChildren.length > 0) {
        acc.push({ ...entry, children: visibleChildren });
      }
    } else if (isItemVisible(entry)) {
      acc.push(entry);
    }
    return acc;
  }, []);

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b px-4", collapsed && "justify-center px-2")}>
        <Link to="/dashboard" className="flex items-center gap-2 no-underline" onClick={() => setMobileOpen(false)}>
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              IT
            </div>
          ) : (
            <img src="/logo.svg" alt="IT Asset Management" className="h-9 object-contain" />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {filteredNav.map((item) =>
            isNavGroup(item) ? (
              <div key={item.label}>
                {collapsed ? (
                  // Collapsed sidebar: show only child icons
                  item.children.map((child) => (
                    <TooltipProvider key={child.path} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={child.path}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex h-10 w-full items-center justify-center rounded-md text-sm transition-colors no-underline",
                              isActive(child.path)
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                            )}
                          >
                            <child.icon className="h-5 w-5" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{child.label}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))
                ) : (
                  <>
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm transition-colors",
                        "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedGroups.includes(item.label) && "rotate-180"
                        )}
                      />
                    </button>
                    {expandedGroups.includes(item.label) && (
                      <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors no-underline",
                              isActive(child.path)
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                            )}
                          >
                            <child.icon className="h-4 w-4 shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <TooltipProvider key={item.path} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors no-underline",
                        collapsed && "justify-center px-0",
                        isActive(item.path)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
            )
          )}
        </nav>
      </ScrollArea>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-sidebar transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute right-2 top-4">
          <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        {sidebarContent}
      </aside>

      {/* Sidebar — Desktop */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col border-r bg-sidebar transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            IT Asset Management
          </h1>

          <div className="flex-1" />

          {/* Global display-currency switcher — presentation only, storage stays in base currency */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1 px-3 font-medium">
                <span>{selectedCurrency.symbol}</span>
                <span>{selectedCurrency.code}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 max-h-72 overflow-y-auto">
              {availableCurrencies.map((c) => (
                <DropdownMenuItem
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={cn(
                    "cursor-pointer gap-2",
                    c.code === selectedCurrency.code && "bg-accent font-semibold"
                  )}
                >
                  <span className="w-8 text-muted-foreground">{c.symbol}</span>
                  <span>{c.code}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 gap-2 rounded-full px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {loadingUser ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      `${profile?.firstName?.[0] ?? '?'}${profile?.lastName?.[0] ?? ''}`
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-medium">
                    {loadingUser ? "Loading..." : `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {/* Live profile role name when loaded; fall back to localStorage roleName */}
                    {loadingUser ? "Please wait" : (profile?.role?.name ?? roleName ?? "User")}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className="w-full cursor-pointer">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" className="w-full cursor-pointer">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 py-6 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

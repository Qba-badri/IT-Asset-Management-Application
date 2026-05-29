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
  Lock,
  Tag,
  ChevronDown,
  ChevronLeft,
  LogOut,
  Menu,
  X,
  Loader2,
  ShoppingCart,
  Database,
  Factory,
  Building2,
  ClipboardList,
  Activity,
  Archive,
  Trash2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { authService } from "../../services/authService";
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
import { ChatWidget } from "../Bot/ChatWidget";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
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

const navigation: NavEntry[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Assets", icon: Monitor, path: "/dashboard/assets" },
  { label: "Licenses", icon: KeyRound, path: "/dashboard/licenses" },
  { label: "Inventory", icon: Archive, path: "/dashboard/inventory" },
  { label: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
  {
    label: "Admin",
    icon: Settings,
    children: [
      { label: "Users", icon: Users, path: "/dashboard/admin/users" },
      { label: "Roles", icon: Shield, path: "/dashboard/admin/roles" },
      { label: "Permissions", icon: Lock, path: "/dashboard/admin/permissions" },
      { label: "Asset Categories", icon: Tag, path: "/dashboard/admin/categories" },
      { label: "Inventory Categories", icon: Package, path: "/dashboard/admin/inventory-categories" },
      { label: "Brands", icon: Factory, path: "/dashboard/admin/brands" },
      { label: "Vendors", icon: Building2, path: "/dashboard/admin/vendors" },
      { label: "License Plans", icon: KeyRound, path: "/dashboard/admin/plans" },
      { label: "Conditions", icon: ClipboardList, path: "/dashboard/admin/conditions" },
      { label: "Statuses", icon: Activity, path: "/dashboard/admin/statuses" },
      { label: "Disposal Methods", icon: Archive, path: "/dashboard/admin/disposal-methods" },
      { label: "System Settings", icon: Settings, path: "/dashboard/admin/settings" },
    ],
  },
];

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Admin"]);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoadingUser(true);
      const data = await authService.getProfile();
      setUser(data);
    } catch (error) {
      console.error("Failed to load user profile", error);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

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
          {navigation.map((item) =>
            isNavGroup(item) ? (
              <div key={item.label}>
                {collapsed ? (
                  // Show only child icons in collapsed mode
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

      {/* Sidebar - Mobile */}
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

      {/* Sidebar - Desktop */}
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

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 gap-2 rounded-full px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {loadingUser ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      `${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || 'U'}`
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-medium">
                    {loadingUser ? "Loading..." : `${user?.firstName} ${user?.lastName}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {loadingUser ? "Please wait" : (user?.role?.name || "Administrator")}
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
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Bot Chat Widget */}
      <ChatWidget />
    </div>
  );
}

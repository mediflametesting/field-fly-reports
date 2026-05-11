import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileBarChart2,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  ShoppingCart,
  UserCog,
  Users,
  Users2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/services/authService";

interface MenuItem {
  title: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "hr", "executive"] },
  { title: "Add Visit", path: "/app/visit-report", icon: Plus, roles: ["executive"] },
  { title: "Visit Reports", path: "/app/visit-report", icon: ClipboardList, roles: ["admin", "manager"] },
  { title: "My Visits", path: "/app/visits", icon: MapPin, roles: ["executive"] },
  { title: "Orders", path: "/app/orders", icon: ShoppingCart, roles: ["admin", "manager", "executive"] },
  { title: "Customers", path: "/app/customers", icon: Users2, roles: ["admin", "manager"] },
  { title: "Companies", path: "/app/companies", icon: Building2, roles: ["admin"] },
  { title: "Team", path: "/app/team", icon: Users, roles: ["admin", "manager", "hr"] },
  { title: "Attendance", path: "/app/attendance", icon: CalendarCheck, roles: ["admin", "manager", "hr", "executive"] },
  { title: "Daily Reports", path: "/app/reports", icon: FileText, roles: ["admin", "manager", "hr", "executive"] },
  { title: "Reports", path: "/app/advanced-reports", icon: FileBarChart2, roles: ["admin", "hr", "manager"] },
  { title: "Analytics", path: "/app/analytics", icon: BarChart3, roles: ["admin", "manager"] },
  { title: "Notifications", path: "/app/notifications", icon: Bell, roles: ["admin", "manager", "hr", "executive"] },
  { title: "Users", path: "/app/users", icon: UserCog, roles: ["admin"] },
];

const fallbackMenu = menuItems.filter((item) => item.path === "/app/dashboard");

function NavMenu({ items, onNavigate }: { items: MenuItem[]; onNavigate?: () => void }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentPath === item.path || currentPath.startsWith(`${item.path}/`);
          return (
            <Link
              key={`${item.title}-${item.path}`}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function SidebarShell({ items, onNavigate }: { items: MenuItem[]; onNavigate?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-5 py-4">
        <div className="text-lg font-bold tracking-tight">FieldForce</div>
        <div className="text-xs text-sidebar-foreground/65">Sales Reporting</div>
      </div>
      <NavMenu items={items} onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 min-w-0 text-xs">
          <div className="truncate font-semibold text-sidebar-foreground">{user?.fullName ?? "Signed in"}</div>
          <div className="capitalize text-sidebar-foreground/65">{user?.role ?? "dashboard"}</div>
        </div>
        <Button variant="outline" size="sm" className="w-full justify-start" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = user?.role;
  const items = useMemo(() => {
    const visible = role ? menuItems.filter((item) => item.roles.includes(role)) : [];
    return visible.length > 0 ? visible : fallbackMenu;
  }, [role]);

  useEffect(() => {
    console.log("[Sidebar] current user", user);
    console.log("[Sidebar] role", role);
    console.log("[Sidebar] menu items count", items.length);
  }, [items.length, role, user]);

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <SidebarShell items={items} />
      </aside>

      <button
        type="button"
        aria-label="Open menu"
        className="fixed left-4 top-2 z-50 inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background text-foreground shadow-sm md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-foreground/45"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-screen w-72 max-w-[86vw] border-r border-sidebar-border bg-sidebar shadow-xl">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarShell items={items} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}

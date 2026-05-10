import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  MapPin,
  ShoppingCart,
  Users,
  UserCog,
  CalendarCheck,
  BarChart3,
  LogOut,
  Users2,
  Building2,
  ClipboardList,
  FileBarChart2,
  Bell,
  Plus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/services/authService";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const items: NavItem[] = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "hr", "executive"] },
  { title: "Add Visit", url: "/app/visit-report", icon: Plus, roles: ["executive"] },
  { title: "Visit Reports", url: "/app/visit-report", icon: ClipboardList, roles: ["admin", "manager"] },
  { title: "My Visits", url: "/app/visits", icon: MapPin, roles: ["executive"] },
  { title: "Orders", url: "/app/orders", icon: ShoppingCart, roles: ["admin", "manager", "executive"] },
  { title: "Customers", url: "/app/customers", icon: Users2, roles: ["admin", "manager"] },
  { title: "Companies", url: "/app/companies", icon: Building2, roles: ["admin"] },
  { title: "Team", url: "/app/team", icon: Users, roles: ["admin", "manager", "hr"] },
  { title: "Attendance", url: "/app/attendance", icon: CalendarCheck, roles: ["admin", "manager", "hr", "executive"] },
  { title: "Daily Reports", url: "/app/reports", icon: FileText, roles: ["admin", "manager", "hr", "executive"] },
  { title: "Reports", url: "/app/advanced-reports", icon: FileBarChart2, roles: ["admin", "hr", "manager"] },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3, roles: ["admin", "manager"] },
  { title: "Notifications", url: "/app/notifications", icon: Bell, roles: ["admin", "manager", "hr", "executive"] },
  { title: "Users", url: "/app/users", icon: UserCog, roles: ["admin"] },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (!user) return null;
  const visible = items.filter((i) => i.roles.includes(user.role));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="px-2 py-3">
          <div className="text-base font-bold tracking-tight text-sidebar-foreground">FieldForce</div>
          <div className="text-xs text-sidebar-foreground/60">Sales Reporting</div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => (
                <SidebarMenuItem key={item.title + item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2">
          <div className="mb-2 text-xs">
            <div className="font-medium text-sidebar-foreground">{user.fullName}</div>
            <div className="capitalize text-sidebar-foreground/60">{user.role}</div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

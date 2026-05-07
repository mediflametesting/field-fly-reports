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
import type { Role } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const items: NavItem[] = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "hr", "executive"] },
  { title: "Daily Report", url: "/app/reports", icon: FileText, roles: ["executive", "manager", "admin"] },
  { title: "Visits", url: "/app/visits", icon: MapPin, roles: ["executive", "manager", "admin"] },
  { title: "Orders", url: "/app/orders", icon: ShoppingCart, roles: ["executive", "manager", "admin"] },
  { title: "Attendance", url: "/app/attendance", icon: CalendarCheck, roles: ["executive", "hr", "admin", "manager"] },
  { title: "Team", url: "/app/team", icon: Users, roles: ["manager", "admin"] },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3, roles: ["manager", "admin"] },
  { title: "Users", url: "/app/users", icon: UserCog, roles: ["admin", "hr"] },
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
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url}>
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

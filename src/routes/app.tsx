import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-background px-3 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">FieldForce</div>
            </div>
            <div className="text-xs text-muted-foreground hidden sm:block">
              {user.fullName} · <span className="capitalize">{user.role}</span>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

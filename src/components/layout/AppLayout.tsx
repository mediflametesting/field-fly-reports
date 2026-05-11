import { Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth";

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" search={{ redirect: location.href }} />;

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <div className="min-h-screen md:ml-72">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 md:px-6">
          <div className="ml-12 min-w-0 flex-1 md:ml-0">
            <div className="truncate text-sm font-semibold">FieldForce</div>
          </div>
          <div className="hidden text-xs text-muted-foreground sm:block">
            {user.fullName} · <span className="capitalize">{user.role}</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

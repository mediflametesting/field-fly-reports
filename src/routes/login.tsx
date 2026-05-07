import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/app/dashboard" });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success("Welcome back");
      navigate({ to: "/app/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fill = (u: string, p: string) => { setUsername(u); setPassword(p); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">FieldForce</h1>
          <p className="text-sm text-muted-foreground">Sales Team Reporting</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your username and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="mt-6 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Demo accounts (click to fill)</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button type="button" className="rounded border px-2 py-1.5 text-left hover:bg-accent" onClick={() => fill("admin", "admin123")}>👑 admin / admin123</button>
                <button type="button" className="rounded border px-2 py-1.5 text-left hover:bg-accent" onClick={() => fill("manager", "manager123")}>📊 manager / manager123</button>
                <button type="button" className="rounded border px-2 py-1.5 text-left hover:bg-accent" onClick={() => fill("hr", "hr123")}>👥 hr / hr123</button>
                <button type="button" className="rounded border px-2 py-1.5 text-left hover:bg-accent" onClick={() => fill("sales1", "sales123")}>🚀 sales1 / sales123</button>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">Mock data mode • Supabase integration ready</p>
      </div>
    </div>
  );
}

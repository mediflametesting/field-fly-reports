import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { authService, type Role } from "@/services/authService";
import { userService, type AppUser } from "@/services/userService";

export const Route = createFileRoute("/app/users")({ component: UsersPage });

function UsersPage() {
  const { hasRole } = useAuth();
  const [list, setList] = useState<AppUser[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", username: "", password: "", role: "executive" as Role, region: "" });

  const reload = async () => {
    try { setList(await userService.list()); } catch (e) { toast.error(e instanceof Error ? e.message : "Load failed"); }
  };

  useEffect(() => { reload(); }, []);

  if (!hasRole("admin", "hr")) return <Navigate to="/app/dashboard" />;

  const submit = async () => {
    if (!form.fullName || !form.username || !form.password) { toast.error("Fill all required fields"); return; }
    setSaving(true);
    try {
      await authService.createUser({
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        role: form.role,
        region: form.region || null,
      });
      toast.success("User created");
      setOpen(false);
      setForm({ fullName: "", username: "", password: "", role: "executive", region: "" });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (u: AppUser) => {
    const next = u.status === "active" ? "inactive" : "active";
    try {
      await userService.setStatus(u.id, next);
      toast.success(next === "active" ? "Activated" : "Deactivated");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage team members</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add user</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New user</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Full name</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Password</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Sales Executive</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Region</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={saving}>{saving ? "Creating…" : "Create"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {list.map((u) => (
          <Card key={u.id}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{u.full_name}</span>
                  <Badge variant="outline" className="capitalize">{u.role}</Badge>
                  {u.status !== "active" && <Badge variant="destructive">Inactive</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">@{u.username} · {u.region ?? "—"} · joined {u.created_at.slice(0, 10)}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggle(u)}>{u.status === "active" ? "Deactivate" : "Activate"}</Button>
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No users</p>}
      </div>
    </div>
  );
}

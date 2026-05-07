import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { db, type Role } from "@/lib/mock-data";
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
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/users")({ component: UsersPage });

function UsersPage() {
  const { hasRole } = useAuth();
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", username: "", password: "", role: "executive" as Role, region: "" });

  if (!hasRole("admin", "hr")) return <Navigate to="/app/dashboard" />;

  const submit = () => {
    if (!form.fullName || !form.username || !form.password) { toast.error("Fill all required fields"); return; }
    if (db.users.some((u) => u.username === form.username)) { toast.error("Username already exists"); return; }
    db.users.push({
      id: `u${Date.now()}`,
      username: form.username,
      password: form.password,
      fullName: form.fullName,
      role: form.role,
      region: form.region || undefined,
      joinedAt: new Date().toISOString().slice(0, 10),
      active: true,
    });
    toast.success("User created");
    setOpen(false);
    setForm({ fullName: "", username: "", password: "", role: "executive", region: "" });
    force((n) => n + 1);
  };

  const toggle = (id: string) => {
    const u = db.users.find((x) => x.id === id);
    if (u) { u.active = !u.active; toast.success(u.active ? "Activated" : "Deactivated"); force((n) => n + 1); }
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
            <DialogFooter><Button onClick={submit}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {db.users.map((u) => (
          <Card key={u.id}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{u.fullName}</span>
                  <Badge variant="outline" className="capitalize">{u.role}</Badge>
                  {!u.active && <Badge variant="destructive">Inactive</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">@{u.username} · {u.region ?? "—"} · joined {u.joinedAt}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggle(u.id)}>{u.active ? "Deactivate" : "Activate"}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

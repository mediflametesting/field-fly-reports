import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { visitLogService, type VisitLog } from "@/services/visitLogService";
import { userService, type AppUser } from "@/services/userService";

export const Route = createFileRoute("/app/visits")({ component: VisitsPage });

function VisitsPage() {
  const { user } = useAuth();
  const isExec = user?.role === "executive";
  const [list, setList] = useState<VisitLog[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ outletName: "", status: "productive" as "productive" | "non-productive", remarks: "" });

  const reload = async () => {
    if (!user) return;
    const [v, u] = await Promise.all([
      visitLogService.list(isExec ? user.id : undefined),
      userService.list().catch(() => []),
    ]);
    setList(v);
    setUsers(u);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [user?.id]);

  if (!user) return null;
  const userMap = new Map(users.map((u) => [u.id, u]));

  const submit = async () => {
    if (!form.outletName.trim()) { toast.error("Outlet name required"); return; }
    setSaving(true);
    try {
      await visitLogService.create({
        user_id: user.id,
        outlet_name: form.outletName,
        visit_date: new Date().toISOString().slice(0, 10),
        status: form.status,
        remarks: form.remarks || null,
      });
      toast.success("Visit logged");
      setOpen(false);
      setForm({ outletName: "", status: "productive", remarks: "" });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visits</h1>
          <p className="text-sm text-muted-foreground">Outlet visit log</p>
        </div>
        {isExec && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Log visit</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New visit</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Outlet</Label><Input value={form.outletName} onChange={(e) => setForm({ ...form, outletName: e.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="productive">Productive</SelectItem>
                      <SelectItem value="non-productive">Non-productive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Remarks</Label><Textarea rows={3} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {list.map((v) => {
          const u = userMap.get(v.user_id);
          return (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary"><MapPin className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{v.outlet_name}</div>
                    <Badge variant={v.status === "productive" ? "default" : "secondary"}>{v.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{u?.full_name ?? "—"} · {v.visit_date}</div>
                  {v.remarks && <p className="text-sm mt-2">{v.remarks}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No visits yet</p>}
      </div>
    </div>
  );
}

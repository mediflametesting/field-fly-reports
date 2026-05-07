import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { db, userById } from "@/lib/mock-data";
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

export const Route = createFileRoute("/app/visits")({ component: VisitsPage });

function VisitsPage() {
  const { user } = useAuth();
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ outletName: "", status: "productive" as "productive" | "non-productive", remarks: "" });

  if (!user) return null;
  const isExec = user.role === "executive";
  const list = isExec ? db.visits.filter((v) => v.executiveId === user.id) : db.visits;

  const submit = () => {
    if (!form.outletName.trim()) { toast.error("Outlet name required"); return; }
    db.visits.unshift({
      id: `v${Date.now()}`,
      executiveId: user.id,
      outletName: form.outletName,
      date: new Date().toISOString().slice(0, 10),
      status: form.status,
      remarks: form.remarks,
    });
    toast.success("Visit logged");
    setOpen(false);
    setForm({ outletName: "", status: "productive", remarks: "" });
    force((n) => n + 1);
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
              <DialogFooter><Button onClick={submit}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {list.map((v) => {
          const u = userById(v.executiveId);
          return (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary"><MapPin className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{v.outletName}</div>
                    <Badge variant={v.status === "productive" ? "default" : "secondary"}>{v.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{u?.fullName} · {v.date}</div>
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

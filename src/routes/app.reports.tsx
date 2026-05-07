import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { db, userById, type DailyReport } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { user } = useAuth();
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), visits: "", newOutlets: "", ordersValue: "", collections: "", notes: "" });

  if (!user) return null;
  const isExec = user.role === "executive";
  const list: DailyReport[] = isExec ? db.reports.filter((r) => r.executiveId === user.id) : db.reports;

  const submit = () => {
    const v = Number(form.visits);
    if (!form.date || Number.isNaN(v)) { toast.error("Please complete the form"); return; }
    db.reports.unshift({
      id: `r${Date.now()}`,
      executiveId: user.id,
      date: form.date,
      visits: Number(form.visits) || 0,
      newOutlets: Number(form.newOutlets) || 0,
      ordersValue: Number(form.ordersValue) || 0,
      collections: Number(form.collections) || 0,
      notes: form.notes,
    });
    toast.success("Report submitted");
    setOpen(false);
    setForm({ date: new Date().toISOString().slice(0, 10), visits: "", newOutlets: "", ordersValue: "", collections: "", notes: "" });
    force((n) => n + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Reports</h1>
          <p className="text-sm text-muted-foreground">{isExec ? "Submit and review your daily activity" : "Team submissions"}</p>
        </div>
        {isExec && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> New report</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Daily report</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-1.5"><Label>Visits</Label><Input type="number" value={form.visits} onChange={(e) => setForm({ ...form, visits: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>New outlets</Label><Input type="number" value={form.newOutlets} onChange={(e) => setForm({ ...form, newOutlets: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Orders (₹)</Label><Input type="number" value={form.ordersValue} onChange={(e) => setForm({ ...form, ordersValue: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Collections (₹)</Label><Input type="number" value={form.collections} onChange={(e) => setForm({ ...form, collections: e.target.value })} /></div>
                <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={submit}>Submit</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {list.map((r) => {
          const u = userById(r.executiveId);
          return (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{u?.fullName ?? "—"}</CardTitle>
                  <span className="text-xs text-muted-foreground">{r.date}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <Stat label="Visits" value={r.visits} />
                  <Stat label="New" value={r.newOutlets} />
                  <Stat label="Orders" value={`₹${r.ordersValue.toLocaleString("en-IN")}`} />
                  <Stat label="Coll." value={`₹${r.collections.toLocaleString("en-IN")}`} />
                </div>
                {r.notes && <p className="text-sm text-muted-foreground mt-3">{r.notes}</p>}
              </CardContent>
            </Card>
          );
        })}
        {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No reports yet</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-muted/60 p-2">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

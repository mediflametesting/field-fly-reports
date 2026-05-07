import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { db, type Customer } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Plus, Search, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/customers")({ component: CustomersPage });

const empty: Omit<Customer, "id"> = { code: "", name: "", place: "", contactPerson: "", contactNumber: "", gstNumber: "", active: true };

function CustomersPage() {
  const { user, hasRole } = useAuth();
  const canEdit = hasRole("admin", "manager");
  const [, force] = useState(0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<Omit<Customer, "id">>(empty);

  if (!user) return null;

  const list = useMemo(() => {
    return db.customers.filter((c) => {
      const matches = `${c.code} ${c.name} ${c.place} ${c.contactPerson} ${c.contactNumber}`.toLowerCase().includes(q.toLowerCase());
      const sf = filter === "all" || (filter === "active" ? c.active : !c.active);
      return matches && sf;
    });
  }, [q, filter, db.customers.length]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); setForm({ ...c }); setOpen(true); };

  const submit = () => {
    if (!form.code.trim() || !form.name.trim() || !form.place.trim()) { toast.error("Code, Name and Place are required"); return; }
    const dup = db.customers.find((c) => (c.code.toLowerCase() === form.code.toLowerCase() || c.name.toLowerCase() === form.name.toLowerCase()) && c.id !== editing?.id);
    if (dup) { toast.error("Duplicate customer code or name"); return; }
    if (editing) {
      Object.assign(editing, form);
      toast.success("Customer updated");
    } else {
      db.customers.unshift({ id: `c${Date.now()}`, ...form });
      toast.success("Customer added");
    }
    setOpen(false); force((n) => n + 1);
  };

  const remove = (c: Customer) => {
    if (!confirm(`Delete ${c.name}?`)) return;
    db.customers = db.customers.filter((x) => x.id !== c.id);
    toast.success("Customer deleted");
    force((n) => n + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Master</h1>
          <p className="text-sm text-muted-foreground">Manage outlets and parties</p>
        </div>
        {canEdit && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add</Button>}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, code, place, contact…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {list.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary"><Users2 className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">{c.name}</div>
                  <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.code} · {c.place}</div>
                <div className="text-sm mt-1">{c.contactPerson} · {c.contactNumber}</div>
                {c.gstNumber && <div className="text-xs text-muted-foreground mt-0.5">GST: {c.gstNumber}</div>}
                {canEdit && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => remove(c)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No customers</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit customer" : "New customer"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Place *</Label><Input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Contact Person</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Contact Number</Label><Input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} /></div>
            <div className="space-y-1.5 col-span-2"><Label>GST (optional)</Label><Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} /></div>
            <div className="space-y-1.5 col-span-2">
              <Label>Status</Label>
              <Select value={form.active ? "active" : "inactive"} onValueChange={(v) => setForm({ ...form, active: v === "active" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={submit}>{editing ? "Update" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { customerService, type Customer } from "@/services/customerService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Plus, Search, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/customers")({ component: CustomersPage });

interface FormState {
  customer_code: string;
  customer_name: string;
  place: string;
  contact_person: string;
  contact_number: string;
  gst_number: string;
  status: "active" | "inactive";
}

const empty: FormState = {
  customer_code: "",
  customer_name: "",
  place: "",
  contact_person: "",
  contact_number: "",
  gst_number: "",
  status: "active",
};

function CustomersPage() {
  const { user, hasRole } = useAuth();
  const canEdit = hasRole("admin", "manager");
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const reload = async () => {
    setLoading(true);
    try {
      setList(await customerService.list());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    return list.filter((c) => {
      const hay = `${c.customer_code} ${c.customer_name} ${c.place ?? ""} ${c.contact_person ?? ""} ${c.contact_number ?? ""}`.toLowerCase();
      const matches = hay.includes(q.toLowerCase());
      const sf = filter === "all" || c.status === filter;
      return matches && sf;
    });
  }, [q, filter, list]);

  if (!user) return null;

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      customer_code: c.customer_code,
      customer_name: c.customer_name,
      place: c.place ?? "",
      contact_person: c.contact_person ?? "",
      contact_number: c.contact_number ?? "",
      gst_number: c.gst_number ?? "",
      status: c.status,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.customer_code.trim() || !form.customer_name.trim()) {
      toast.error("Code and Name are required"); return;
    }
    const dup = list.find((c) => c.customer_code.toLowerCase() === form.customer_code.toLowerCase() && c.id !== editing?.id);
    if (dup) { toast.error("Duplicate customer code"); return; }
    setSaving(true);
    try {
      const payload = {
        customer_code: form.customer_code,
        customer_name: form.customer_name,
        place: form.place || null,
        contact_person: form.contact_person || null,
        contact_number: form.contact_number || null,
        gst_number: form.gst_number || null,
        status: form.status,
      };
      if (editing) {
        await customerService.update(editing.id, payload);
        toast.success("Customer updated");
      } else {
        await customerService.create(payload);
        toast.success("Customer added");
      }
      setOpen(false);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Customer) => {
    if (!confirm(`Delete ${c.customer_name}?`)) return;
    try {
      await customerService.remove(c.id);
      toast.success("Deleted");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
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
        {filtered.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary"><Users2 className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">{c.customer_name}</div>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.customer_code} · {c.place}</div>
                <div className="text-sm mt-1">{c.contact_person} · {c.contact_number}</div>
                {c.gst_number && <div className="text-xs text-muted-foreground mt-0.5">GST: {c.gst_number}</div>}
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
        {!loading && filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No customers</p>}
        {loading && <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit customer" : "New customer"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Code *</Label><Input value={form.customer_code} onChange={(e) => setForm({ ...form, customer_code: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Place</Label><Input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Contact Person</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Contact Number</Label><Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></div>
            <div className="space-y-1.5 col-span-2"><Label>GST (optional)</Label><Input value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} /></div>
            <div className="space-y-1.5 col-span-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={submit} disabled={saving}>{saving ? "Saving…" : editing ? "Update" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

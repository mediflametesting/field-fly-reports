import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { db, type Company } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/companies")({ component: CompaniesPage });

const empty: Omit<Company, "id"> = { code: "", name: "", brand: "", active: true };

function CompaniesPage() {
  const { user, hasRole } = useAuth();
  const canEdit = hasRole("admin", "manager");
  const [, force] = useState(0);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<Omit<Company, "id">>(empty);
  if (!user) return null;

  const list = useMemo(
    () => db.companies.filter((c) => `${c.code} ${c.name} ${c.brand}`.toLowerCase().includes(q.toLowerCase())),
    [q, db.companies.length],
  );

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Company) => { setEditing(c); setForm({ ...c }); setOpen(true); };

  const submit = () => {
    if (!form.code.trim() || !form.name.trim()) { toast.error("Code and Name required"); return; }
    const dup = db.companies.find((c) => c.code.toLowerCase() === form.code.toLowerCase() && c.id !== editing?.id);
    if (dup) { toast.error("Duplicate company code"); return; }
    if (editing) Object.assign(editing, form);
    else db.companies.unshift({ id: `co${Date.now()}`, ...form });
    toast.success(editing ? "Company updated" : "Company added");
    setOpen(false); force((n) => n + 1);
  };

  const remove = (c: Company) => {
    if (!confirm(`Delete ${c.name}?`)) return;
    db.companies = db.companies.filter((x) => x.id !== c.id);
    toast.success("Deleted"); force((n) => n + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Master</h1>
          <p className="text-sm text-muted-foreground">Companies and brands you represent</p>
        </div>
        {canEdit && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add</Button>}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search company / brand / code" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary"><Building2 className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">{c.name}</div>
                  <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.code} · Brand: {c.brand}</div>
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
        {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-10 col-span-full">No companies</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit company" : "New company"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Brand</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
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

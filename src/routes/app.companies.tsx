import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { companyService, type Company } from "@/services/companyService";
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

interface FormState {
  company_code: string;
  company_name: string;
  brand: string;
  status: "active" | "inactive";
}

const empty: FormState = { company_code: "", company_name: "", brand: "", status: "active" };

function CompaniesPage() {
  const { user, hasRole } = useAuth();
  const canEdit = hasRole("admin", "manager");
  const [list, setList] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const reload = async () => {
    setLoading(true);
    try { setList(await companyService.list()); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(
    () => list.filter((c) => `${c.company_code ?? ""} ${c.company_name} ${c.brand ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    [q, list],
  );

  if (!user) return null;

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Company) => {
    setEditing(c);
    setForm({ company_code: c.company_code ?? "", company_name: c.company_name, brand: c.brand ?? "", status: c.status });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.company_name.trim()) { toast.error("Name required"); return; }
    if (form.company_code) {
      const dup = list.find((c) => (c.company_code ?? "").toLowerCase() === form.company_code.toLowerCase() && c.id !== editing?.id);
      if (dup) { toast.error("Duplicate company code"); return; }
    }
    setSaving(true);
    try {
      const payload = {
        company_code: form.company_code || null,
        company_name: form.company_name,
        brand: form.brand || null,
        status: form.status,
      };
      if (editing) await companyService.update(editing.id, payload);
      else await companyService.create(payload);
      toast.success(editing ? "Company updated" : "Company added");
      setOpen(false);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  const remove = async (c: Company) => {
    if (!confirm(`Delete ${c.company_name}?`)) return;
    try { await companyService.remove(c.id); toast.success("Deleted"); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed"); }
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
        {filtered.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary"><Building2 className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">{c.company_name}</div>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.company_code ?? "—"} · Brand: {c.brand ?? "—"}</div>
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
        {!loading && filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-10 col-span-full">No companies</p>}
        {loading && <p className="text-sm text-muted-foreground text-center py-10 col-span-full">Loading…</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit company" : "New company"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Code</Label><Input value={form.company_code} onChange={(e) => setForm({ ...form, company_code: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Brand</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
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

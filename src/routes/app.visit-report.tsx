import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { reportService, type VisitReport } from "@/services/reportService";
import { customerService, type Customer } from "@/services/customerService";
import { companyService, type Company } from "@/services/companyService";
import { userService, type AppUser } from "@/services/userService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, FileText, Save, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/visit-report")({ component: VisitReportPage });

const visitModes = ["Direct Visit", "Telephonic", "WhatsApp", "Video Call", "Distributor Meeting", "Retail Visit", "Follow-up"];
const collectionModes = ["Cash", "NEFT", "RTGS", "UPI", "PDC", "Cheque"];

const today = () => new Date().toISOString().slice(0, 10);

interface FormState {
  visit_date: string;
  company_id: string;
  customer_id: string;
  visit_mode: string;
  approx_order_value: string;
  collection_amount: string;
  collection_mode: string;
  collection_details: string;
  party_feedback: string;
  next_followup_date: string;
  photoFile: File | null;
}

const blank = (): FormState => ({
  visit_date: today(),
  company_id: "",
  customer_id: "",
  visit_mode: "Direct Visit",
  approx_order_value: "",
  collection_amount: "",
  collection_mode: "",
  collection_details: "",
  party_feedback: "",
  next_followup_date: "",
  photoFile: null,
});

function VisitReportPage() {
  const { user } = useAuth();
  const isExec = user?.role === "executive";

  const [reports, setReports] = useState<VisitReport[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [form, setForm] = useState<FormState>(blank());
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    if (!user) return;
    try {
      const [r, c, co, u] = await Promise.all([
        isExec ? reportService.listForUser(user.id) : reportService.listAll(),
        customerService.list(),
        companyService.list(),
        userService.list().catch(() => [] as AppUser[]),
      ]);
      setReports(r); setCustomers(c); setCompanies(co); setUsers(u);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [user?.id]);

  if (!user) return null;
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const onCustomerChange = (cid: string) => {
    setForm({ ...form, customer_id: cid });
  };

  const validate = () => {
    if (!form.company_id || !form.customer_id || !form.visit_mode) { toast.error("Company, Party and Visit Type are required"); return false; }
    if (form.collection_amount && !form.collection_mode) { toast.error("Select collection mode"); return false; }
    return true;
  };

  const persist = async (status: "draft" | "submitted") => {
    if (!validate()) return;
    setSaving(true);
    try {
      const created = await reportService.create({
        user_id: user.id,
        company_id: form.company_id || null,
        customer_id: form.customer_id || null,
        visit_date: form.visit_date,
        visit_mode: form.visit_mode,
        approx_order_value: Number(form.approx_order_value) || 0,
        collection_amount: Number(form.collection_amount) || 0,
        collection_mode: form.collection_mode || null,
        collection_details: form.collection_details || null,
        party_feedback: form.party_feedback || null,
        next_followup_date: form.next_followup_date || null,
        status,
      });
      if (form.photoFile) {
        try { await reportService.uploadAttachment(created.id, form.photoFile); }
        catch (e) { toast.error(e instanceof Error ? "Saved, but attachment failed: " + e.message : "Attachment failed"); }
      }
      toast.success(status === "draft" ? "Saved as draft" : "Report submitted");
      setForm(blank());
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Visit Report</h1>
        <p className="text-sm text-muted-foreground">Quickly log every customer interaction from the field</p>
      </div>

      {isExec && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> New visit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visit details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Sales Executive</Label><Input value={user.fullName} disabled /></div>
                <div className="space-y-1.5">
                  <Label>Company</Label>
                  <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>{companies.filter((c) => c.status === "active").map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Party / Customer</Label>
                  <Select value={form.customer_id} onValueChange={onCustomerChange}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{customers.filter((c) => c.status === "active").map((c) => <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Visit Type</Label>
                  <Select value={form.visit_mode} onValueChange={(v) => setForm({ ...form, visit_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{visitModes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order & collection</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Approx Order Value (₹)</Label><Input type="number" value={form.approx_order_value} onChange={(e) => setForm({ ...form, approx_order_value: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Collection Amount (₹)</Label><Input type="number" value={form.collection_amount} onChange={(e) => setForm({ ...form, collection_amount: e.target.value })} /></div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Mode of Collection</Label>
                  <Select value={form.collection_mode} onValueChange={(v) => setForm({ ...form, collection_mode: v })}>
                    <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                    <SelectContent>{collectionModes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Collection Notes</Label><Textarea rows={3} placeholder="Cheque #, PDC date, bank, transaction ref, remarks…" value={form.collection_details} onChange={(e) => setForm({ ...form, collection_details: e.target.value })} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Next Follow-up Date</Label><Input type="date" value={form.next_followup_date} onChange={(e) => setForm({ ...form, next_followup_date: e.target.value })} /></div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feedback</h3>
              <Textarea rows={5} placeholder="Market feedback, competitor activity, complaints, product feedback, follow-up notes" value={form.party_feedback} onChange={(e) => setForm({ ...form, party_feedback: e.target.value })} />
            </section>

            <section className="space-y-2">
              <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Attach photo (document / cheque)</Label>
              <Input type="file" accept="image/*" capture="environment" onChange={(e) => setForm({ ...form, photoFile: e.target.files?.[0] ?? null })} />
              {form.photoFile && <p className="text-xs text-muted-foreground">Selected: {form.photoFile.name}</p>}
            </section>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" disabled={saving} onClick={() => persist("draft")}><Save className="h-4 w-4 mr-1" /> Save draft</Button>
              <Button disabled={saving} onClick={() => persist("submitted")}><Send className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Submit report"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">{isExec ? "My recent reports" : "Team submissions"}</h2>
        {reports.map((r) => {
          const cust = r.customer_id ? customerMap.get(r.customer_id) : null;
          const co = r.company_id ? companyMap.get(r.company_id) : null;
          const u = userMap.get(r.user_id);
          return (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{cust?.customer_name ?? "—"}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "submitted" ? "default" : "secondary"}>{r.status}</Badge>
                    {r.visit_mode && <Badge variant="outline">{r.visit_mode}</Badge>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{co?.company_name ?? "—"} · {cust?.place ?? ""} · {r.visit_date}{!isExec && u ? ` · ${u.full_name}` : ""}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Order: <span className="font-semibold">₹{Number(r.approx_order_value).toLocaleString("en-IN")}</span></div>
                  <div>Collection: <span className="font-semibold">₹{Number(r.collection_amount).toLocaleString("en-IN")}</span>{r.collection_mode ? ` · ${r.collection_mode}` : ""}</div>
                </div>
                {r.party_feedback && <p className="text-sm text-muted-foreground">{r.party_feedback}</p>}
              </CardContent>
            </Card>
          );
        })}
        {reports.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No visit reports yet</p>}
      </div>
    </div>
  );
}

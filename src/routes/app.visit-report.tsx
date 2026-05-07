import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { db, customerById, companyById, type CollectionMode, type VisitReport, type VisitType } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, FileText, Pencil, Save, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/visit-report")({ component: VisitReportPage });

const visitTypes: VisitType[] = ["Direct Visit", "Telephonic", "WhatsApp", "Video Call", "Distributor Meeting", "Retail Visit", "Follow-up"];
const collectionModes: CollectionMode[] = ["Cash", "NEFT", "RTGS", "UPI", "PDC", "Cheque"];

const today = () => new Date().toISOString().slice(0, 10);

interface FormState {
  date: string;
  companyId: string;
  customerId: string;
  place: string;
  visitType: VisitType;
  orderValue: string;
  collectionAmount: string;
  collectionMode: CollectionMode | "";
  collectionNotes: string;
  feedback: string;
  photoName: string;
}

const blank = (): FormState => ({
  date: today(),
  companyId: "",
  customerId: "",
  place: "",
  visitType: "Direct Visit",
  orderValue: "",
  collectionAmount: "",
  collectionMode: "",
  collectionNotes: "",
  feedback: "",
  photoName: "",
});

function VisitReportPage() {
  const { user } = useAuth();
  const [, force] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blank());

  if (!user) return null;
  const isExec = user.role === "executive";

  const myReports = useMemo(
    () => db.visitReports.filter((r) => !isExec || r.executiveId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [user.id, isExec, db.visitReports.length],
  );

  const onCustomerChange = (cid: string) => {
    const c = customerById(cid);
    setForm({ ...form, customerId: cid, place: c?.place ?? form.place });
  };

  const validate = () => {
    if (!form.companyId || !form.customerId || !form.visitType) { toast.error("Company, Party and Visit Type are required"); return false; }
    if (form.collectionAmount && !form.collectionMode) { toast.error("Select collection mode"); return false; }
    return true;
  };

  const buildPayload = (status: "draft" | "submitted"): VisitReport => ({
    id: editingId ?? `vr${Date.now()}`,
    executiveId: user.id,
    date: form.date,
    companyId: form.companyId,
    customerId: form.customerId,
    place: form.place,
    visitType: form.visitType,
    orderValue: Number(form.orderValue) || 0,
    collectionAmount: Number(form.collectionAmount) || 0,
    collectionMode: form.collectionMode || undefined,
    collectionNotes: form.collectionNotes,
    feedback: form.feedback,
    status,
    createdAt: new Date().toISOString(),
  });

  const persist = (status: "draft" | "submitted") => {
    if (!validate()) return;
    const payload = buildPayload(status);
    if (editingId) {
      const idx = db.visitReports.findIndex((r) => r.id === editingId);
      if (idx >= 0) db.visitReports[idx] = payload;
    } else {
      db.visitReports.unshift(payload);
    }
    toast.success(status === "draft" ? "Saved as draft" : "Report submitted");
    setEditingId(null);
    setForm(blank());
    force((n) => n + 1);
  };

  const editReport = (r: VisitReport) => {
    if (r.date !== today()) { toast.error("Only same-day reports are editable"); return; }
    setEditingId(r.id);
    setForm({
      date: r.date,
      companyId: r.companyId,
      customerId: r.customerId,
      place: r.place,
      visitType: r.visitType,
      orderValue: String(r.orderValue || ""),
      collectionAmount: String(r.collectionAmount || ""),
      collectionMode: r.collectionMode ?? "",
      collectionNotes: r.collectionNotes,
      feedback: r.feedback,
      photoName: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              <FileText className="h-4 w-4" /> {editingId ? "Edit report" : "New visit"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visit details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Sales Executive</Label><Input value={user.fullName} disabled /></div>
                <div className="space-y-1.5">
                  <Label>Company</Label>
                  <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>{db.companies.filter((c) => c.active).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Party / Customer</Label>
                  <Select value={form.customerId} onValueChange={onCustomerChange}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{db.customers.filter((c) => c.active).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2"><Label>Place</Label><Input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="Auto from customer" /></div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Visit Type</Label>
                  <Select value={form.visitType} onValueChange={(v) => setForm({ ...form, visitType: v as VisitType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{visitTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order & collection</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Approx Order Value (₹)</Label><Input type="number" value={form.orderValue} onChange={(e) => setForm({ ...form, orderValue: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Collection Amount (₹)</Label><Input type="number" value={form.collectionAmount} onChange={(e) => setForm({ ...form, collectionAmount: e.target.value })} /></div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Mode of Collection</Label>
                  <Select value={form.collectionMode} onValueChange={(v) => setForm({ ...form, collectionMode: v as CollectionMode })}>
                    <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                    <SelectContent>{collectionModes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2"><Label>Collection Notes</Label><Textarea rows={3} placeholder="Cheque #, PDC date, bank, transaction ref, remarks…" value={form.collectionNotes} onChange={(e) => setForm({ ...form, collectionNotes: e.target.value })} /></div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feedback</h3>
              <Textarea rows={5} placeholder="Market feedback, competitor activity, complaints, product feedback, follow-up notes" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
            </section>

            <section className="space-y-2">
              <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Attach photo (document / cheque)</Label>
              <Input type="file" accept="image/*" capture="environment" onChange={(e) => setForm({ ...form, photoName: e.target.files?.[0]?.name ?? "" })} />
              {form.photoName && <p className="text-xs text-muted-foreground">Selected: {form.photoName}</p>}
            </section>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => persist("draft")}><Save className="h-4 w-4 mr-1" /> Save draft</Button>
              <Button onClick={() => persist("submitted")}><Send className="h-4 w-4 mr-1" /> Submit report</Button>
              {editingId && <Button variant="ghost" onClick={() => { setEditingId(null); setForm(blank()); }}>Cancel</Button>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">{isExec ? "My recent reports" : "Team submissions"}</h2>
        {myReports.map((r) => {
          const cust = customerById(r.customerId);
          const co = companyById(r.companyId);
          const isToday = r.date === today();
          return (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{cust?.name ?? "—"}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "submitted" ? "default" : "secondary"}>{r.status}</Badge>
                    <Badge variant="outline">{r.visitType}</Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{co?.name} · {r.place} · {r.date}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Order: <span className="font-semibold">₹{r.orderValue.toLocaleString("en-IN")}</span></div>
                  <div>Collection: <span className="font-semibold">₹{r.collectionAmount.toLocaleString("en-IN")}</span>{r.collectionMode ? ` · ${r.collectionMode}` : ""}</div>
                </div>
                {r.feedback && <p className="text-sm text-muted-foreground">{r.feedback}</p>}
                {isExec && isToday && (
                  <Button size="sm" variant="outline" onClick={() => editReport(r)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {myReports.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No visit reports yet</p>}
      </div>
    </div>
  );
}

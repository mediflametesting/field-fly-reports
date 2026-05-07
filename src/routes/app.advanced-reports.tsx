import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { db, userById, customerById, companyById, type CollectionMode } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/advanced-reports")({ component: AdvancedReports });

const today = new Date().toISOString().slice(0, 10);
const days30Ago = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function AdvancedReports() {
  const { user, hasRole } = useAuth();
  const isExec = user?.role === "executive";
  const [from, setFrom] = useState(days30Ago);
  const [to, setTo] = useState(today);
  const [execId, setExecId] = useState<string>("all");
  const [companyId, setCompanyId] = useState<string>("all");
  const [customerId, setCustomerId] = useState<string>("all");
  const [place, setPlace] = useState("");
  const [mode, setMode] = useState<string>("all");

  if (!user) return null;

  const filtered = useMemo(() => {
    return db.visitReports.filter((r) => {
      if (isExec && r.executiveId !== user.id) return false;
      if (r.date < from || r.date > to) return false;
      if (!isExec && execId !== "all" && r.executiveId !== execId) return false;
      if (companyId !== "all" && r.companyId !== companyId) return false;
      if (customerId !== "all" && r.customerId !== customerId) return false;
      if (place && !r.place.toLowerCase().includes(place.toLowerCase())) return false;
      if (mode !== "all" && r.collectionMode !== (mode as CollectionMode)) return false;
      return true;
    });
  }, [from, to, execId, companyId, customerId, place, mode, isExec, user.id, db.visitReports.length]);

  const exportCSV = () => {
    const header = ["Date", "Executive", "Company", "Customer", "Place", "Visit Type", "Order ₹", "Collection ₹", "Mode", "Notes", "Feedback"];
    const rows = filtered.map((r) => [
      r.date,
      userById(r.executiveId)?.fullName ?? "",
      companyById(r.companyId)?.name ?? "",
      customerById(r.customerId)?.name ?? "",
      r.place,
      r.visitType,
      r.orderValue,
      r.collectionAmount,
      r.collectionMode ?? "",
      r.collectionNotes,
      r.feedback,
    ]);
    downloadCSV(`visit-reports-${from}_${to}.csv`, [header, ...rows]);
    toast.success("CSV exported");
  };

  const printReport = () => window.print();

  // Aggregations
  const orderSummary = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => m.set(r.date, (m.get(r.date) ?? 0) + r.orderValue));
    return Array.from(m.entries()).sort();
  }, [filtered]);

  const collectionSummary = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => { if (r.collectionMode) m.set(r.collectionMode, (m.get(r.collectionMode) ?? 0) + r.collectionAmount); });
    return Array.from(m.entries());
  }, [filtered]);

  const execPerformance = useMemo(() => {
    const m = new Map<string, { visits: number; orders: number; coll: number }>();
    filtered.forEach((r) => {
      const cur = m.get(r.executiveId) ?? { visits: 0, orders: 0, coll: 0 };
      cur.visits += 1; cur.orders += r.orderValue; cur.coll += r.collectionAmount;
      m.set(r.executiveId, cur);
    });
    return Array.from(m.entries());
  }, [filtered]);

  const companySales = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => m.set(r.companyId, (m.get(r.companyId) ?? 0) + r.orderValue));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const customerHistory = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => m.set(r.customerId, (m.get(r.customerId) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Filter, drill down, and export</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export</Button>
          <Button variant="outline" onClick={printReport}><Printer className="h-4 w-4 mr-1" /> Print</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5"><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            {!isExec && (
              <div className="space-y-1.5">
                <Label>Executive</Label>
                <Select value={execId} onValueChange={setExecId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {db.users.filter((u) => u.role === "executive").map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {db.companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {db.customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Place</Label><Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City…" /></div>
            <div className="space-y-1.5">
              <Label>Collection Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(["Cash","NEFT","RTGS","UPI","PDC","Cheque"] as const).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="visits">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="exec">Executive</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
        </TabsList>

        <TabsContent value="visits">
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Executive</TableHead><TableHead>Company</TableHead><TableHead>Customer</TableHead><TableHead>Place</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Order ₹</TableHead><TableHead className="text-right">Coll ₹</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{userById(r.executiveId)?.fullName}</TableCell>
                    <TableCell>{companyById(r.companyId)?.name}</TableCell>
                    <TableCell>{customerById(r.customerId)?.name}</TableCell>
                    <TableCell>{r.place}</TableCell>
                    <TableCell>{r.visitType}</TableCell>
                    <TableCell className="text-right">{r.orderValue.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{r.collectionAmount.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Total Orders ₹</TableHead></TableRow></TableHeader>
              <TableBody>{orderSummary.map(([d, v]) => <TableRow key={d}><TableCell>{d}</TableCell><TableCell className="text-right">{v.toLocaleString("en-IN")}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="collections">
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Mode</TableHead><TableHead className="text-right">Total ₹</TableHead></TableRow></TableHeader>
              <TableBody>{collectionSummary.map(([m, v]) => <TableRow key={m}><TableCell>{m}</TableCell><TableCell className="text-right">{v.toLocaleString("en-IN")}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="exec">
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Executive</TableHead><TableHead className="text-right">Visits</TableHead><TableHead className="text-right">Orders ₹</TableHead><TableHead className="text-right">Collections ₹</TableHead></TableRow></TableHeader>
              <TableBody>{execPerformance.map(([id, s]) => <TableRow key={id}><TableCell>{userById(id)?.fullName}</TableCell><TableCell className="text-right">{s.visits}</TableCell><TableCell className="text-right">{s.orders.toLocaleString("en-IN")}</TableCell><TableCell className="text-right">{s.coll.toLocaleString("en-IN")}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="company">
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Company</TableHead><TableHead className="text-right">Orders ₹</TableHead></TableRow></TableHeader>
              <TableBody>{companySales.map(([id, v]) => <TableRow key={id}><TableCell>{companyById(id)?.name}</TableCell><TableCell className="text-right">{v.toLocaleString("en-IN")}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="customer">
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead className="text-right">Visits</TableHead></TableRow></TableHeader>
              <TableBody>{customerHistory.map(([id, n]) => <TableRow key={id}><TableCell>{customerById(id)?.name}</TableCell><TableCell className="text-right">{n}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {!hasRole("admin", "manager", "hr", "executive") && null}
    </div>
  );
}

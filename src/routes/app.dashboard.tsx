import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, ShoppingCart, MapPin, IndianRupee, FileText } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dailyReportService, type DailyReport } from "@/services/dailyReportService";
import { orderService, type Order } from "@/services/orderService";
import { userService, type AppUser } from "@/services/userService";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Stat({ icon: Icon, label, value, hint }: { icon: typeof TrendingUp; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
            {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isExec = user?.role === "executive";

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const [r, o, u] = await Promise.all([
          dailyReportService.list(isExec ? user.id : undefined),
          orderService.list(isExec ? user.id : undefined),
          userService.list().catch(() => []),
        ]);
        if (!alive) return;
        setReports(r);
        setOrders(o);
        setUsers(u);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user, isExec]);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  if (!user) return null;

  const totalSales = orders.reduce((s, o) => s + Number(o.amount), 0);
  const totalVisits = reports.reduce((s, r) => s + r.visits_count, 0);
  const newOutlets = reports.reduce((s, r) => s + r.new_outlets, 0);
  const teamCount = users.filter((u) => u.role === "executive").length;

  const byDate = new Map<string, number>();
  reports.forEach((r) => byDate.set(r.report_date, (byDate.get(r.report_date) ?? 0) + Number(r.orders_value)));
  const chartData = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date: date.slice(5), value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hello, {user.fullName.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted-foreground capitalize">{user.role} dashboard · today's snapshot</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat icon={IndianRupee} label="Sales" value={`₹${totalSales.toLocaleString("en-IN")}`} hint="All open orders" />
        <Stat icon={MapPin} label="Visits" value={String(totalVisits)} hint="Reported" />
        <Stat icon={ShoppingCart} label="Orders" value={String(orders.length)} />
        <Stat icon={isExec ? FileText : Users} label={isExec ? "New Outlets" : "Team"} value={String(isExec ? newOutlets : teamCount)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Order value trend</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent reports</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {reports.slice(0, 5).map((r) => {
              const u = userById.get(r.user_id);
              return (
                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{u?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.report_date} · {r.visits_count} visits · {r.new_outlets} new</div>
                  </div>
                  <div className="text-sm font-semibold">₹{Number(r.orders_value).toLocaleString("en-IN")}</div>
                </div>
              );
            })}
            {!loading && reports.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No reports yet</p>}
            {loading && <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { db, userById } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, ShoppingCart, MapPin, IndianRupee, FileText } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/app/dashboard")({
  component: Dashboard,
});

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
  if (!user) return null;

  const isExec = user.role === "executive";
  const myReports = isExec ? db.reports.filter((r) => r.executiveId === user.id) : db.reports;
  const myVisits = isExec ? db.visits.filter((v) => v.executiveId === user.id) : db.visits;
  const myOrders = isExec ? db.orders.filter((o) => o.executiveId === user.id) : db.orders;

  const totalSales = myOrders.reduce((s, o) => s + o.amount, 0);
  const totalVisits = myReports.reduce((s, r) => s + r.visits, 0);
  const newOutlets = myReports.reduce((s, r) => s + r.newOutlets, 0);
  const teamCount = db.users.filter((u) => u.role === "executive").length;

  // Aggregate by date for chart
  const byDate = new Map<string, number>();
  myReports.forEach((r) => byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.ordersValue));
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
        <Stat icon={ShoppingCart} label="Orders" value={String(myOrders.length)} />
        <Stat icon={isExec ? FileText : Users} label={isExec ? "New Outlets" : "Team"} value={String(isExec ? newOutlets : teamCount)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order value trend</CardTitle>
        </CardHeader>
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
            {myReports.slice(0, 5).map((r) => {
              const u = userById(r.executiveId);
              return (
                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{u?.fullName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.date} · {r.visits} visits · {r.newOutlets} new</div>
                  </div>
                  <div className="text-sm font-semibold">₹{r.ordersValue.toLocaleString("en-IN")}</div>
                </div>
              );
            })}
            {myReports.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No reports yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

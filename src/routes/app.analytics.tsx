import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { orderService, type Order } from "@/services/orderService";
import { visitLogService, type VisitLog } from "@/services/visitLogService";
import { userService, type AppUser } from "@/services/userService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/app/analytics")({ component: AnalyticsPage });

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [o, v, u] = await Promise.all([
          orderService.list(),
          visitLogService.list(),
          userService.list().catch(() => [] as AppUser[]),
        ]);
        setOrders(o); setVisits(v); setUsers(u);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load analytics");
      }
    })();
  }, []);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const execs = users.filter((u) => u.role === "executive");
  const perExec = execs.map((u) => {
    const sales = orders.filter((o) => o.user_id === u.id).reduce((s, o) => s + Number(o.amount), 0);
    const v = visits.filter((vv) => vv.user_id === u.id).length;
    return { name: u.full_name.split(" ")[0], sales, visits: v };
  });

  const productiveCount = visits.filter((v) => v.status === "productive").length;
  const nonProd = visits.length - productiveCount;
  const pieData = [
    { name: "Productive", value: productiveCount },
    { name: "Non-productive", value: nonProd },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Performance overview</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Sales by executive</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perExec}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Visit productivity</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Visits by executive</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perExec}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="visits" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent orders</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {orders.slice(0, 8).map((o) => (
              <div key={o.id} className="py-2 flex justify-between text-sm">
                <span>{userMap.get(o.user_id)?.full_name ?? "—"} → {o.outlet_name}</span>
                <span className="font-medium">₹{Number(o.amount).toLocaleString("en-IN")}</span>
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm text-muted-foreground py-4">No orders yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { db, userById } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

export const Route = createFileRoute("/app/analytics")({ component: AnalyticsPage });

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function AnalyticsPage() {
  const perExec = db.users.filter((u) => u.role === "executive").map((u) => {
    const sales = db.orders.filter((o) => o.executiveId === u.id).reduce((s, o) => s + o.amount, 0);
    const visits = db.reports.filter((r) => r.executiveId === u.id).reduce((s, r) => s + r.visits, 0);
    return { name: u.fullName.split(" ")[0], sales, visits };
  });

  const productiveCount = db.visits.filter((v) => v.status === "productive").length;
  const nonProd = db.visits.length - productiveCount;
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
            {db.orders.slice(0, 8).map((o) => (
              <div key={o.id} className="py-2 flex justify-between text-sm">
                <span>{userById(o.executiveId)?.fullName} → {o.outletName}</span>
                <span className="font-medium">₹{o.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

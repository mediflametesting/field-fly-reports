import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { userService, type AppUser } from "@/services/userService";
import { orderService, type Order } from "@/services/orderService";
import { dailyReportService, type DailyReport } from "@/services/dailyReportService";

export const Route = createFileRoute("/app/team")({ component: TeamPage });

function TeamPage() {
  const [team, setTeam] = useState<AppUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, o, r] = await Promise.all([
          userService.listExecutives(),
          orderService.list(),
          dailyReportService.list(),
        ]);
        setTeam(u);
        setOrders(o);
        setReports(r);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = (id: string) => {
    const sales = orders.filter((o) => o.user_id === id).reduce((s, o) => s + Number(o.amount), 0);
    const visits = reports.filter((r) => r.user_id === id).reduce((s, r) => s + r.visits_count, 0);
    return { sales, visits };
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">Field sales executives</p>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((u) => {
          const s = stats(u.id);
          return (
            <Card key={u.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <Avatar><AvatarFallback>{u.full_name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold truncate">{u.full_name}</div>
                    <Badge variant="outline">{u.region ?? "—"}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">@{u.username}</div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="rounded bg-muted/60 p-2"><div className="text-muted-foreground">Sales</div><div className="font-semibold text-sm">₹{s.sales.toLocaleString("en-IN")}</div></div>
                    <div className="rounded bg-muted/60 p-2"><div className="text-muted-foreground">Visits</div><div className="font-semibold text-sm">{s.visits}</div></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

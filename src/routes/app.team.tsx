import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/team")({ component: TeamPage });

function TeamPage() {
  const team = db.users.filter((u) => u.role === "executive");
  const stats = (id: string) => {
    const reports = db.reports.filter((r) => r.executiveId === id);
    const sales = db.orders.filter((o) => o.executiveId === id).reduce((s, o) => s + o.amount, 0);
    const visits = reports.reduce((s, r) => s + r.visits, 0);
    return { sales, visits };
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">Field sales executives</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((u) => {
          const s = stats(u.id);
          return (
            <Card key={u.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <Avatar><AvatarFallback>{u.fullName.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold truncate">{u.fullName}</div>
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

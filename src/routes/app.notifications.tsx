import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { notificationService, type Notification } from "@/services/notificationService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    try { setList(await notificationService.list(user.id)); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [user?.id]);

  if (!user) return null;

  const markAll = async () => {
    try { await notificationService.markAllRead(user.id); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const toggle = async (n: Notification) => {
    try { await notificationService.setRead(n.id, !n.read); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Reminders and alerts</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAll}><CheckCheck className="h-4 w-4 mr-1" /> Mark all read</Button>
      </div>

      <div className="grid gap-3">
        {list.map((n) => (
          <Card key={n.id} className={n.read ? "opacity-70" : ""}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">{n.read ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{n.title}</div>
                  <Badge variant={n.type === "alert" ? "destructive" : n.type === "reminder" ? "default" : "secondary"}>{n.type}</Badge>
                </div>
                {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs" onClick={() => toggle(n)}>
                  Mark as {n.read ? "unread" : "read"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && list.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No notifications</p>}
        {loading && <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>}
      </div>
    </div>
  );
}

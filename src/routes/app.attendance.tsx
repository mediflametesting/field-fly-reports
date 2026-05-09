import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { attendanceService, type Attendance } from "@/services/attendanceService";
import { userService, type AppUser } from "@/services/userService";

export const Route = createFileRoute("/app/attendance")({ component: AttendancePage });

function AttendancePage() {
  const { user } = useAuth();
  const isExec = user?.role === "executive";
  const [list, setList] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    if (!user) return;
    const [a, u] = await Promise.all([
      attendanceService.list(isExec ? user.id : undefined),
      isExec ? Promise.resolve([] as AppUser[]) : userService.list().catch(() => []),
    ]);
    setList(a);
    setUsers(u);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [user?.id]);

  if (!user) return null;
  const today = new Date().toISOString().slice(0, 10);
  const myToday = list.find((a) => a.user_id === user.id && a.att_date === today);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const checkIn = async () => {
    if (myToday) { toast.info("Already checked in"); return; }
    setBusy(true);
    try {
      await attendanceService.checkIn(user.id);
      toast.success("Checked in");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground">{isExec ? "Mark your presence" : "Team attendance log"}</p>
      </div>

      {isExec && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Today</CardTitle></CardHeader>
          <CardContent>
            {myToday ? (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Checked in at <strong>{myToday.check_in}</strong></span>
              </div>
            ) : (
              <Button onClick={checkIn} disabled={busy}><Clock className="h-4 w-4 mr-1" /> {busy ? "Saving…" : "Check in now"}</Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {!isExec && <TableHead>Executive</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((a) => (
                <TableRow key={a.id}>
                  {!isExec && <TableCell>{userMap.get(a.user_id)?.full_name ?? "—"}</TableCell>}
                  <TableCell>{a.att_date}</TableCell>
                  <TableCell><Badge variant={a.status === "present" ? "default" : a.status === "leave" ? "secondary" : "destructive"}>{a.status}</Badge></TableCell>
                  <TableCell>{a.check_in ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

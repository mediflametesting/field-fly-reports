import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { db, userById } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/attendance")({ component: AttendancePage });

function AttendancePage() {
  const { user } = useAuth();
  const [, force] = useState(0);
  if (!user) return null;
  const isExec = user.role === "executive";
  const today = new Date().toISOString().slice(0, 10);
  const myToday = db.attendance.find((a) => a.executiveId === user.id && a.date === today);
  const list = isExec ? db.attendance.filter((a) => a.executiveId === user.id) : db.attendance;

  const checkIn = () => {
    if (myToday) { toast.info("Already checked in"); return; }
    db.attendance.unshift({
      id: `a${Date.now()}`,
      executiveId: user.id,
      date: today,
      status: "present",
      checkIn: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    toast.success("Checked in");
    force((n) => n + 1);
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
                <span>Checked in at <strong>{myToday.checkIn}</strong></span>
              </div>
            ) : (
              <Button onClick={checkIn}><Clock className="h-4 w-4 mr-1" /> Check in now</Button>
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
                  {!isExec && <TableCell>{userById(a.executiveId)?.fullName}</TableCell>}
                  <TableCell>{a.date}</TableCell>
                  <TableCell><Badge variant={a.status === "present" ? "default" : a.status === "leave" ? "secondary" : "destructive"}>{a.status}</Badge></TableCell>
                  <TableCell>{a.checkIn ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

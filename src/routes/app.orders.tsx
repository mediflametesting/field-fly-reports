import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { orderService, type Order } from "@/services/orderService";
import { userService, type AppUser } from "@/services/userService";

export const Route = createFileRoute("/app/orders")({ component: OrdersPage });

function OrdersPage() {
  const { user } = useAuth();
  const isExec = user?.role === "executive";
  const [list, setList] = useState<Order[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ outletName: "", amount: "", products: "" });

  const reload = async () => {
    if (!user) return;
    const [o, u] = await Promise.all([
      orderService.list(isExec ? user.id : undefined),
      userService.list().catch(() => []),
    ]);
    setList(o);
    setUsers(u);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [user?.id]);

  if (!user) return null;
  const userMap = new Map(users.map((u) => [u.id, u]));

  const submit = async () => {
    if (!form.outletName || !form.amount) { toast.error("Fill required fields"); return; }
    setSaving(true);
    try {
      await orderService.create({
        user_id: user.id,
        customer_id: null,
        outlet_name: form.outletName,
        order_date: new Date().toISOString().slice(0, 10),
        amount: Number(form.amount),
        products: form.products || null,
        status: "pending",
      });
      toast.success("Order created");
      setOpen(false);
      setForm({ outletName: "", amount: "", products: "" });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Booked orders</p>
        </div>
        {isExec && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New order</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New order</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Outlet</Label><Input value={form.outletName} onChange={(e) => setForm({ ...form, outletName: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Products / SKUs</Label><Input value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} placeholder="HUL, ITC, Nestle" /></div>
              </div>
              <DialogFooter><Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {list.map((o) => {
          const u = userMap.get(o.user_id);
          return (
            <Card key={o.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary"><ShoppingCart className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{o.outlet_name}</div>
                    <Badge variant={o.status === "delivered" ? "default" : o.status === "approved" ? "secondary" : "outline"}>{o.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{u?.full_name ?? "—"} · {o.order_date}</div>
                  {o.products && <p className="text-sm mt-1 text-muted-foreground">{o.products}</p>}
                  <div className="mt-2 text-base font-semibold">₹{Number(o.amount).toLocaleString("en-IN")}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No orders yet</p>}
      </div>
    </div>
  );
}

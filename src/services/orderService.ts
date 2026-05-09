import { supabase } from "@/supabase/supabaseClient";

export interface Order {
  id: string;
  user_id: string;
  customer_id: string | null;
  outlet_name: string;
  order_date: string;
  amount: number;
  products: string | null;
  status: "pending" | "approved" | "delivered" | "cancelled";
  created_at: string;
}

export const orderService = {
  async list(userId?: string): Promise<Order[]> {
    let q = supabase.from("orders").select("*").order("order_date", { ascending: false });
    if (userId) q = q.eq("user_id", userId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Order[];
  },
  async create(o: Omit<Order, "id" | "created_at">) {
    const { data, error } = await supabase.from("orders").insert(o).select().single();
    if (error) throw error;
    return data as Order;
  },
};

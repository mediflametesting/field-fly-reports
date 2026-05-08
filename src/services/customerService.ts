import { supabase } from "@/supabase/supabaseClient";

export interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  place: string | null;
  contact_person: string | null;
  contact_number: string | null;
  gst_number: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export const customerService = {
  async list(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("customer_name");
    if (error) throw error;
    return (data ?? []) as Customer[];
  },
  async create(c: Omit<Customer, "id" | "created_at">) {
    const { data, error } = await supabase.from("customers").insert(c).select().single();
    if (error) throw error;
    return data as Customer;
  },
  async update(id: string, c: Partial<Customer>) {
    const { data, error } = await supabase
      .from("customers")
      .update(c)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Customer;
  },
  async remove(id: string) {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
  },
};

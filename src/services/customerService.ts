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

function fromDb(r: any): Customer {
  return { ...r, status: typeof r.status === "boolean" ? (r.status ? "active" : "inactive") : (r.status ?? "active") };
}
function toDb(c: any): any {
  const out: any = { ...c };
  if ("status" in out) out.status = out.status === "active" || out.status === true;
  return out;
}

export const customerService = {
  async list(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("customer_name");
    if (error) throw error;
    return (data ?? []).map(fromDb);
  },
  async create(c: Omit<Customer, "id" | "created_at">) {
    const { data, error } = await supabase.from("customers").insert(toDb(c)).select().single();
    if (error) throw error;
    return fromDb(data);
  },
  async update(id: string, c: Partial<Customer>) {
    const { data, error } = await supabase
      .from("customers")
      .update(toDb(c))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return fromDb(data);
  },
  async remove(id: string) {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
  },
};

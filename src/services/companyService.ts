import { supabase } from "@/supabase/supabaseClient";

export interface Company {
  id: string;
  company_code: string | null;
  company_name: string;
  brand: string | null;
  status: "active" | "inactive";
  created_at: string;
}

function fromDb(r: any): Company {
  return { ...r, status: typeof r.status === "boolean" ? (r.status ? "active" : "inactive") : (r.status ?? "active") };
}
function toDb(c: any): any {
  const out: any = { ...c };
  if ("status" in out) out.status = out.status === "active" || out.status === true;
  return out;
}

export const companyService = {
  async list(): Promise<Company[]> {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("company_name");
    if (error) throw error;
    return (data ?? []).map(fromDb);
  },
  async create(c: Omit<Company, "id" | "created_at">) {
    const { data, error } = await supabase.from("companies").insert(toDb(c)).select().single();
    if (error) throw error;
    return fromDb(data);
  },
  async update(id: string, c: Partial<Company>) {
    const { data, error } = await supabase
      .from("companies")
      .update(toDb(c))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return fromDb(data);
  },
  async remove(id: string) {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) throw error;
  },
};

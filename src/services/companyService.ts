import { supabase } from "@/supabase/supabaseClient";

export interface Company {
  id: string;
  company_code: string | null;
  company_name: string;
  brand: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export const companyService = {
  async list(): Promise<Company[]> {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("company_name");
    if (error) throw error;
    return (data ?? []) as Company[];
  },
  async create(c: Omit<Company, "id" | "created_at">) {
    const { data, error } = await supabase.from("companies").insert(c).select().single();
    if (error) throw error;
    return data as Company;
  },
  async update(id: string, c: Partial<Company>) {
    const { data, error } = await supabase
      .from("companies")
      .update(c)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Company;
  },
  async remove(id: string) {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) throw error;
  },
};

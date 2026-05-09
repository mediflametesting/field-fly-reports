import { supabase } from "@/supabase/supabaseClient";

export interface VisitLog {
  id: string;
  user_id: string;
  outlet_name: string;
  visit_date: string;
  status: "productive" | "non-productive";
  remarks: string | null;
}

export const visitLogService = {
  async list(userId?: string): Promise<VisitLog[]> {
    let q = supabase.from("visits_log").select("*").order("visit_date", { ascending: false });
    if (userId) q = q.eq("user_id", userId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as VisitLog[];
  },
  async create(v: Omit<VisitLog, "id">) {
    const { data, error } = await supabase.from("visits_log").insert(v).select().single();
    if (error) throw error;
    return data as VisitLog;
  },
};

import { supabase } from "@/supabase/supabaseClient";

export interface DailyReport {
  id: string;
  user_id: string;
  report_date: string;
  visits_count: number;
  new_outlets: number;
  orders_value: number;
  collections: number;
  notes: string | null;
  created_at: string;
}

export const dailyReportService = {
  async list(userId?: string): Promise<DailyReport[]> {
    let q = supabase.from("daily_reports").select("*").order("report_date", { ascending: false });
    if (userId) q = q.eq("user_id", userId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as DailyReport[];
  },
  async create(r: Omit<DailyReport, "id" | "created_at">) {
    const { data, error } = await supabase.from("daily_reports").insert(r).select().single();
    if (error) throw error;
    return data as DailyReport;
  },
};

import { supabase } from "@/supabase/supabaseClient";

export interface VisitReport {
  id: string;
  user_id: string;
  company_id: string | null;
  customer_id: string | null;
  visit_date: string;
  visit_mode: string | null;
  approx_order_value: number;
  collection_amount: number;
  collection_mode: string | null;
  collection_details: string | null;
  party_feedback: string | null;
  next_followup_date: string | null;
  status: "draft" | "submitted";
  created_at: string;
}

export const reportService = {
  async listForUser(userId: string): Promise<VisitReport[]> {
    const { data, error } = await supabase
      .from("visit_reports")
      .select("*")
      .eq("user_id", userId)
      .order("visit_date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as VisitReport[];
  },
  async listAll(): Promise<VisitReport[]> {
    const { data, error } = await supabase
      .from("visit_reports")
      .select("*")
      .order("visit_date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as VisitReport[];
  },
  async create(r: Omit<VisitReport, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("visit_reports")
      .insert(r)
      .select()
      .single();
    if (error) throw error;
    return data as VisitReport;
  },
  async uploadAttachment(reportId: string, file: File) {
    const path = `${reportId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("attachments")
      .upload(path, file);
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("attachments").getPublicUrl(path);
    const { data, error } = await supabase
      .from("attachments")
      .insert({ visit_report_id: reportId, file_url: pub.publicUrl, file_name: file.name })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

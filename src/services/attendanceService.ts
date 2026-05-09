import { supabase } from "@/supabase/supabaseClient";

export interface Attendance {
  id: string;
  user_id: string;
  att_date: string;
  status: "present" | "absent" | "leave";
  check_in: string | null;
}

export const attendanceService = {
  async list(userId?: string): Promise<Attendance[]> {
    let q = supabase.from("attendance").select("*").order("att_date", { ascending: false });
    if (userId) q = q.eq("user_id", userId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Attendance[];
  },
  async checkIn(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const checkIn = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const { data, error } = await supabase
      .from("attendance")
      .upsert({ user_id: userId, att_date: today, status: "present", check_in: checkIn }, { onConflict: "user_id,att_date" })
      .select()
      .single();
    if (error) throw error;
    return data as Attendance;
  },
};

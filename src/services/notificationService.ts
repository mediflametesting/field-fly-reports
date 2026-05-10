import { supabase } from "@/supabase/supabaseClient";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: "reminder" | "alert" | "info";
  read: boolean;
  created_at: string;
}

export const notificationService = {
  async list(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Notification[];
  },
  async create(n: Omit<Notification, "id" | "created_at" | "read"> & { read?: boolean }) {
    const { data, error } = await supabase.from("notifications").insert(n).select().single();
    if (error) throw error;
    return data as Notification;
  },
  async setRead(id: string, read: boolean) {
    const { error } = await supabase.from("notifications").update({ read }).eq("id", id);
    if (error) throw error;
  },
  async markAllRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw error;
  },
};

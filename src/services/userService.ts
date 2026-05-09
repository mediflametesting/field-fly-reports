import { supabase } from "@/supabase/supabaseClient";
import type { Role } from "@/services/authService";

export interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  region: string | null;
  status: "active" | "inactive";
  manager_id: string | null;
  created_at: string;
}

export const userService = {
  async list(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, full_name, region, status, manager_id, created_at, roles!inner(role_name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      username: r.username,
      full_name: r.full_name,
      region: r.region,
      status: r.status,
      manager_id: r.manager_id,
      created_at: r.created_at,
      role: r.roles.role_name as Role,
    }));
  },
  async listExecutives(): Promise<AppUser[]> {
    const all = await this.list();
    return all.filter((u) => u.role === "executive");
  },
  async setStatus(id: string, status: "active" | "inactive") {
    const { error } = await supabase.rpc("set_user_status", { p_user_id: id, p_status: status });
    if (error) throw error;
  },
};

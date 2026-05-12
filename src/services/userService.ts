import { supabase } from "@/supabase/supabaseClient";
import { normalizeRole, type Role } from "@/services/authService";

export interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  region: string | null;
  status: "active" | "inactive";
  manager_id?: string | null;
  created_at: string;
}

function normalizeStatus(v: unknown): "active" | "inactive" {
  if (typeof v === "boolean") return v ? "active" : "inactive";
  const s = String(v ?? "").toLowerCase();
  return s === "inactive" || s === "false" ? "inactive" : "active";
}

export const userService = {
  async list(): Promise<AppUser[]> {
    const [{ data, error }, { data: roles, error: rolesError }] = await Promise.all([
      supabase
        .from("users")
        .select("id, username, full_name, region, status, role_id, manager_id, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("roles").select("id, role_name"),
    ]);
    if (error) { console.error("[userService.list users]", error); throw new Error(error.message); }
    if (rolesError) { console.error("[userService.list roles]", rolesError); }
    const roleById = new Map<string, string>((roles ?? []).map((r: any) => [String(r.id), r.role_name]));
    return (data ?? []).map((r: any) => ({
      id: r.id,
      username: r.username,
      full_name: r.full_name,
      region: r.region,
      status: normalizeStatus(r.status),
      manager_id: r.manager_id ?? null,
      created_at: r.created_at,
      role: normalizeRole(roleById.get(String(r.role_id))),
    }));
  },
  async listExecutives(): Promise<AppUser[]> {
    const all = await this.list();
    return all.filter((u) => u.role === "executive");
  },
  async setStatus(id: string, status: "active" | "inactive") {
    // Try RPC first; fall back to direct update (after schema_fix.sql, RLS allows it).
    const rpc = await supabase.rpc("set_user_status", { p_user_id: id, p_status: status });
    if (!rpc.error) return;
    console.warn("[set_user_status RPC failed, falling back]", rpc.error);
    const { error } = await supabase.from("users").update({ status }).eq("id", id);
    if (error) { console.error("[userService.setStatus]", error); throw new Error(error.message); }
  },
  async updateProfile(id: string, patch: { full_name?: string; region?: string | null }) {
    const { error } = await supabase.from("users").update(patch).eq("id", id);
    if (error) { console.error("[userService.updateProfile]", error); throw new Error(error.message); }
  },
};

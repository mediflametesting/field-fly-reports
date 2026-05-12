import { supabase } from "@/supabase/supabaseClient";
import { normalizeRole, type Role } from "@/services/authService";

export interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  region: string | null;
  status: "active" | "inactive";
  created_at: string;
}

function statusFromDb(v: unknown): "active" | "inactive" {
  if (typeof v === "boolean") return v ? "active" : "inactive";
  const s = String(v ?? "").toLowerCase();
  return s === "false" || s === "inactive" ? "inactive" : "active";
}
function statusToDb(s: "active" | "inactive"): boolean {
  return s === "active";
}

export const userService = {
  async list(): Promise<AppUser[]> {
    const [{ data, error }, { data: roles, error: rolesError }] = await Promise.all([
      supabase
        .from("users")
        .select("id, username, full_name, region, status, role_id, created_at")
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
      status: statusFromDb(r.status),
      created_at: r.created_at,
      role: normalizeRole(roleById.get(String(r.role_id))),
    }));
  },
  async listExecutives(): Promise<AppUser[]> {
    const all = await this.list();
    return all.filter((u) => u.role === "executive");
  },
  async setStatus(id: string, status: "active" | "inactive") {
    const { error } = await supabase.from("users").update({ status: statusToDb(status) }).eq("id", id);
    if (error) { console.error("[userService.setStatus]", error); throw new Error(error.message); }
  },
  async updateProfile(id: string, patch: { full_name?: string; region?: string | null }) {
    const { error } = await supabase.from("users").update(patch).eq("id", id);
    if (error) { console.error("[userService.updateProfile]", error); throw new Error(error.message); }
  },
};

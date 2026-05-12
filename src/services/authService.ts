import { supabase } from "@/supabase/supabaseClient";

export type Role = "admin" | "manager" | "hr" | "executive";

export interface SessionUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  region?: string | null;
  status: string;
}

export function normalizeRole(value: unknown): Role {
  const role = String(value ?? "").trim().toLowerCase();
  if (["admin", "manager", "hr", "executive"].includes(role)) return role as Role;
  return "executive";
}

export const authService = {
  async login(username: string, password: string): Promise<SessionUser> {
    const { data, error } = await supabase.rpc("verify_login", {
      p_username: username,
      p_password: password,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : null;
    if (!row) throw new Error("Invalid username or password");
    return {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: normalizeRole(row.role ?? row.role_name),
      region: row.region,
      status: typeof row.status === "boolean" ? (row.status ? "active" : "inactive") : (row.status ?? "active"),
    };
  },

  async createUser(input: {
    username: string;
    password: string;
    fullName: string;
    role: Role;
    region?: string | null;
  }): Promise<string> {
    const { data, error } = await supabase.rpc("create_user", {
      p_username: input.username,
      p_password: input.password,
      p_full_name: input.fullName,
      p_role: input.role,
      p_region: input.region ?? null,
    });
    if (error) throw new Error(error.message);
    return data as string;
  },
};

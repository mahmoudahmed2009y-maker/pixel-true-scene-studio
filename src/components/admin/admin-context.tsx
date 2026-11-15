import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/releaf/admin";

export interface AdminState {
  user: User;
  roles: AppRole[];
}

export const AdminCtx = createContext<AdminState | null>(null);

export function useAdmin() {
  const v = useContext(AdminCtx);
  if (!v) throw new Error("useAdmin must be used inside the admin layout");
  return v;
}

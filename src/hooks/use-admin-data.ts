import { useState } from "react";
import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyDbError, mergeUsersWithRoles } from "@/lib/releaf/admin";

/** Raw factory rows for the admin tables (the dashboard uses the mapped `factoriesQuery`). */
export const adminFactoriesQuery = queryOptions({
  queryKey: ["releaf", "admin", "factories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("factories").select("*").order("sort_order").order("name");
    if (error) throw error;
    return data;
  },
});

/** Every signed-up user with their roles (admins only — the database hides other people's rows otherwise). */
export const adminUsersQuery = queryOptions({
  queryKey: ["releaf", "admin", "users"],
  queryFn: async () => {
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("id, email, display_name, created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (p.error) throw p.error;
    if (r.error) throw r.error;
    return mergeUsersWithRoles(p.data, r.data);
  },
});

type Result = { error: { code?: string; message: string } | null; data?: unknown };

/** Runs one save/delete, shows a toast, and refreshes all workspace data so the dashboard updates too. */
export function useAdminAction() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function run(action: () => PromiseLike<Result>, success: string) {
    setBusy(true);
    try {
      const { error, data } = await action();
      if (error) {
        toast.error(friendlyDbError(error));
        return false;
      }
      // Updates/deletes blocked by permissions return no rows instead of an error.
      if (Array.isArray(data) && data.length === 0) {
        toast.error("Nothing was changed — you may not have permission.");
        return false;
      }
      toast.success(success);
      await queryClient.invalidateQueries({ queryKey: ["releaf"] });
      return true;
    } finally {
      setBusy(false);
    }
  }
  return { run, busy };
}

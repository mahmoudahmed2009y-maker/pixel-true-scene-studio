import { useEffect, useState } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { backendConfigured } from "@/lib/backend";
import { rowToFactory, rowToLimits, rowToSample, type AppRole } from "@/lib/releaf/admin";

/** True when a user is signed in; workspace tables are readable by signed-in users only. */
async function hasSession() {
  if (!backendConfigured) return false;
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

/** Shared workspace data managed from the admin panel (signed-in users only; signed-out visitors see built-in demo data). */
export const factoriesQuery = queryOptions({
  queryKey: ["releaf", "factories"],
  queryFn: async () => {
    if (!(await hasSession())) return [];
    const { data, error } = await supabase.from("factories").select("*").order("sort_order").order("name");
    if (error) throw error;
    return data.map(rowToFactory);
  },
  staleTime: 30_000,
});

export const samplesQuery = queryOptions({
  queryKey: ["releaf", "samples"],
  queryFn: async () => {
    if (!(await hasSession())) return null;
    const { data, error } = await supabase.from("water_samples").select("*").order("sort_order").order("collected_at");
    if (error) throw error;
    return data;
  },
  staleTime: 30_000,
});

export const limitsQuery = queryOptions({
  queryKey: ["releaf", "limits"],
  queryFn: async () => {
    if (!(await hasSession())) return null;
    const { data, error } = await supabase.from("risk_limits").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data ? rowToLimits(data) : null;
  },
  staleTime: 30_000,
});

export function useSamples() {
  const q = useQuery(samplesQuery);
  return { ...q, samples: q.data?.map(rowToSample) };
}

/** Current session for showing sign-in/sign-out controls (not an access check). */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!backendConfigured) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, user: session?.user ?? null, ready };
}

export function myRolesQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["releaf", "my-roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      return data.map((r) => r.role as AppRole);
    },
  });
}

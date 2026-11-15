import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { DEFAULT_BRAND, parseBrand, type Brand } from "./brand";

/** Public read of the site name + logo for every page (falls back to RELEAF if the backend is unreachable). */
export const getBrand = createServerFn({ method: "GET" }).handler(async (): Promise<Brand> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return DEFAULT_BRAND;
  try {
    const client = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data, error } = await client.from("site_settings").select("site_name, logo_data_url").eq("id", 1).maybeSingle();
    if (error) return DEFAULT_BRAND;
    return parseBrand(data);
  } catch {
    return DEFAULT_BRAND;
  }
});

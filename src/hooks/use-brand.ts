import { getRouteApi } from "@tanstack/react-router";
import { DEFAULT_BRAND, type Brand } from "@/lib/releaf/brand";

const rootApi = getRouteApi("__root__");

/** Site name + logo loaded once by the root route; admins change them in Admin → Branding. */
export function useBrand(): Brand {
  return (rootApi.useLoaderData() as Brand | undefined) ?? DEFAULT_BRAND;
}

import { brandText, DEFAULT_BRAND_NAME, parseBrand } from "./brand";

type HeadMatch = { routeId: string; loaderData?: unknown };
type MetaTag = Record<string, string | undefined>;

/** The admin-chosen site name, read from the root route's loader inside any head(). */
export function brandName(matches: readonly HeadMatch[]) {
  const root = matches.find((m) => m.routeId === "__root__");
  return root?.loaderData ? parseBrand(root.loaderData).name : DEFAULT_BRAND_NAME;
}

/** Replaces "RELEAF" in every title/content of a head() block with the current site name. */
export function withBrand<T extends { meta?: MetaTag[] }>(matches: readonly HeadMatch[], head: T): T {
  const name = brandName(matches);
  return {
    ...head,
    meta: head.meta?.map((m) =>
      Object.fromEntries(Object.entries(m).map(([k, v]) => [k, typeof v === "string" && (k === "title" || k === "content") ? brandText(v, name) : v])),
    ),
  } as T;
}

/** Builds a unique head() block for a page, suffixed with the current site name. */
export function pageMeta(matches: readonly HeadMatch[], title: string, description: string) {
  return withBrand(matches, {
    meta: [
      { title: `${title} — RELEAF` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — RELEAF` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ] as MetaTag[],
  });
}

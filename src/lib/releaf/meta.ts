/** Builds a unique head() block for a RELEAF page. */
export function pageMeta(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — RELEAF` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — RELEAF` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

/** Builds a unique head() block for a RELIEF page. */
export function pageMeta(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — RELIEF` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — RELIEF` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

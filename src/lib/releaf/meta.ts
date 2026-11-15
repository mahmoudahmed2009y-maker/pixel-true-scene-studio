/** Builds a unique head() block for a ReLeaf page. */
export function pageMeta(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — ReLeaf` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — ReLeaf` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

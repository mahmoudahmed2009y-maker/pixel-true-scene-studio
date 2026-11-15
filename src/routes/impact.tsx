import { createFileRoute } from "@tanstack/react-router";
import { useBrand } from "@/hooks/use-brand";
import { withBrand } from "@/lib/releaf/meta";
import { MarketingLayout } from "@/components/site/MarketingLayout";
import { CtaSection, ImpactSection, PageHero } from "@/components/site/sections";

export const Route = createFileRoute("/impact")({
  head: ({ matches }) => withBrand(matches, {
    meta: [
      { title: "Impact — RELEAF" },
      { name: "description", content: "Illustrative freshwater savings, trees supported and CO2 impact from industrial water reuse with RELEAF." },
      { property: "og:title", content: "Impact — RELEAF" },
      { property: "og:description", content: "Illustrative freshwater savings, trees supported and CO2 impact from industrial water reuse with RELEAF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { name: siteName } = useBrand();
  return (
    <MarketingLayout>
      <PageHero eyebrow="Impact" title="Freshwater saved. Trees supported. Cities greener." body={`${siteName} tracks the environmental return of every reused litre. Figures shown here are illustrative examples for demonstration.`} />
      <ImpactSection />
      <CtaSection />
    </MarketingLayout>
  );
}

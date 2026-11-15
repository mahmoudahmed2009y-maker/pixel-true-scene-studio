import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/site/MarketingLayout";
import { CtaSection, ImpactSection, PageHero } from "@/components/site/sections";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "Impact — RELIEF" },
      { name: "description", content: "Illustrative freshwater savings, trees supported and CO2 impact from industrial water reuse with RELIEF." },
      { property: "og:title", content: "Impact — RELIEF" },
      { property: "og:description", content: "Illustrative freshwater savings, trees supported and CO2 impact from industrial water reuse with RELIEF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <MarketingLayout>
      <PageHero eyebrow="Impact" title="Freshwater saved. Trees supported. Cities greener." body="RELIEF tracks the environmental return of every reused litre. Figures shown here are illustrative examples for demonstration." />
      <ImpactSection />
      <CtaSection />
    </MarketingLayout>
  );
}

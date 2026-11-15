import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/site/MarketingLayout";
import { CtaSection, FeaturesSection, PageHero, ProblemSection } from "@/components/site/sections";

export const Route = createFileRoute("/solutions")({
  head: () => ({
    meta: [
      { title: "Solutions — ReLeaf" },
      { name: "description", content: "Monitoring, explainable risk scoring, Safety Gate, water matching and plant matching for industrial wastewater reuse." },
      { property: "og:title", content: "Solutions — ReLeaf" },
      { property: "og:description", content: "Monitoring, explainable risk scoring, Safety Gate, water matching and plant matching for industrial wastewater reuse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <MarketingLayout>
      <PageHero eyebrow="Solutions" title="Intelligence for every stage of industrial water reuse." body="Built for factories, environmental engineers, treatment operators and sustainability teams who need to know what their water can safely become." />
      <FeaturesSection />
      <ProblemSection />
      <CtaSection />
    </MarketingLayout>
  );
}

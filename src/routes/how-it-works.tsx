import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/site/MarketingLayout";
import { CtaSection, HowItWorksSection, PageHero, SolutionSection } from "@/components/site/sections";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — RELEAF" },
      { name: "description", content: "From water sensors to environmental impact: the seven steps RELEAF uses to score risk and gate unsafe water before reuse." },
      { property: "og:title", content: "How It Works — RELEAF" },
      { property: "og:description", content: "From water sensors to environmental impact: the seven steps RELEAF uses to score risk and gate unsafe water before reuse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <MarketingLayout>
      <PageHero eyebrow="How it works" title="From sensor reading to safe, matched reuse." body="Every sample passes the same path: measure, analyze, score, gate, match and track. Unsafe water never reaches a recommendation." />
      <HowItWorksSection />
      <SolutionSection />
      <CtaSection />
    </MarketingLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/site/MarketingLayout";
import {
  CtaSection,
  FeaturesSection,
  Hero,
  HowItWorksSection,
  ImpactSection,
  ProblemSection,
  SolutionSection,
} from "@/components/site/sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RELEAF — Turning Factory Wastewater into Green Cities" },
      {
        name: "description",
        content:
          "RELEAF analyzes industrial wastewater, scores contamination risk, gates unsafe water and matches treated water to reuse and drought-tolerant trees.",
      },
      { property: "og:title", content: "RELEAF — Turning Factory Wastewater into Green Cities" },
      {
        property: "og:description",
        content: "AI-assisted wastewater intelligence for safer industrial water reuse and greener cities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <MarketingLayout>
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ImpactSection />
      <CtaSection />
    </MarketingLayout>
  );
}

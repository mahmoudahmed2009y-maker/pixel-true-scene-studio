import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/releaf/Logo";
import { pageMeta } from "@/lib/releaf/meta";

const SIM_SRC = "/simulation/relief-3d.html";

export const Route = createFileRoute("/simulation")({
  head: () =>
    pageMeta(
      "3D Plant Simulation",
      "Explore a simulated 3D industrial wastewater treatment plant: six stages, live-style demo readings and a filter-clogging scenario.",
    ),
  component: SimulationPage,
});

function SimulationPage() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
        <Logo />
        <span className="hidden text-sm text-muted-foreground sm:inline">3D Plant Simulation · simulated data</span>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <a href={SIM_SRC} target="_blank" rel="noreferrer">
              <Maximize2 className="size-4" /> Full screen
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">
              <ArrowLeft className="size-4" /> Dashboard
            </Link>
          </Button>
        </div>
      </header>
      <iframe
        src={SIM_SRC}
        title="RELEAF 3D wastewater treatment plant simulation"
        className="w-full flex-1 border-0"
      />
    </div>
  );
}

import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Box,
  BarChart3,
  Bot,
  Cpu,
  Droplets,
  FileText,
  Gauge,
  LayoutGrid,
  Menu,
  PlayCircle,
  Radio,
  Settings,
  ShieldCheck,
  TreePine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DataBadge } from "@/components/releaf/DataBadge";
import { Logo } from "@/components/releaf/Logo";
import { DATE_RANGES, type DateRange } from "@/lib/releaf/data";
import { cn } from "@/lib/utils";
import { useReleaf } from "./releaf-context";

export const DASH_NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid },
  { to: "/simulation", label: "3D Plant Simulation", icon: Box },
  { to: "/dashboard/monitoring", label: "Water Monitoring", icon: Activity },
  { to: "/dashboard/iot-monitoring", label: "IoT Monitoring", icon: Cpu },
  { to: "/dashboard/risk", label: "Risk Assessment", icon: Gauge },
  { to: "/dashboard/safety-gate", label: "Safety Gate", icon: ShieldCheck },
  { to: "/dashboard/water-matching", label: "Water Matching", icon: Droplets },
  { to: "/dashboard/plants", label: "Plant Matcher", icon: TreePine },
  { to: "/dashboard/impact", label: "Impact Dashboard", icon: BarChart3 },
  { to: "/dashboard/assistant", label: "AI Assistant", icon: Bot },
  { to: "/dashboard/reports", label: "Reports", icon: FileText },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo tone="light" />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {DASH_NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            activeOptions={{ exact: n.to === "/dashboard" }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground data-[status=active]:font-medium"
          >
            <n.icon className="size-4" />
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-sidebar-accent-foreground">
          <Radio className="size-3.5 text-sidebar-primary" /> Simulation mode
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-sidebar-foreground">
          No physical sensors or laboratory systems are connected. Readings are simulated or Wokwi demo values.
        </p>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { factoryId, setFactoryId, range, setRange, factories } = useReleaf();
  const current = DASH_NAV.find((n) => n.to === pathname.replace(/\/$/, "")) ?? DASH_NAV[0];

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-sidebar lg:block">
        <SidebarContent />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-none bg-sidebar p-0">
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-8">
            <button className="grid size-9 place-items-center rounded-lg border bg-card lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu className="size-4" />
            </button>
            <div className="mr-auto">
              <div className="text-xs text-muted-foreground">Workspace</div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <current.icon className="size-4 text-emerald" />
                {current.label}
              </div>
            </div>
            <Select value={factoryId} onValueChange={setFactoryId}>
              <SelectTrigger className="h-9 w-[210px] bg-card" aria-label="Factory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} <span className="text-muted-foreground">· {f.location}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
              <SelectTrigger className="h-9 w-[140px] bg-card" aria-label="Date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DataBadge className="hidden md:inline-flex" />
            <Button variant="hero" size="sm" asChild className="h-9">
              <Link to="/demo"><PlayCircle /> Run demo</Link>
            </Button>
          </div>
        </header>
        <main key={pathname} className={cn("mx-auto max-w-[1400px] animate-fade-up px-4 py-8 md:px-8")}>{children}</main>
      </div>
    </div>
  );
}

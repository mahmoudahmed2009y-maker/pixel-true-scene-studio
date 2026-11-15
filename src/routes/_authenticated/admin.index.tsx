import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Droplets, Factory, Gauge, Palette, Users } from "lucide-react";
import { useBrand } from "@/hooks/use-brand";
import { useAdmin } from "@/components/admin/admin-context";
import { KpiCard, PageHeader } from "@/components/releaf/Cards";
import { adminFactoriesQuery, adminUsersQuery } from "@/hooks/use-admin-data";
import { limitsQuery, samplesQuery } from "@/hooks/use-releaf-data";
import { can } from "@/lib/releaf/admin";
import { assessRisk, evaluateSafetyGate, LIMITS } from "@/lib/releaf/risk";
import { rowToSample } from "@/lib/releaf/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

const AREAS = [
  { to: "/admin/factories", area: "factories", icon: Factory, title: "Factories", text: "Add, rename or remove factories in the dashboard picker." },
  { to: "/admin/samples", area: "samples", icon: Droplets, title: "Water samples", text: "Enter sensor and lab readings that feed every analysis page." },
  { to: "/admin/limits", area: "limits", icon: Gauge, title: "Risk limits", text: "Tune the reference limits behind risk scores and the Safety Gate." },
  { to: "/admin/users", area: "users", icon: Users, title: "Users & roles", text: "Make people admins or operators." },
  { to: "/admin/branding", area: "branding", icon: Palette, title: "Site name & logo", text: "Rename the website and upload your own logo." },
] as const;

function AdminOverview() {
  const { roles } = useAdmin();
  const brand = useBrand();
  const factories = useQuery(adminFactoriesQuery).data;
  const samples = useQuery(samplesQuery).data;
  const limits = useQuery(limitsQuery).data ?? LIMITS;
  const users = useQuery({ ...adminUsersQuery, enabled: can(roles, "users") }).data;
  const eligible = samples?.filter((r) => evaluateSafetyGate(assessRisk(rowToSample(r), limits)).status === "eligible").length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Admin panel" description={`Manage the ${brand.name} workspace. Your role: ${roles.join(", ")}.`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Factory} label="Factories" value={factories?.length ?? "—"} />
        <KpiCard icon={Droplets} label="Water samples" value={samples?.length ?? "—"} />
        <KpiCard icon={Gauge} label="Passing Safety Gate" value={eligible ?? "—"} hint="Illustrative scoring" />
        <KpiCard icon={Users} label="Users" value={users?.length ?? "—"} hint={users ? `${users.filter((u) => u.roles.includes("admin")).length} admin(s)` : ""} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {AREAS.filter((a) => can(roles, a.area)).map((a) => (
          <Link key={a.to} to={a.to} className="surface-card group flex items-start gap-4 p-5 transition-shadow hover:shadow-elevated">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-mint text-forest"><a.icon className="size-5" /></span>
            <span className="flex-1">
              <span className="block font-semibold">{a.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{a.text}</span>
            </span>
            <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}

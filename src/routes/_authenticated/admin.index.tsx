import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/releaf/Cards";
import { useAdmin } from "@/components/admin/admin-context";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { roles } = useAdmin();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Admin panel" description={`Signed in with role: ${roles.join(", ")}.`} />
      <div className="surface-card p-6 text-sm text-muted-foreground">
        Sign-in, roles and the saved workspace data are set up. The editing screens for factories, samples, limits and users are not built yet.
      </div>
    </div>
  );
}

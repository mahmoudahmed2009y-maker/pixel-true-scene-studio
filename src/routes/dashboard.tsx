import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReleafProvider } from "@/components/dashboard/releaf-context";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <ReleafProvider>
      <DashboardShell>
        <Outlet />
      </DashboardShell>
    </ReleafProvider>
  );
}

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldOff } from "lucide-react";
import { AdminCtx } from "@/components/admin/admin-context";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { myRolesQuery } from "@/hooks/use-releaf-data";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/releaf/meta";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ ...pageMeta("Admin panel", "Manage RELIEF factories, water samples, risk limits and team roles."), meta: [...pageMeta("Admin panel", "Manage RELIEF factories, water samples, risk limits and team roles.").meta, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const rolesQ = useQuery(myRolesQuery(user.id));

  if (rolesQ.isPending) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const roles = rolesQ.data ?? [];
  if (roles.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="surface-card max-w-md p-8 text-center">
          <ShieldOff className="mx-auto size-8 text-muted-foreground" />
          <h1 className="mt-3 font-display text-3xl">No admin access yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You're signed in as {user.email}, but you don't have a role. Ask an admin to make you an admin or operator.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="outline" asChild><Link to="/dashboard">Open dashboard</Link></Button>
            <Button variant="ghost" onClick={() => supabase.auth.signOut().then(() => window.location.assign("/auth"))}>Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminCtx.Provider value={{ user, roles }}>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AdminCtx.Provider>
  );
}

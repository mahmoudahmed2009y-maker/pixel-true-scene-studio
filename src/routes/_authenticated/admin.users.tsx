import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QueryState } from "@/components/admin/ConfirmDelete";
import { NoAccess } from "@/components/admin/Field";
import { useAdmin } from "@/components/admin/admin-context";
import { PageHeader } from "@/components/releaf/Cards";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminUsersQuery, useAdminAction } from "@/hooks/use-admin-data";
import { supabase } from "@/integrations/supabase/client";
import { can, canChangeRole, type AppRole } from "@/lib/releaf/admin";
import { pageMeta } from "@/lib/releaf/meta";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: ({ matches }) => pageMeta(matches, "Users & roles · Admin", "Choose who can manage the RELEAF workspace."),
  component: UsersAdmin,
});

const ROLES: { role: AppRole; label: string }[] = [
  { role: "admin", label: "Admin" },
  { role: "operator", label: "Operator" },
];

function UsersAdmin() {
  const { roles, user: me } = useAdmin();
  const q = useQuery({ ...adminUsersQuery, enabled: can(roles, "users") });
  const { run, busy } = useAdminAction();

  if (!can(roles, "users")) return <NoAccess what="users" />;

  function toggle(userId: string, role: AppRole, grant: boolean) {
    void run(
      () =>
        grant
          ? supabase.from("user_roles").insert({ user_id: userId, role }).select("id")
          : supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role).select("id"),
      grant ? `${role === "admin" ? "Admin" : "Operator"} role given` : "Role removed",
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Users & roles"
        description="Admins manage everything. Operators can only add and edit water samples. New people appear here after they create an account."
      />
      <div className="surface-card overflow-hidden">
        <QueryState isPending={q.isPending} error={q.error} />
        {q.data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Joined</TableHead>
                {ROLES.map((r) => <TableHead key={r.role} className="text-center">{r.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.displayName || u.email || "Unnamed user"}{u.id === me.id && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}</div>
                    {u.displayName && <div className="text-xs text-muted-foreground">{u.email}</div>}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{u.createdAt.slice(0, 10)}</TableCell>
                  {ROLES.map(({ role, label }) => {
                    const has = u.roles.includes(role);
                    const allowed = canChangeRole(me.id, u.id, role, !has);
                    return (
                      <TableCell key={role} className="text-center">
                        <Switch
                          checked={has}
                          disabled={busy || !allowed}
                          aria-label={`${label} role for ${u.email ?? u.id}`}
                          title={allowed ? undefined : "You can't remove your own admin role"}
                          onCheckedChange={(v) => toggle(u.id, role, v)}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

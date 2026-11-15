import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { ConfirmDelete, QueryState } from "@/components/admin/ConfirmDelete";
import { Field, NoAccess } from "@/components/admin/Field";
import { useAdmin } from "@/components/admin/admin-context";
import { PageHeader } from "@/components/releaf/Cards";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminFactoriesQuery, useAdminAction } from "@/hooks/use-admin-data";
import { samplesQuery } from "@/hooks/use-releaf-data";
import { supabase } from "@/integrations/supabase/client";
import { can, factoryRowToForm, factorySchema, fieldErrors, type FactoryRow } from "@/lib/releaf/admin";
import { pageMeta } from "@/lib/releaf/meta";

export const Route = createFileRoute("/_authenticated/admin/factories")({
  head: ({ matches }) => pageMeta(matches, "Factories · Admin", "Add, edit and remove the factories in the RELEAF workspace."),
  component: FactoriesAdmin,
});

const EMPTY = { id: "", name: "", location: "", sector: "", daily_capacity_m3: "1000" };
type Form = typeof EMPTY;

function FactoriesAdmin() {
  const { roles } = useAdmin();
  const q = useQuery(adminFactoriesQuery);
  const samples = useQuery(samplesQuery).data ?? [];
  const { run } = useAdminAction();
  const [editing, setEditing] = useState<{ original: FactoryRow | null; form: Form } | null>(null);

  if (!can(roles, "factories")) return <NoAccess what="factories" />;
  const rows = q.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Factories"
        description="Factories appear in the dashboard's factory picker. Deleting a factory also deletes its water samples."
        actions={<Button variant="forest" onClick={() => setEditing({ original: null, form: EMPTY })}><Plus /> Add factory</Button>}
      />
      <div className="surface-card overflow-hidden">
        <QueryState isPending={q.isPending} error={q.error} />
        {q.data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factory</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Capacity (m³/day)</TableHead>
                <TableHead className="text-right">Samples</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No factories yet — add the first one.</TableCell></TableRow>
              )}
              {rows.map((f) => {
                const count = samples.filter((s) => s.factory_id === f.id).length;
                return (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="font-medium">{f.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{f.id}</div>
                    </TableCell>
                    <TableCell>{f.location || "—"}</TableCell>
                    <TableCell>{f.sector || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{f.daily_capacity_m3.toLocaleString("en-US")}</TableCell>
                    <TableCell className="text-right tabular-nums">{count}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${f.name}`} onClick={() => setEditing({ original: f, form: factoryRowToForm(f) })}>
                        <Pencil className="size-4" />
                      </Button>
                      <ConfirmDelete
                        label={`Delete ${f.name}`}
                        title={`Delete ${f.name}?`}
                        description={count ? `This also deletes its ${count} water sample${count === 1 ? "" : "s"}. This can't be undone.` : "This can't be undone."}
                        onConfirm={() => run(() => supabase.from("factories").delete().eq("id", f.id).select("id"), "Factory deleted")}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      {editing && (
        <FactoryDialog
          original={editing.original}
          initial={editing.form}
          nextSort={Math.max(0, ...rows.map((r) => r.sort_order)) + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function FactoryDialog({ original, initial, nextSort, onClose }: { original: FactoryRow | null; initial: Form; nextSort: number; onClose: () => void }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { run, busy } = useAdminAction();
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = factorySchema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    const { id: _id, ...rest } = parsed.data;
    const ok = original
      ? await run(() => supabase.from("factories").update(rest).eq("id", original.id).select("id"), "Factory saved")
      : await run(() => supabase.from("factories").insert({ ...parsed.data, sort_order: nextSort }).select("id"), "Factory added");
    if (ok) onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{original ? `Edit ${original.name}` : "Add factory"}</DialogTitle>
          <DialogDescription>Capacity is used for the simulated daily volumes on the dashboard.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field id="f-name" label="Name" value={form.name} onChange={set("name")} error={errors["name"]} className="sm:col-span-2" />
          <Field id="f-id" label="ID" value={form.id} onChange={set("id")} error={errors["id"]} disabled={!!original} hint={original ? "The ID can't change after creation." : "Lowercase, e.g. cairo-paper"} />
          <Field id="f-cap" label="Daily capacity (m³)" inputMode="numeric" value={form.daily_capacity_m3} onChange={set("daily_capacity_m3")} error={errors["daily_capacity_m3"]} />
          <Field id="f-loc" label="Location" value={form.location} onChange={set("location")} error={errors["location"]} />
          <Field id="f-sector" label="Sector" value={form.sector} onChange={set("sector")} error={errors["sector"]} />
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="forest" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

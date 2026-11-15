import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  id,
  label,
  hint,
  error,
  className,
  ...input
}: React.ComponentProps<typeof Input> & { id: string; label: string; hint?: string; error?: string | undefined }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!error} className="bg-card" {...input} />
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function NoAccess({ what }: { what: string }) {
  return (
    <div className="surface-card p-8 text-center">
      <h2 className="font-display text-3xl">Admins only</h2>
      <p className="mt-2 text-sm text-muted-foreground">Only admins can manage {what}. Ask an admin to change your role.</p>
    </div>
  );
}

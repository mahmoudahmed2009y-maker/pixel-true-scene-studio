import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/releaf/Logo";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/releaf/meta";

export const Route = createFileRoute("/reset-password")({
  head: ({ matches }) => pageMeta(matches, "Set a new password", "Choose a new password for your RELEAF account."),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session && isRecovery) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/admin" });
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-8 md:px-12">
      <Logo />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <h1 className="font-display text-5xl">New password</h1>
        {ready ? (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 bg-card" />
            </div>
            <Button type="submit" variant="forest" size="xl" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} Save password
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-muted-foreground">
            Open this page from the reset link in your email. <Link to="/auth" className="text-emerald hover:underline">Back to sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}

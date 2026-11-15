import { useEffect, useState } from "react";
import { useBrand } from "@/hooks/use-brand";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import heroImg from "@/assets/hero-releaf.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/releaf/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { pageMeta } from "@/lib/releaf/meta";

type AuthSearch = { redirect?: string };

/** Only same-site paths are allowed as a post-login destination. */
function safeRedirect(r: unknown) {
  return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => {
    const r = safeRedirect(s["redirect"]);
    return r ? { redirect: r } : {};
  },
  head: ({ matches }) => pageMeta(matches, "Sign in", "Sign in to the RELEAF workspace to manage factories, water samples, risk limits and team roles."),
  component: AuthPage,
});

const GOOGLE_G = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
  </svg>
);

function AuthPage() {
  const { name: siteName } = useBrand();
  const { redirect } = Route.useSearch();
  const destination = redirect ?? "/admin";
  const router = useRouter();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  const go = () => router.history.push(destination);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) go();
    });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`,
            data: { full_name: name.trim() || undefined },
          },
        });
        if (error) throw error;
        if (!data.session) setSent("confirm");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "lovable") {
    if (redirect) sessionStorage.setItem("relief:after-login", redirect);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(result.error.message ?? "Sign-in failed. Please try again.");
  }

  useEffect(() => {
    const stored = safeRedirect(sessionStorage.getItem("relief:after-login"));
    if (stored && !redirect) {
      sessionStorage.removeItem("relief:after-login");
      navigate({ to: "/auth", search: { redirect: stored }, replace: true });
    }
  }, [redirect, navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 md:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center animate-fade-up">
          {sent ? (
            <div className="space-y-4">
              <span className="grid size-12 place-items-center rounded-xl bg-mint text-forest">
                <MailCheck className="size-6" />
              </span>
              <h1 className="font-display text-4xl">Check your email</h1>
              <p className="text-muted-foreground">
                {sent === "confirm"
                  ? `We sent a confirmation link to ${email}. Open it to finish creating your account.`
                  : `If an account exists for ${email}, a password reset link is on its way.`}
              </p>
              <Button variant="outline" onClick={() => { setSent(null); setMode("signin"); }}>Back to sign in</Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-5xl">
                {mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Welcome back"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {mode === "signup"
                  ? "The first account created becomes the workspace admin."
                  : mode === "forgot"
                    ? "Enter your email and we'll send you a reset link."
                    : `Sign in to manage the ${siteName} workspace.`}
              </p>

              {mode !== "forgot" && (
                <div className="mt-6 grid gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-2.5 border-[#747775] bg-[#FFFFFF] text-[#1F1F1F] hover:bg-[#F2F2F2] hover:text-[#1F1F1F]"
                    onClick={() => oauth("google")}
                  >
                    {GOOGLE_G}
                    Continue with Google
                  </Button>
                  <button type="button" className="lovable-auth-button" onClick={() => oauth("lovable")}>
                    Continue with Lovable
                  </button>
                  <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
                  </div>
                </div>
              )}

              <form className={mode === "forgot" ? "mt-6 space-y-4" : "space-y-4"} onSubmit={submit}>
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="h-11 bg-card" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="operator@factory.com" className="h-11 bg-card" />
                </div>
                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === "signin" && (
                        <button type="button" className="text-xs text-emerald hover:underline" onClick={() => setMode("forgot")}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <Input id="password" type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 bg-card" />
                  </div>
                )}
                <Button type="submit" variant="forest" size="xl" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="animate-spin" /> : null}
                  {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
                  {!busy && <ArrowRight />}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>No account yet? <button className="font-medium text-emerald hover:underline" onClick={() => setMode("signup")}>Create one</button></>
                ) : (
                  <>Already have an account? <button className="font-medium text-emerald hover:underline" onClick={() => setMode("signin")}>Sign in</button></>
                )}
              </p>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Just exploring? <Link to="/dashboard" className="text-emerald hover:underline">Open the public dashboard</Link>
              </p>
            </>
          )}
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <img src={heroImg} alt="" width={1600} height={1200} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-forest/30 to-transparent" />
        <div className="absolute inset-x-12 bottom-12 text-on-dark">
          <div className="font-display text-4xl leading-tight">“Make every drop count.”</div>
          <p className="mt-2 text-on-dark-muted">Turning Factory Wastewater into Green Cities.</p>
        </div>
      </div>
    </div>
  );
}

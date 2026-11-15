import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Droplets, Factory, Gauge, LayoutGrid, LogOut, Menu, Palette, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/releaf/Logo";
import { supabase } from "@/integrations/supabase/client";
import { can } from "@/lib/releaf/admin";
import { useAdmin } from "./admin-context";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutGrid, area: null },
  { to: "/admin/factories", label: "Factories", icon: Factory, area: "factories" },
  { to: "/admin/samples", label: "Water samples", icon: Droplets, area: "samples" },
  { to: "/admin/limits", label: "Risk limits", icon: Gauge, area: "limits" },
  { to: "/admin/users", label: "Users & roles", icon: Users, area: "users" },
  { to: "/admin/branding", label: "Site name & logo", icon: Palette, area: "branding" },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, roles } = useAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo tone="light" />
        <div className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sidebar-primary">Admin panel</div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.filter((n) => !n.area || can(roles, n.area)).map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            activeOptions={{ exact: n.to === "/admin" }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:font-medium data-[status=active]:text-sidebar-accent-foreground"
          >
            <n.icon className="size-4" />
            {n.label}
          </Link>
        ))}
        <Link
          to="/dashboard"
          className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-4">
        <div className="truncate text-xs font-medium text-sidebar-accent-foreground">{user.email}</div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {roles.length ? roles.map((r) => <Badge key={r} variant="mint" className="capitalize">{r}</Badge>) : <span className="text-xs text-sidebar-foreground">No role</span>}
        </div>
        <Button variant="onDark" size="sm" className="mt-3 w-full" onClick={signOut}>
          <LogOut /> Sign out
        </Button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-sidebar lg:block">
        <Sidebar />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-none bg-sidebar p-0">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button className="grid size-9 place-items-center rounded-lg border bg-card" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu className="size-4" />
          </button>
          <span className="text-sm font-semibold">Admin panel</span>
        </header>
        <main key={pathname} className="mx-auto max-w-[1200px] animate-fade-up px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}

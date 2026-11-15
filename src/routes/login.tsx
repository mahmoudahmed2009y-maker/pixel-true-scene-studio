import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address kept working: sign-in now lives at /auth.
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/auth", replace: true });
  },
});

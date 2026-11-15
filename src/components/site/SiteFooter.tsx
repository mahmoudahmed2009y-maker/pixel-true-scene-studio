import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/releaf/Logo";

export function SiteFooter() {
  return (
    <footer className="bg-gradient-forest text-on-dark">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:px-8">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm text-on-dark-muted">
            Turning Factory Wastewater into Green Cities. An AI-assisted water intelligence MVP for industrial reuse.
          </p>
        </div>
        <div>
          <div className="eyebrow text-on-dark-muted">Platform</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/how-it-works" className="hover:text-emerald">How It Works</Link></li>
            <li><Link to="/solutions" className="hover:text-emerald">Solutions</Link></li>
            <li><Link to="/impact" className="hover:text-emerald">Impact</Link></li>
            <li><Link to="/demo" className="hover:text-emerald">Interactive Demo</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow text-on-dark-muted">Workspace</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/dashboard" className="hover:text-emerald">Dashboard</Link></li>
            <li><Link to="/dashboard/risk" className="hover:text-emerald">Risk Assessment</Link></li>
            <li><Link to="/dashboard/plants" className="hover:text-emerald">Plant Matcher</Link></li>
            <li><Link to="/dashboard/reports" className="hover:text-emerald">Reports</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow text-on-dark-muted">Contact</div>
          <ul className="mt-4 space-y-2.5 text-sm text-on-dark-muted">
            <li className="flex items-center gap-2"><Mail className="size-4 text-emerald" /> hello@releaf.example</li>
            <li className="flex items-center gap-2"><Phone className="size-4 text-emerald" /> +20 100 000 0000</li>
            <li className="flex items-center gap-2"><MapPin className="size-4 text-emerald" /> Cairo, Egypt</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-on-dark/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-on-dark-muted md:flex-row md:items-center md:justify-between lg:px-8">
          <span>© 2026 RELEAF. MVP demonstration — not a certified water treatment or safety system.</span>
          <span>All dashboard figures are simulated or illustrative.</span>
        </div>
      </div>
    </footer>
  );
}


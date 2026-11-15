import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Droplets,
  Factory,
  FileText,
  FlaskConical,
  Gauge,
  Leaf,
  PlayCircle,
  Radio,
  ShieldCheck,
  Sprout,
  TreePine,
  Waves,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import heroImg from "@/assets/hero-releaf.jpg";
import { Button } from "@/components/ui/button";
import { DataBadge } from "@/components/releaf/DataBadge";
import { IMPACT } from "@/lib/releaf/data";
import { useCountUp } from "@/hooks/use-count-up";

function SectionIntro({ eyebrow, title, body, light = false }: { eyebrow: string; title: string; body?: string; light?: boolean }) {
  return (
    <div className="max-w-2xl">
      <div className={light ? "eyebrow text-emerald" : "eyebrow text-emerald"}>{eyebrow}</div>
      <h2 className={`mt-3 font-display text-4xl leading-[1.05] md:text-5xl ${light ? "text-on-dark" : ""}`}>{title}</h2>
      {body && <p className={`mt-4 text-base md:text-lg ${light ? "text-on-dark-muted" : "text-muted-foreground"}`}>{body}</p>}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-mint">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-28 lg:pt-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald/25 bg-card/70 px-3 py-1 text-xs font-medium text-forest backdrop-blur">
            <span className="size-1.5 rounded-full bg-emerald" />
            Turning Factory Wastewater into Green Cities
          </div>
          <h1 className="mt-6 font-display text-5xl leading-[1.02] tracking-tight md:text-6xl xl:text-7xl">
            Transform Industrial Wastewater into a <em className="text-emerald">Sustainable</em> Future.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            RELEAF uses artificial intelligence to analyze industrial wastewater, assess safety, recommend water reuse
            opportunities, and support greener cities.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/dashboard">
                Explore Dashboard <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="rounded-full bg-card/70">
              <Link to="/how-it-works">Discover How It Works</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald" /> Safety Gate first</span>
            <span className="flex items-center gap-2"><FlaskConical className="size-4 text-emerald" /> Lab-aware risk scoring</span>
            <span className="flex items-center gap-2"><TreePine className="size-4 text-emerald" /> Tree matching</span>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[2rem] shadow-elevated">
            <img src={heroImg} alt="Treated water flowing from an industrial pipe into green leaves and a young tree" width={1600} height={1200} className="aspect-[4/3.4] w-full object-cover" />
          </div>
          <div className="absolute -left-4 top-8 w-52 animate-float rounded-2xl border border-border bg-card/95 p-4 shadow-elevated backdrop-blur md:-left-10">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Risk score</span>
              <span className="rounded-full bg-risk-low-soft px-2 py-0.5 font-medium text-risk-low">Low</span>
            </div>
            <div className="mt-2 font-display text-4xl text-forest">13<span className="text-base text-muted-foreground">/100</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-[13%] rounded-full bg-risk-low" /></div>
          </div>
          <div className="absolute -bottom-6 right-4 w-64 rounded-2xl border border-border bg-card/95 p-4 shadow-elevated backdrop-blur [animation-delay:1.5s] animate-float md:-right-6">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-risk-low text-emerald-foreground"><ShieldCheck className="size-5" /></div>
              <div>
                <div className="text-sm font-semibold">Eligible for Further Evaluation</div>
                <div className="text-xs text-muted-foreground">Sample S-103 · simulated</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProblemSection() {
  const items = [
    { icon: Waves, stat: "≈80%", title: "Released untreated", body: "UN-Water estimates most of the world's wastewater returns to the environment without adequate treatment." },
    { icon: Droplets, stat: "< 1,000 m³", title: "Water scarcity", body: "Egypt's renewable water per person sits below the UN water-scarcity line, while factories draw freshwater daily." },
    { icon: Factory, stat: "1×", title: "Used once, discarded", body: "Industrial water is typically used a single time and discharged — a resource treated as waste." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <SectionIntro
          eyebrow="The problem"
          title="Factories pour out the water cities are running short of."
          body="Industrial wastewater carries acids, dyes, salts and heavy metals. Untreated, it pollutes rivers and soils. Treated without insight, it's still discarded — while green space and freshwater disappear."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map((i) => (
            <div key={i.title} className="surface-card flex flex-col p-6">
              <i.icon className="size-5 text-emerald" />
              <div className="mt-6 font-display text-4xl text-forest">{i.stat}</div>
              <div className="mt-1 text-sm font-semibold">{i.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{i.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SolutionSection() {
  const nodes = [
    { icon: Factory, label: "Factory outflow" },
    { icon: Radio, label: "Water sensors" },
    { icon: Bot, label: "AI analysis" },
    { icon: ShieldCheck, label: "Safety Gate" },
    { icon: Sprout, label: "Matched reuse" },
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-forest text-on-dark">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 lg:grid-cols-2 lg:px-8">
        <SectionIntro
          light
          eyebrow="The RELEAF system"
          title="One intelligent loop from effluent to orchard."
          body="RELEAF reads water quality, scores contamination risk, gates unsafe water, and only then matches what's left to its most valuable use — industrial reuse first, irrigation where it's appropriate."
        />
        <div className="rounded-3xl border border-on-dark/10 bg-on-dark/5 p-6 backdrop-blur md:p-8">
          <div className="space-y-3">
            {nodes.map((n, i) => (
              <div key={n.label} className="flex items-center gap-4">
                <div className="grid size-11 place-items-center rounded-xl bg-emerald/15 text-emerald">
                  <n.icon className="size-5" />
                </div>
                <div className="flex-1 rounded-xl border border-on-dark/10 bg-on-dark/5 px-4 py-3 text-sm">
                  <span className="eyebrow mr-3 text-on-dark-muted">0{i + 1}</span>
                  {n.label}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-risk-high/40 bg-risk-high/10 px-4 py-3 text-sm text-on-dark">
            If risk is high, the loop stops at the Safety Gate and water returns to treatment.
          </div>
        </div>
      </div>
    </section>
  );
}

export const STEPS = [
  { icon: Radio, title: "Water Sensors", body: "pH, turbidity, TDS, temperature and conductivity stream from the treatment line." },
  { icon: Bot, title: "AI Analysis", body: "Readings are normalised, trended and compared against reuse reference limits." },
  { icon: Gauge, title: "Risk Assessment", body: "A 0–100 risk score with an explanation for every contributing factor." },
  { icon: ShieldCheck, title: "Safety Gate", body: "High-risk water is blocked automatically. Missing lab data is flagged." },
  { icon: Droplets, title: "Water Matching", body: "Eligible water is ranked against cooling, wash and irrigation uses." },
  { icon: TreePine, title: "Plant Matching", body: "Drought-tolerant trees matched to salinity, sodium and climate." },
  { icon: Leaf, title: "Environmental Impact", body: "Freshwater saved, trees supported and CO₂ impact tracked over time." },
];

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
      <SectionIntro eyebrow="How it works" title="Seven steps. Safety before every drop." />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className={`surface-card group relative overflow-hidden p-6 transition-all hover:-translate-y-1 hover:shadow-elevated ${i === 3 ? "lg:row-span-1 border-emerald/40" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="grid size-11 place-items-center rounded-xl bg-mint text-forest transition-colors group-hover:bg-emerald group-hover:text-emerald-foreground">
                <s.icon className="size-5" />
              </div>
              <span className="font-display text-3xl text-border">0{i + 1}</span>
            </div>
            <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
        <Link
          to="/demo"
          className="group flex flex-col justify-between rounded-xl bg-gradient-emerald p-6 text-emerald-foreground shadow-glow transition-transform hover:-translate-y-1"
        >
          <PlayCircle className="size-8" />
          <div>
            <div className="text-lg font-semibold">See it in 3 minutes</div>
            <div className="mt-1 flex items-center gap-1 text-sm opacity-90">Run the interactive demo <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></div>
          </div>
        </Link>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const features = [
    { icon: Activity, title: "Live water monitoring", body: "Five core parameters with warning ranges, history and sensor health.", wide: true },
    { icon: Gauge, title: "Explainable risk score", body: "Every point of the score is traced to a parameter and a reason." },
    { icon: ShieldCheck, title: "Safety Gate", body: "Blocks reuse for high-risk water and requires operator sign-off." },
    { icon: Droplets, title: "Water Matching", body: "Ranks five reuse options by suitability, treatment and limitations." },
    { icon: TreePine, title: "Plant Matcher", body: "Compare olive, pomegranate, eucalyptus and sesbania side-by-side." },
    { icon: BarChart3, title: "Impact analytics", body: "Freshwater saved, trees supported and CO₂ impact over time.", wide: true },
    { icon: Bot, title: "Operator assistant", body: "Plain-language answers about readings, risk and restrictions." },
    { icon: FileText, title: "Printable reports", body: "Quality, risk, reuse and impact reports, exportable as PDF." },
    { icon: Radio, title: "ESP32 IoT simulation", body: "A Wokwi ESP32 rig with pH, TDS and turbidity inputs, LCD, LEDs and buzzer — ready for real hardware later.", wide: true },
  ];
  return (
    <section className="bg-mint/50">
      <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <SectionIntro eyebrow="Key features" title="Everything an operator needs to reuse water responsibly." />
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className={`surface-card p-6 ${f.wide ? "lg:col-span-2" : ""}`}>
              <f.icon className="size-5 text-emerald" />
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ value, suffix, label, decimals = 0 }: { value: number; suffix?: string; label: string; decimals?: number }) {
  const v = useCountUp(value, 1400);
  return (
    <div className="border-l border-on-dark/15 pl-5">
      <div className="font-display text-5xl text-on-dark tabular">
        {v.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
        <span className="text-emerald">{suffix}</span>
      </div>
      <div className="mt-1 text-sm text-on-dark-muted">{label}</div>
    </div>
  );
}

export function ImpactSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-forest text-on-dark">
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionIntro light eyebrow="Environmental impact" title="What a single plant could return to its city." />
          <DataBadge kind="illustrative" />
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Stat value={IMPACT.freshwaterSavedLiters / 1_000_000} decimals={1} suffix="M L" label="Freshwater saved (illustrative)" />
          <Stat value={IMPACT.treesSupported} label="Trees supported (illustrative)" />
          <Stat value={IMPACT.co2TonnesPerYear} suffix=" t" label="CO₂ captured / yr (illustrative)" />
          <Stat value={IMPACT.reuseEfficiency} suffix="%" label="Water reuse efficiency (illustrative)" />
        </div>
        <div className="mt-14 h-56 rounded-2xl border border-on-dark/10 bg-on-dark/5 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={IMPACT.monthly}>
              <defs>
                <linearGradient id="imp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--emerald)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--emerald)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="var(--on-dark-muted)" tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--forest-deep)", border: "none", borderRadius: 12, color: "var(--on-dark)" }} />
              <Area type="monotone" dataKey="reused" name="Reused (M L)" stroke="var(--emerald)" strokeWidth={2.5} fill="url(#imp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-emerald px-8 py-16 text-center text-emerald-foreground shadow-glow md:px-16">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
        <div className="relative">
          <h2 className="font-display text-5xl md:text-6xl">Make Every Drop Count.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
            Walk through contamination, treatment, matching and impact in a three-minute guided demo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="forest" size="xl" asChild>
              <Link to="/demo"><PlayCircle /> Run Interactive Demo</Link>
            </Button>
            <Button variant="onDark" size="xl" asChild>
              <Link to="/dashboard">Explore Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-mint">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-20 lg:px-8">
        <div className="eyebrow text-emerald">{eyebrow}</div>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[1.04] md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{body}</p>
      </div>
    </section>
  );
}

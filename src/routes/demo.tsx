import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Droplets, Factory, Pause, Play, RotateCcw, Sprout, TreePine, X } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/releaf/Cards";
import { DataBadge } from "@/components/releaf/DataBadge";
import { Logo } from "@/components/releaf/Logo";
import { RiskGauge } from "@/components/releaf/RiskGauge";
import { SafetyGatePanel } from "@/components/releaf/SafetyGatePanel";
import { DEMO_AFTER_ID, DEMO_BEFORE_ID, getSample, IMPACT } from "@/lib/releaf/data";
import { matchWater } from "@/lib/releaf/matching";
import { pageMeta } from "@/lib/releaf/meta";
import { matchPlants } from "@/lib/releaf/plants";
import { assessRisk, evaluateSafetyGate } from "@/lib/releaf/risk";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo")({
  head: () => pageMeta("Interactive Demo", "A three-minute guided RELEAF demo: contaminated water, treatment, water matching, plant matching and impact."),
  component: Demo,
});

const STEPS = [
  { title: "Contaminated Water", kicker: "Scenario 1" },
  { title: "After Treatment", kicker: "Scenario 2" },
  { title: "Water Matching", kicker: "Scenario 3" },
  { title: "Plant Matching", kicker: "Scenario 4" },
  { title: "Environmental Impact", kicker: "Scenario 5" },
];
const STEP_SECONDS = 34;

const before = getSample(DEMO_BEFORE_ID);
const after = getSample(DEMO_AFTER_ID);

function Readings({ highlight }: { highlight: "before" | "after" }) {
  const rows = [
    { k: "pH", b: before.ph.toFixed(1), a: after.ph.toFixed(1), ref: "6.5–8.5" },
    { k: "Turbidity", b: `${before.turbidity} NTU`, a: `${after.turbidity} NTU`, ref: "≤ 5" },
    { k: "TDS", b: `${before.tds.toLocaleString("en-US")} mg/L`, a: `${after.tds} mg/L`, ref: "≤ 1,000" },
    { k: "Salinity (ECw)", b: `${(before.ec / 1000).toFixed(1)} dS/m`, a: `${(after.ec / 1000).toFixed(2)} dS/m`, ref: "< 3.0" },
    { k: "SAR", b: before.sar.toFixed(1), a: after.sar.toFixed(1), ref: "< 9" },
    { k: "Cd / Pb (lab*)", b: `${before.heavyMetals!.cd} / ${before.heavyMetals!.pb}`, a: `${after.heavyMetals!.cd} / ${after.heavyMetals!.pb}`, ref: "≤ 0.01 / 5.0" },
  ];
  return (
    <div className="surface-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Parameter</th>
            <th className={cn("px-4 py-2.5 font-medium", highlight === "before" && "text-risk-high")}>Raw influent</th>
            <th className={cn("px-4 py-2.5 font-medium transition-opacity", highlight === "after" ? "text-risk-low" : "opacity-30")}>After treatment</th>
            <th className="px-4 py-2.5 font-medium">Reference</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {rows.map((r) => (
            <tr key={r.k} className="border-b last:border-0">
              <td className="px-4 py-2.5 font-medium">{r.k}</td>
              <td className={cn("px-4 py-2.5", highlight === "before" ? "font-semibold text-risk-high" : "text-muted-foreground line-through decoration-risk-high/40")}>{r.b}</td>
              <td className={cn("px-4 py-2.5 transition-opacity duration-700", highlight === "after" ? "font-semibold text-risk-low" : "opacity-20")}>{r.a}</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.ref}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">* Illustrative lab entries. All other readings simulated.</div>
    </div>
  );
}

function RiskScene({ step }: { step: 0 | 1 }) {
  const sample = step === 0 ? before : after;
  const risk = assessRisk(sample);
  const gate = evaluateSafetyGate(risk);
  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="surface-card flex flex-col items-center justify-center p-6">
        <div className="eyebrow text-muted-foreground">AI risk score</div>
        <RiskGauge score={risk.score} className="mt-4" size={260} />
        <div className="mt-4 text-center text-xs text-muted-foreground">{sample.id} · {sample.name}</div>
      </div>
      <div className="min-w-0 space-y-5">
        <Readings highlight={step === 0 ? "before" : "after"} />
        <SafetyGatePanel gate={gate} risk={risk} compact={step === 1} />
        {step === 1 && (
          <div className="flex flex-wrap gap-2">
            {matchWater(sample).matches.slice(0, 3).map((m) => (
              <span key={m.app.id} className="rounded-full border bg-card px-3 py-1.5 text-xs">Potential: <b>{m.app.name}</b></span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchScene() {
  const { matches } = matchWater(after);
  const top = matches[0];
  if (!top) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-forest p-8 text-on-dark">
        <div className="pointer-events-none absolute inset-0 bg-glow" />
        <div className="relative">
          <div className="eyebrow text-on-dark-muted">Most suitable potential application</div>
          <div className="mt-3 flex items-center gap-3">
            <Factory className="size-7 text-emerald" />
            <div className="font-display text-5xl">{top.app.name}</div>
          </div>
          <div className="mt-6 font-display text-8xl text-emerald tabular">{top.score}</div>
          <div className="text-sm text-on-dark-muted">suitability / 100</div>
          <p className="mt-6 max-w-md text-on-dark-muted">{top.reason}</p>
          <div className="mt-6 text-xs text-on-dark-muted">Treatment: {top.treatment.join(" · ")}</div>
        </div>
      </div>
      <div className="space-y-3">
        {matches.map((m, i) => (
          <div key={m.app.id} className="surface-card flex items-center gap-4 p-4" style={{ animation: `fade-up .5s ${i * 0.12}s both` }}>
            <span className="grid size-10 place-items-center rounded-xl bg-mint text-forest">
              {m.app.category === "industrial" ? <Droplets className="size-5" /> : <Sprout className="size-5" />}
            </span>
            <div className="flex-1">
              <div className="flex justify-between text-sm font-medium"><span>{m.app.name}</span><span className="tabular">{m.score}</span></div>
              <ScoreBar value={m.score} className="mt-2" />
            </div>
          </div>
        ))}
        <p className="pt-2 text-xs text-muted-foreground">Industrial closed-loop reuse ranks first — irrigation is not assumed by default.</p>
      </div>
    </div>
  );
}

function PlantScene() {
  const plants = matchPlants(after, "hot-arid");
  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {plants.map((m, i) => (
          <div key={m.plant.id} className="surface-card overflow-hidden" style={{ animation: `fade-up .5s ${i * 0.12}s both` }}>
            <div className="relative aspect-[4/3]">
              <img src={m.plant.image} alt={m.plant.name} width={1024} height={768} className="size-full object-cover" />
              {i === 0 && <span className="absolute left-3 top-3 rounded-full bg-emerald px-2.5 py-1 text-[11px] font-semibold text-emerald-foreground">Best match</span>}
            </div>
            <div className="p-4">
              <div className="flex items-baseline justify-between">
                <div className="font-semibold">{m.plant.name}</div>
                <div className="text-xl font-semibold tabular">{m.score}</div>
              </div>
              <div className="text-xs text-muted-foreground">{m.plant.salinityLabel} · ~{m.plant.waterLitersPerDay} L/day</div>
              <ScoreBar value={m.score} className="mt-3" />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-xl border border-risk-medium/30 bg-risk-medium-soft p-3 text-sm">
        <b className="text-risk-medium">Plant suitability does not override water safety.</b> Irrigation still requires lab confirmation and operator approval.
      </p>
    </div>
  );
}

function BigStat({ value, suffix, label, decimals = 0 }: { value: number; suffix?: string; label: string; decimals?: number }) {
  const v = useCountUp(value, 1600);
  return (
    <div className="surface-card p-6">
      <div className="font-display text-5xl text-forest tabular">
        {v.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
        <span className="text-2xl text-emerald">{suffix}</span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ImpactScene() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat value={IMPACT.freshwaterSavedLiters / 1e6} decimals={1} suffix=" M L" label="Freshwater saved" />
        <BigStat value={IMPACT.treesSupported} label="Trees supported" />
        <BigStat value={IMPACT.co2TonnesPerYear} suffix=" t" label="CO₂ captured per year" />
        <BigStat value={IMPACT.reuseEfficiency} suffix="%" label="Reuse efficiency" />
      </div>
      <div className="surface-card h-56 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={IMPACT.monthly}>
            <defs>
              <linearGradient id="dm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <Area type="monotone" dataKey="reused" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#dm)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-emerald p-6 text-emerald-foreground">
        <div className="font-display text-4xl">Make Every Drop Count.</div>
        <Button variant="forest" asChild><Link to="/dashboard">Open the dashboard <ArrowRight /></Link></Button>
      </div>
    </div>
  );
}

function Demo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const go = useCallback((n: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, n)));
    setElapsed(0);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= STEP_SECONDS) {
          setStep((s) => {
            if (s >= STEPS.length - 1) {
              setPlaying(false);
              return s;
            }
            return s + 1;
          });
          return 0;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(step + 1);
      if (e.key === "ArrowLeft") go(step - 1);
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, go]);

  const NARRATION = [
    "Raw dye-line effluent arrives acidic, turbid and salty, with cadmium above its limit. The risk score climbs into the red and the Safety Gate blocks every reuse path.",
    "After neutralisation, clarification and tertiary filtration, the same parameters fall inside reference ranges. The score drops and the gate opens — for further evaluation only.",
    "RELEAF ranks reuse options by quality fit. Closed-loop industrial reuse comes first because it replaces freshwater intake directly.",
    "For irrigation-grade water, drought-tolerant trees are matched on salinity, sodium and climate — never overriding the Safety Gate.",
    "Every reused litre is tracked into freshwater saved, trees supported and carbon impact. Figures here are illustrative.",
  ];

  return (
    <div className="min-h-screen bg-gradient-mint">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3 lg:px-8">
          <Logo />
          <div className="ml-4 hidden flex-1 items-center gap-1.5 md:flex">
            {STEPS.map((s, i) => (
              <button key={s.title} onClick={() => go(i)} className="group flex-1 text-left">
                <div className="h-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-emerald transition-all duration-1000 ease-linear"
                    style={{ width: i < step ? "100%" : i === step ? `${playing ? (elapsed / STEP_SECONDS) * 100 : 100}%` : "0%" }}
                  />
                </div>
                <div className={cn("mt-1.5 truncate text-[11px]", i === step ? "font-semibold text-foreground" : "text-muted-foreground")}>{s.title}</div>
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" asChild className="ml-auto md:ml-0"><Link to="/" aria-label="Exit demo"><X /></Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div key={step} className="max-w-3xl animate-fade-up">
            <div className="eyebrow text-emerald">{STEPS[step]?.kicker} of {STEPS.length}</div>
            <h1 className="mt-2 font-display text-5xl leading-tight md:text-6xl">{STEPS[step]?.title}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{NARRATION[step]}</p>
          </div>
          <div className="flex items-center gap-2">
            <DataBadge />
          </div>
        </div>

        <div className="mt-8">
          {step <= 1 ? <RiskScene step={step as 0 | 1} /> : (
            <div key={step} className="animate-fade-up">
              {step === 2 && <MatchScene />}
              {step === 3 && <PlantScene />}
              {step === 4 && <ImpactScene />}
            </div>
          )}
        </div>

        <div className="sticky bottom-4 mt-10 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border bg-card/95 p-2 shadow-elevated backdrop-blur">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Previous scenario"><ArrowLeft /></Button>
            <Button variant={playing ? "outline" : "hero"} className="rounded-full px-5" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause /> : <Play />} {playing ? "Pause" : step === 0 && elapsed === 0 ? "Auto-play (≈3 min)" : "Resume"}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { go(0); setPlaying(false); }} aria-label="Restart demo"><RotateCcw /></Button>
            <Button variant="forest" className="px-5" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1}>
              Next <ArrowRight />
            </Button>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground"><TreePine className="mr-1 inline size-3" />Use ← → to navigate · space to play/pause</p>
      </main>
    </div>
  );
}

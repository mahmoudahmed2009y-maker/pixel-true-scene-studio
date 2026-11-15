import { useEffect, useMemo, useRef, useState } from "react";
import { useBrand } from "@/hooks/use-brand";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  ExternalLink,
  FlaskConical,
  Info,
  MonitorPlay,
  Plug,
  Radio,
  Send,
  ShieldCheck,
  Siren,
  Unplug,
  Waves,
  Wrench,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel } from "@/components/releaf/Cards";
import { RiskBadge } from "@/components/releaf/RiskBadge";
import { useReleaf } from "@/components/dashboard/releaf-context";
import { Buzzer, LcdDisplay, Led, StateDot, type IndicatorState } from "@/components/iot/HardwareVisuals";
import { SensorCard } from "@/components/iot/SensorCard";
import {
  ADC_MAX,
  BOARD,
  COMPONENTS,
  FORMULAS,
  phToAdc,
  tdsToAdc,
  turbidityToAdc,
  WOKWI_PROJECT_URL,
  WOKWI_THRESHOLDS as T,
} from "@/lib/releaf/iot/hardware";
import { convert, evaluateFirmware, type AdcReading, type ButtonState } from "@/lib/releaf/iot/logic";
import {
  ADAPTERS,
  DATA_SOURCE_LABEL,
  iotToWaterSample,
  IOT_SAMPLE_ID,
  PAYLOAD_EXAMPLE,
  type IotWaterSample,
} from "@/lib/releaf/iot/telemetry";
import { pageMeta } from "@/lib/releaf/meta";
import { assessRisk, evaluateSafetyGate } from "@/lib/releaf/risk";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/iot-monitoring")({
  head: ({ matches }) =>
    pageMeta(matches, "Live IoT Water Monitoring", "ESP32 water quality monitoring demo powered by a Wokwi hardware simulation: pH, TDS and turbidity with LED, buzzer and LCD logic."),
  component: IotMonitoring,
});

type Mode = "simulation" | "hardware";

const PRESETS: { id: string; label: string; adc: AdcReading }[] = [
  { id: "clean", label: "Clean water", adc: { ph: phToAdc(7.2), tds: tdsToAdc(640), turbidity: turbidityToAdc(18) } },
  { id: "acidic", label: "Acidic", adc: { ph: phToAdc(5.4), tds: tdsToAdc(720), turbidity: turbidityToAdc(22) } },
  { id: "salty", label: "High TDS", adc: { ph: phToAdc(7.6), tds: tdsToAdc(1850), turbidity: turbidityToAdc(30) } },
  { id: "cloudy", label: "Cloudy", adc: { ph: phToAdc(7.0), tds: tdsToAdc(820), turbidity: turbidityToAdc(74) } },
];

const HISTORY_LEN = 60;
const clampAdc = (n: number) => Math.max(0, Math.min(ADC_MAX, Math.round(n)));

function useDemoTelemetry(enabled: boolean) {
  const [adc, setAdc] = useState<AdcReading>(PRESETS[0]!.adc);
  const [drift, setDrift] = useState(true);
  const [counter, setCounter] = useState(1);
  const [history, setHistory] = useState<{ t: number; ph: number; tds: number; turbidity: number }[]>([]);
  const adcRef = useRef(adc);
  adcRef.current = adc;

  useEffect(() => {
    if (!enabled) return;
    // Mirrors the firmware's 0.5 s loop.
    const id = setInterval(() => {
      let next = adcRef.current;
      if (drift) {
        const j = (v: number, amp: number) => clampAdc(v + (Math.random() - 0.5) * amp);
        next = { ph: j(next.ph, 26), tds: j(next.tds, 40), turbidity: j(next.turbidity, 40) };
        setAdc(next);
      }
      const v = convert(next);
      setCounter((c) => c + 1);
      setHistory((h) => [...h.slice(-(HISTORY_LEN - 1)), { t: Date.now(), ...v }]);
    }, BOARD.loopMs);
    return () => clearInterval(id);
  }, [enabled, drift]);

  return { adc, setAdc, drift, setDrift, counter, history };
}

function IotMonitoring() {
  const { name: siteName } = useBrand();
  const navigate = useNavigate();
  const { shareIotSample, limits } = useReleaf();
  const [mode, setMode] = useState<Mode>("simulation");
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [buttons, setButtons] = useState<ButtonState>({ treatment: false, emergency: false });
  const [now, setNow] = useState<string | null>(null);
  const sim = mode === "simulation";
  const tele = useDemoTelemetry(sim);

  useEffect(() => {
    setNow(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }, [tele.counter]);

  const values = convert(tele.adc);
  const fw = evaluateFirmware(values, buttons, tele.counter);
  const noButtons = { treatment: false, emergency: false };
  const sensorFw = evaluateFirmware(values, noButtons, tele.counter);

  const unified: IotWaterSample = useMemo(
    () => ({
      sampleId: IOT_SAMPLE_ID,
      timestamp: now ? new Date().toISOString() : "—",
      ph: +values.ph.toFixed(2),
      tds: Math.round(values.tds),
      turbidity: +values.turbidity.toFixed(1),
      dataSource: "wokwi-demo-readings",
      simulationStatus: "demo",
      riskStatus: fw.mode,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now, fw.mode],
  );
  const releafRisk = assessRisk(iotToWaterSample(unified), limits);
  const releafGate = evaluateSafetyGate(releafRisk);

  const hist = (k: "ph" | "tds" | "turbidity") => tele.history.map((h) => ({ t: h.t, v: h[k] }));

  const share = () => {
    shareIotSample({ ...unified, timestamp: new Date().toISOString().slice(0, 19).replace("T", " ") });
    navigate({ to: "/dashboard/risk" });
  };

  const demoState = (on: boolean): IndicatorState => (sim ? (on ? "active" : "inactive") : "unavailable");
  const statusRows: { label: string; wiring: string; state: IndicatorState; detail: string }[] = [
    { label: "ESP32 board", wiring: `${BOARD.wokwiPart} · ${BOARD.firmware}`, state: sim ? "active" : "unavailable", detail: sim ? `Firmware logic modelled in ${siteName}` : "No device connected" },
    { label: "pH sensor", wiring: "pot3 → GPIO 34", state: demoState(true), detail: sim ? `Demo ADC ${tele.adc.ph}` : "No data" },
    { label: "TDS sensor", wiring: "pot2 → GPIO 35", state: demoState(true), detail: sim ? `Demo ADC ${tele.adc.tds}` : "No data" },
    { label: "Turbidity sensor", wiring: "pot1 → GPIO 32", state: demoState(true), detail: sim ? `Demo ADC ${tele.adc.turbidity}` : "No data" },
    { label: "LCD 16×2", wiring: "I2C 0x27 · SDA 21 · SCL 22", state: demoState(true), detail: sim ? `“${fw.lcd[1]}”` : "No data" },
    { label: "Green LED", wiring: "GPIO 4", state: demoState(fw.greenLed), detail: sim ? (fw.greenLed ? "ON" : "OFF") : "No data" },
    { label: "Red LED", wiring: "GPIO 2", state: demoState(fw.redLed), detail: sim ? (fw.redLed ? "ON" : "OFF") : "No data" },
    { label: "Buzzer", wiring: "GPIO 5 · PWM 2 kHz", state: demoState(fw.buzzer), detail: sim ? (fw.buzzer ? "ON" : "OFF") : "No data" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ESP32 · Wokwi"
        title="Live IoT Water Monitoring"
        description="Real-time water quality monitoring powered by ESP32."
        actions={
          <div className="flex rounded-full border bg-card p-1" role="tablist" aria-label="Data mode">
            {(
              [
                ["simulation", "Simulation Mode", MonitorPlay],
                ["hardware", "Real Hardware Mode", Plug],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  mode === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        }
      />

      {/* Honest status strip */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", sim ? "border-dashed border-info/40 bg-info-soft" : "bg-card")}>
          <Radio className={cn("size-4", sim ? "text-info" : "text-muted-foreground")} />
          <div className="text-sm">
            <span className={cn("font-semibold", sim && "text-info")}>{sim ? "Simulation Mode" : "Real Hardware Mode"}</span>{" "}
            <span className="text-muted-foreground">· {sim ? DATA_SOURCE_LABEL["wokwi-demo-readings"] : "reserved for a physical ESP32"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
          <Unplug className="size-4 text-muted-foreground" />
          <div className="text-sm"><span className="font-semibold">Telemetry link</span> <span className="text-muted-foreground">· not connected</span></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
          <Cpu className="size-4 text-muted-foreground" />
          <div className="text-sm"><span className="font-semibold">Last demo tick</span> <span className="font-mono text-muted-foreground tabular">{sim ? (now ?? "—") : "—"}</span></div>
        </div>
      </div>

      {/* Wokwi simulation */}
      <Panel
        title="ESP32 Hardware Simulation"
        subtitle="Virtual hardware demonstration built in Wokwi — not connected to a factory or physical water sensors"
        actions={
          <div className="flex items-center gap-2">
            <StateDot state={embedLoaded ? "active" : "inactive"} label={embedLoaded ? "Simulation view loaded" : "Simulation view not loaded"} />
            <Button variant="forest" size="sm" asChild>
              <a href={WOKWI_PROJECT_URL} target="_blank" rel="noopener noreferrer">
                Open in Wokwi <ExternalLink />
              </a>
            </Button>
          </div>
        }
      >
        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <div className="relative min-h-[340px] overflow-hidden rounded-xl border bg-lcd-frame sm:aspect-video sm:min-h-0">
            {embedLoaded ? (
              <iframe
                src={WOKWI_PROJECT_URL}
                title="Wokwi ESP32 water monitoring simulation"
                className="absolute inset-0 size-full"
                allow="fullscreen; clipboard-write"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-grid-dark p-6 text-center">
                <div>
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald/15 text-emerald"><Cpu className="size-7" /></div>
                  <div className="mt-4 text-lg font-semibold text-on-dark">ESP32 water monitor · Wokwi</div>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-on-dark-muted">Loads the original Wokwi project inside this page. Press ▶ in Wokwi to start the MicroPython firmware.</p>
                  <Button variant="hero" className="mt-5" onClick={() => setEmbedLoaded(true)}>
                    <MonitorPlay /> Load simulation here
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border bg-background/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Integration status</div>
              <ul className="mt-3 space-y-2.5">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-risk-low" /> External link to the original project works.</li>
                <li className="flex items-start gap-2"><Info className="mt-0.5 size-4 shrink-0 text-risk-medium" /> In-page view uses Wokwi's project page; Wokwi doesn't officially support embedding yet, so it may need sign-in or fail to load — use “Open in Wokwi”.</li>
                <li className="flex items-start gap-2"><XCircle className="mt-0.5 size-4 shrink-0 text-risk-high" /> No telemetry: the Wokwi simulation does not send readings to {siteName}. Values below are demo readings run through the same firmware formulas.</li>
              </ul>
            </div>
            <div className="rounded-xl border bg-background/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Try it in Wokwi</div>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
                <li>Start the simulation (▶).</li>
                <li>Turn the three potentiometers — they stand in for the pH, TDS and turbidity sensors.</li>
                <li>Watch the LCD, LEDs and buzzer switch between SAFE and DANGER.</li>
                <li>Hold the GPIO 15 or GPIO 12 button for treatment or emergency.</li>
              </ol>
            </div>
          </div>
        </div>
      </Panel>

      {sim ? (
        <>
          {/* Sensor cards */}
          <div className="grid gap-5 lg:grid-cols-3">
            <SensorCard
              label="pH"
              value={values.ph}
              unit=""
              decimals={1}
              pass={values.ph > T.phMin && values.ph < T.phMax}
              thresholdText={`${T.phMin} < pH < ${T.phMax}`}
              formula={FORMULAS[0].formula}
              wiring="pH sensor (pot3) → GPIO 34"
              adc={tele.adc.ph}
              history={hist("ph")}
              domain={[4, 11]}
              band={[T.phMin, T.phMax]}
            />
            <SensorCard
              label="TDS"
              value={values.tds}
              unit="ppm"
              decimals={0}
              pass={values.tds < T.tdsMax}
              thresholdText={`< ${T.tdsMax} ppm`}
              formula={FORMULAS[1].formula}
              wiring="TDS sensor (pot2) → GPIO 35"
              adc={tele.adc.tds}
              history={hist("tds")}
              domain={[200, 3500]}
              limit={T.tdsMax}
            />
            <SensorCard
              label="Turbidity"
              value={values.turbidity}
              unit="/ 100"
              decimals={0}
              pass={values.turbidity < T.turbidityMax}
              thresholdText={`< ${T.turbidityMax} (simulation scale)`}
              formula={FORMULAS[2].formula}
              wiring="Turbidity sensor (pot1) → GPIO 32"
              adc={tele.adc.turbidity}
              history={hist("turbidity")}
              domain={[0, 100]}
              limit={T.turbidityMax}
            />
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Formulas are the current simulation's conversions from main.py, not certified sensor calibrations. Thresholds are the Wokwi demo's, not regulatory standards.
          </p>

          {/* Demo controls + firmware output */}
          <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
            <Panel
              title="Demo potentiometers"
              subtitle="Set the ADC values the demo model reads (0–4095), like turning the pots in Wokwi"
              actions={
                <div className="flex items-center gap-2">
                  <Switch id="drift" checked={tele.drift} onCheckedChange={tele.setDrift} />
                  <Label htmlFor="drift" className="text-xs font-normal">Natural drift</Label>
                </div>
              }
            >
              <div className="mb-5 flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button key={p.id} onClick={() => tele.setAdc(p.adc)} className="rounded-full border bg-card px-3 py-1 text-xs transition-colors hover:border-emerald hover:bg-mint">
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="space-y-6">
                {(
                  [
                    ["ph", "pot3 · GPIO 34 · pH", values.ph.toFixed(1)],
                    ["tds", "pot2 · GPIO 35 · TDS", `${Math.trunc(values.tds)} ppm`],
                    ["turbidity", "pot1 · GPIO 32 · Turbidity", `${Math.trunc(values.turbidity)}`],
                  ] as const
                ).map(([k, label, out]) => (
                  <div key={k}>
                    <div className="mb-2.5 flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="font-mono text-xs tabular text-muted-foreground">ADC {tele.adc[k]} → {out}</span>
                    </div>
                    <Slider min={0} max={ADC_MAX} step={1} value={[tele.adc[k]]} onValueChange={(v) => tele.setAdc({ ...tele.adc, [k]: v[0] ?? tele.adc[k] })} />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="Firmware output"
              subtitle="What main.py drives for these readings"
              actions={
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold tracking-wide", fw.mode === "safe" ? "bg-risk-low-soft text-risk-low" : fw.mode === "treatment" ? "bg-risk-medium-soft text-risk-medium" : "bg-risk-high-soft text-risk-high")}>
                  {fw.statusLabel}
                </span>
              }
            >
              <div className="grid gap-5 sm:grid-cols-[1.3fr_1fr] sm:items-center">
                <LcdDisplay lines={fw.lcd} />
                <div className="flex justify-around">
                  <Led color="green" on={fw.greenLed} label="Green LED" pin="GPIO 4" />
                  <Led color="red" on={fw.redLed} label="Red LED" pin="GPIO 2" />
                  <Buzzer on={fw.buzzer} />
                </div>
              </div>
              {fw.mode === "emergency" && (
                <div className="mt-5 flex gap-3 rounded-xl border border-risk-high/40 bg-risk-high-soft p-4" role="alert">
                  <Siren className="mt-0.5 size-5 shrink-0 text-risk-high" />
                  <div className="text-sm">
                    <div className="font-semibold text-risk-high">EMERGENCY ALERT — simulated</div>
                    <p className="text-foreground/80">Red LED and buzzer on, green LED off. The original code labels this button “battery leak”; here it is a simulated emergency alert, not a real leak detector.</p>
                  </div>
                </div>
              )}
              {fw.mode === "treatment" && (
                <div className="mt-5 flex gap-3 rounded-xl border border-risk-medium/40 bg-risk-medium-soft p-4">
                  <Wrench className="mt-0.5 size-5 shrink-0 text-risk-medium" />
                  <div className="text-sm"><b className="text-risk-medium">TREATMENT IN PROGRESS</b> — PLEASE WAIT. Red LED on, buzzer off.</div>
                </div>
              )}

              <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Safety conditions (all must pass)</div>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {sensorFw.conditions.map((c) => (
                  <li key={c.id} className="flex items-start gap-2 rounded-lg border bg-background/60 p-3">
                    {c.pass ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-risk-low" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-risk-high" />}
                    <div>
                      <div className="text-sm"><span className="font-mono">{c.rule}</span> <span className="text-muted-foreground">· now {c.actual}</span></div>
                      <div className="text-xs text-muted-foreground">{c.explanation}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm">
                {sensorFw.safe
                  ? "All four conditions pass, so the firmware opens the valve: SAFE - OPEN."
                  : `${sensorFw.conditions.filter((c) => !c.pass).length} condition(s) failed, so the firmware closes the valve and sounds the buzzer: DANGER - CLOSED.`}
              </p>
            </Panel>
          </div>

          {/* Buttons */}
          <Panel title="Treatment & emergency buttons" subtitle="The two physical pushbuttons in the Wokwi circuit. Emergency takes priority over treatment.">
            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  {
                    key: "treatment" as const,
                    icon: Wrench,
                    title: "Treatment button",
                    pin: "GPIO 15 · btn1",
                    shows: "TREATMENT IN PROGRESS · PLEASE WAIT",
                    lcd: "TREATING... / PLEASE WAIT",
                    effects: ["Red LED ON", "Green LED OFF", "Buzzer OFF"],
                  },
                  {
                    key: "emergency" as const,
                    icon: Siren,
                    title: "Emergency alert button (simulated)",
                    pin: "GPIO 12 · btn2",
                    shows: "EMERGENCY ALERT",
                    lcd: "BATTERY LEAK! / EVACUATE!",
                    effects: ["Red LED ON", "Green LED OFF", "Buzzer ON"],
                  },
                ]
              ).map((b) => (
                <div key={b.key} className={cn("rounded-xl border p-5 transition-colors", buttons[b.key] && (b.key === "emergency" ? "border-risk-high/40 bg-risk-high-soft" : "border-risk-medium/40 bg-risk-medium-soft"))}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-mint text-forest"><b.icon className="size-5" /></span>
                    <div className="flex-1">
                      <div className="font-semibold">{b.title}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{b.pin} · pull-up, active when pressed</div>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-1.5 text-sm">
                    <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted-foreground">{siteName} shows</dt><dd className="font-medium">{b.shows}</dd></div>
                    <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted-foreground">LCD in Wokwi</dt><dd className="font-mono text-xs leading-5">{b.lcd}</dd></div>
                    <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted-foreground">Outputs</dt><dd>{b.effects.join(" · ")}</dd></div>
                  </dl>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
                    <Label htmlFor={`btn-${b.key}`} className="text-xs font-normal text-muted-foreground">Preview in {siteName}'s model (does not press the Wokwi button)</Label>
                    <Switch id={`btn-${b.key}`} checked={buttons[b.key]} onCheckedChange={(v) => setButtons((s) => ({ ...s, [b.key]: v }))} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </>
      ) : (
        <div className="surface-card grid gap-6 p-8 md:grid-cols-[auto_1fr]">
          <div className="grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground"><Unplug className="size-8" /></div>
          <div>
            <div className="eyebrow text-muted-foreground">Real Hardware Mode</div>
            <h2 className="mt-1 font-display text-4xl">Not Connected</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Reserved for a future physical ESP32 deployment. No readings are shown until hardware communication is configured and verified.
            </p>
            <ol className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
              {[
                "Build the circuit with real pH, TDS and turbidity probes on GPIO 34, 35 and 32",
                "Calibrate each probe — replace the simulation formulas",
                "Add a telemetry publish step (MQTT or HTTP) to the firmware",
                "Configure a broker or ingest route with per-device credentials",
                "Verify readings against a handheld reference meter",
                "Enable this mode once the link is verified",
              ].map((s, i) => (
                <li key={s} className="flex gap-2 rounded-lg border bg-background/60 p-3">
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Hardware status */}
      <Panel
        title="Hardware status"
        subtitle={sim ? `Wiring from the Wokwi diagram · state from ${siteName}'s demo model` : "No physical hardware connected"}
        bodyClassName="px-0 pb-1"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-5 py-2 font-medium">Component</th>
                <th className="px-3 py-2 font-medium">Wiring (Wokwi)</th>
                <th className="px-3 py-2 font-medium">{sim ? "Demo model" : "State"}</th>
                <th className="px-3 py-2 font-medium">Detail</th>
                <th className="px-5 py-2 font-medium">Verified connection</th>
              </tr>
            </thead>
            <tbody>
              {statusRows.map((r) => (
                <tr key={r.label} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium">{r.label}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{r.wiring}</td>
                  <td className="px-3 py-3"><StateDot state={r.state} /></td>
                  <td className="px-3 py-3 font-mono text-xs">{r.detail}</td>
                  <td className="px-5 py-3"><StateDot state="unavailable" label="Not connected" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Integration architecture */}
      <Panel title={`From ESP32 to the ${siteName} dashboard`} subtitle="How IoT readings feed Monitoring, Risk Assessment, Safety Gate, Water Matching and Reports">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { icon: Cpu, label: "ESP32 + sensors" },
            { icon: Waves, label: "MQTT / HTTP (future)" },
            { icon: ShieldCheck, label: "Ingest & validate" },
            { icon: Radio, label: "Unified IoT sample" },
            { icon: FlaskConical, label: "Risk · Gate · Matching · Reports" },
          ].map((n, i, arr) => (
            <div key={n.label} className="flex items-center gap-2">
              <span className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5", i === 1 ? "border-dashed text-muted-foreground" : "bg-card")}>
                <n.icon className="size-4 text-emerald" /> {n.label}
              </span>
              {i < arr.length - 1 && <ArrowRight className="size-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unified water sample (current)</div>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-lcd-frame p-4 font-mono text-xs leading-relaxed text-on-dark">
{JSON.stringify(sim ? unified : { ...unified, ph: null, tds: null, turbidity: null, dataSource: "esp32-hardware", simulationStatus: "not-connected" }, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Two safety checks, side by side</div>
            <div className="mt-2 space-y-3">
              <div className="rounded-xl border p-4">
                <div className="text-xs text-muted-foreground">Wokwi firmware decision</div>
                <div className={cn("mt-1 font-semibold", sensorFw.safe ? "text-risk-low" : "text-risk-high")}>{sim ? sensorFw.statusLabel : "—"}</div>
                <div className="mt-1 text-xs text-muted-foreground">4 demo thresholds on pH, TDS, turbidity.</div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">{siteName} Safety Gate {sim && <RiskBadge level={releafRisk.level} />}</div>
                <div className={cn("mt-1 font-semibold", releafGate.status === "restricted" ? "text-risk-high" : "text-risk-low")}>{sim ? `${releafGate.title} · ${releafRisk.score}/100` : "—"}</div>
                <div className="mt-1 text-xs text-muted-foreground">Stricter and lab-aware: no heavy-metal or SAR data, EC estimated from TDS, turbidity scale treated as NTU (conservative).</div>
              </div>
            </div>
            <Button variant="forest" className="mt-4 w-full" onClick={share} disabled={!sim}>
              <Send /> Send this reading to Risk Assessment
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">Adds it as sample {IOT_SAMPLE_ID} across the dashboard, labelled as a Wokwi demo reading.</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Telemetry adapters</div>
            <ul className="mt-2 space-y-2">
              {ADAPTERS.map((a) => (
                <li key={a.kind} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.label}</span>
                    <StateDot state={a.status === "active" ? "active" : "unavailable"} label={a.status === "active" ? "Active (demo)" : "Not configured"} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                  {a.requires.length > 0 && <p className="mt-1 text-[11px] text-muted-foreground">Needs: {a.requires.join(" · ")}</p>}
                </li>
              ))}
            </ul>
            <details className="mt-3 rounded-xl border p-3 text-xs">
              <summary className="cursor-pointer font-medium">Expected payload from a future publisher</summary>
              <pre className="mt-2 overflow-x-auto font-mono text-[11px] text-muted-foreground">{JSON.stringify(PAYLOAD_EXAMPLE, null, 2)}</pre>
              <p className="mt-2 text-muted-foreground">The current Wokwi code prints to the serial monitor only; it does not publish this payload.</p>
            </details>
          </div>
        </div>
      </Panel>

      <Panel title="Components in the Wokwi circuit" subtitle="Exactly as wired in the original diagram — no extra sensors added" bodyClassName="px-0 pb-1">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <tbody>
              <tr className="border-b">
                <td className="px-5 py-2.5 font-medium">Microcontroller</td>
                <td className="px-3 py-2.5 font-mono text-xs">{BOARD.wokwiPart}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">ESP32 DevKit</td>
                <td className="px-5 py-2.5 text-xs text-muted-foreground">{BOARD.firmware} · {BOARD.loopMs} ms loop</td>
              </tr>
              {COMPONENTS.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-5 py-2.5 font-medium">{c.label}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{c.wokwiPart} ({c.wokwiId})</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{c.pins}</td>
                  <td className="px-5 py-2.5 text-xs text-muted-foreground">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        This page demonstrates virtual hardware. It is not connected to a real factory or water sensors, and its readings are not laboratory results.{" "}
        <Link to="/dashboard/monitoring" className="font-medium text-emerald hover:underline">See the main monitoring page</Link>
      </div>
    </div>
  );
}

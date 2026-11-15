import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { factoriesQuery, limitsQuery, useSamples } from "@/hooks/use-releaf-data";
import { FACTORIES, SAMPLES, type DateRange, type Factory } from "@/lib/releaf/data";
import type { ClimateZone } from "@/lib/releaf/plants";
import { assessRisk, evaluateSafetyGate, LIMITS, type RiskLimits } from "@/lib/releaf/risk";
import { DEFAULT_IOT_SAMPLE, iotToWaterSample, IOT_SAMPLE_ID, TDS_TO_EC, type IotWaterSample } from "@/lib/releaf/iot/telemetry";
import { isEstimated, type GateResult, type RiskResult, type WaterSample } from "@/lib/releaf/types";

type Adjustable = Pick<WaterSample, "ph" | "turbidity" | "tds" | "ec" | "sar" | "temperature">;

interface ReleafState {
  /** Factories, samples and limits come from the admin-managed workspace; built-in demo data is the fallback. */
  factories: Factory[];
  factory: Factory;
  limits: RiskLimits;
  factoryId: string;
  setFactoryId: (id: string) => void;
  range: DateRange;
  setRange: (r: DateRange) => void;
  sampleId: string;
  setSampleId: (id: string) => void;
  /** Selected sample with any what-if adjustments applied */
  sample: WaterSample;
  baseSample: WaterSample;
  adjusted: boolean;
  adjust: (key: keyof Adjustable, value: number) => void;
  resetAdjustments: () => void;
  risk: RiskResult;
  gate: GateResult;
  zone: ClimateZone;
  setZone: (z: ClimateZone) => void;
  /** All selectable samples: demo dataset + the latest shared IoT reading */
  samples: WaterSample[];
  iotSample: IotWaterSample;
  shareIotSample: (s: IotWaterSample) => void;
}

const Ctx = createContext<ReleafState | null>(null);

export function ReleafProvider({ children }: { children: React.ReactNode }) {
  const [factoryId, setFactoryId] = useState(FACTORIES[0]!.id);
  const [range, setRange] = useState<DateRange>("30d");
  const [sampleId, setSampleIdState] = useState("S-103");
  const [overrides, setOverrides] = useState<Partial<Adjustable>>({});
  const [zone, setZone] = useState<ClimateZone>("hot-arid");
  const [iotSample, setIotSample] = useState<IotWaterSample>(DEFAULT_IOT_SAMPLE);
  const queryClient = useQueryClient();
  // Workspace data is readable only when signed in, so refetch whenever the session changes.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") queryClient.invalidateQueries({ queryKey: ["releaf"] });
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);
  const factoriesData = useQuery(factoriesQuery).data;
  const limitsData = useQuery(limitsQuery).data;
  const { samples: samplesData } = useSamples();

  const value = useMemo<ReleafState>(() => {
    const factories = factoriesData?.length ? factoriesData : FACTORIES;
    const factory = factories.find((f) => f.id === factoryId) ?? factories[0]!;
    const limits = limitsData ?? LIMITS;
    const dataset = samplesData?.length ? samplesData : SAMPLES;
    const samples = [...dataset, iotToWaterSample(iotSample)];
    const baseSample = samples.find((s) => s.id === sampleId) ?? samples[0]!;
    const sample: WaterSample = { ...baseSample, ...overrides };
    if (isEstimated(sample, "ec")) sample.ec = Math.round(sample.tds * TDS_TO_EC);
    const risk = assessRisk(sample, limits);
    return {
      factories,
      factory,
      limits,
      factoryId: factory.id,
      setFactoryId,
      range,
      setRange,
      sampleId,
      setSampleId: (id) => {
        setSampleIdState(id);
        setOverrides({});
      },
      sample,
      baseSample,
      adjusted: Object.keys(overrides).length > 0,
      adjust: (key, v) => setOverrides((o) => ({ ...o, [key]: v })),
      resetAdjustments: () => setOverrides({}),
      risk,
      gate: evaluateSafetyGate(risk),
      zone,
      setZone,
      samples,
      iotSample,
      shareIotSample: (s) => {
        setIotSample(s);
        setSampleIdState(IOT_SAMPLE_ID);
        setOverrides({});
      },
    };
  }, [factoryId, range, sampleId, overrides, zone, iotSample, factoriesData, limitsData, samplesData]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReleaf() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useReleaf must be used inside ReleafProvider");
  return v;
}

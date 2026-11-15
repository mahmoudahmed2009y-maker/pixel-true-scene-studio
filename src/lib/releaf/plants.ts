import olive from "@/assets/plant-olive.jpg";
import pomegranate from "@/assets/plant-pomegranate.jpg";
import eucalyptus from "@/assets/plant-eucalyptus.jpg";
import sesbania from "@/assets/plant-sesbania.jpg";
import { isMeasured } from "./types";
import type { WaterSample } from "./types";

export type ClimateZone = "hot-arid" | "semi-arid-coastal" | "mediterranean";

export const CLIMATE_ZONES: { id: ClimateZone; label: string; note: string }[] = [
  { id: "hot-arid", label: "Hot arid desert", note: "≥ 40 °C summers, < 50 mm rain/yr" },
  { id: "semi-arid-coastal", label: "Semi-arid coastal", note: "Humid, saline winds, mild winters" },
  { id: "mediterranean", label: "Mediterranean", note: "Wet winters, dry summers" },
];

export interface Plant {
  id: string;
  name: string;
  latin: string;
  image: string;
  /** Soil-salinity threshold ECe (dS/m) before growth declines */
  salinityThreshold: number;
  salinityLabel: string;
  maxSar: number;
  climate: Record<ClimateZone, number>;
  irrigation: string;
  waterLitersPerDay: number;
  growth: string;
  co2KgPerYear: number;
  notes: string;
}

export const PLANTS: Plant[] = [
  {
    id: "olive",
    name: "Olive Tree",
    latin: "Olea europaea",
    image: olive,
    salinityThreshold: 4,
    salinityLabel: "Moderately tolerant",
    maxSar: 9,
    climate: { "hot-arid": 82, "semi-arid-coastal": 85, mediterranean: 96 },
    irrigation: "Deep drip, 2–3× per week in summer",
    waterLitersPerDay: 40,
    growth: "Slow · 3–4 m in 10 yrs · lives centuries",
    co2KgPerYear: 11,
    notes: "Long-lived and drought-hardy; avoid harvesting fruit until water is lab-verified.",
  },
  {
    id: "pomegranate",
    name: "Pomegranate Tree",
    latin: "Punica granatum",
    image: pomegranate,
    salinityThreshold: 4,
    salinityLabel: "Moderately tolerant",
    maxSar: 8,
    climate: { "hot-arid": 88, "semi-arid-coastal": 80, mediterranean: 90 },
    irrigation: "Drip, regular during fruit set",
    waterLitersPerDay: 35,
    growth: "Moderate · 3–5 m · fruits from year 3",
    co2KgPerYear: 9,
    notes: "Heat-loving shrub-tree; edible fruit means stricter verification before use.",
  },
  {
    id: "eucalyptus",
    name: "Eucalyptus",
    latin: "Eucalyptus camaldulensis",
    image: eucalyptus,
    salinityThreshold: 6,
    salinityLabel: "Tolerant",
    maxSar: 12,
    climate: { "hot-arid": 90, "semi-arid-coastal": 86, mediterranean: 84 },
    irrigation: "Establishment drip, then low input",
    waterLitersPerDay: 60,
    growth: "Fast · up to 2 m/yr · windbreaks & timber",
    co2KgPerYear: 22,
    notes: "High biomass and carbon uptake; high water demand and can lower local water tables.",
  },
  {
    id: "sesbania",
    name: "Sesbania",
    latin: "Sesbania sesban",
    image: sesbania,
    salinityThreshold: 8,
    salinityLabel: "Highly tolerant",
    maxSar: 15,
    climate: { "hot-arid": 84, "semi-arid-coastal": 92, mediterranean: 78 },
    irrigation: "Flexible; tolerates intermittent flooding",
    waterLitersPerDay: 25,
    growth: "Very fast · 4–6 m in 2 yrs · nitrogen-fixing",
    co2KgPerYear: 14,
    notes: "Nitrogen-fixing pioneer that improves degraded, saline soils.",
  },
];

export interface PlantMatch {
  plant: Plant;
  score: number;
  salinityFit: number;
  sarFit: number;
  climateFit: number;
  explanation: string;
}

/** Soil salinity (ECe) is roughly 1.5× irrigation water salinity (ECw) under typical leaching. */
export const ECE_FROM_ECW = 1.5;

export function matchPlant(sample: WaterSample, plant: Plant, zone: ClimateZone): PlantMatch {
  const ece = (sample.ec / 1000) * ECE_FROM_ECW;
  const salinityFit =
    ece <= plant.salinityThreshold
      ? 100 - (ece / plant.salinityThreshold) * 25
      : Math.max(0, 75 - (ece - plant.salinityThreshold) * 15);
  const sarFit = !isMeasured(sample, "sar")
    ? 50
    : sample.sar <= plant.maxSar ? 100 - (sample.sar / plant.maxSar) * 20 : Math.max(0, 80 - (sample.sar - plant.maxSar) * 12);
  const climateFit = plant.climate[zone];
  const score = Math.round(0.5 * salinityFit + 0.2 * sarFit + 0.3 * climateFit);
  const explanation =
    ece <= plant.salinityThreshold
      ? `Estimated soil salinity of ${ece.toFixed(1)} dS/m is below this species' ${plant.salinityThreshold} dS/m threshold. ${plant.notes}`
      : `Estimated soil salinity of ${ece.toFixed(1)} dS/m exceeds the ${plant.salinityThreshold} dS/m threshold — expect reduced growth. ${plant.notes}`;
  return { plant, score, salinityFit: Math.round(salinityFit), sarFit: Math.round(sarFit), climateFit, explanation };
}

export function matchPlants(sample: WaterSample, zone: ClimateZone): PlantMatch[] {
  return PLANTS.map((p) => matchPlant(sample, p, zone)).sort((a, b) => b.score - a.score);
}

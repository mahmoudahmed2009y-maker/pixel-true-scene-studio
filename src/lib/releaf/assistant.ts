import { matchWater } from "./matching";
import { assessRisk, evaluateSafetyGate, LIMITS, RISK_LABEL, type RiskLimits } from "./risk";
import { fmtEc, fmtSar, fmtTemperature, type WaterSample } from "./types";

export const SUGGESTED_QUESTIONS = [
  "Explain the current water quality readings",
  "Why did this sample get its risk score?",
  "Why is the water restricted?",
  "What is the best reuse option?",
  "Do we need laboratory testing?",
  "Generate a sustainability report summary",
];

/** Rule-based answers built from the selected sample. No language model is involved. */
export function answer(question: string, s: WaterSample, L: RiskLimits = LIMITS): string {
  const q = question.toLowerCase();
  const risk = assessRisk(s, L);
  const gate = evaluateSafetyGate(risk);
  const ec = (s.ec / 1000).toFixed(2);

  if (/(restrict|block|why.*(not|can't|cannot)|unsafe)/.test(q)) {
    if (gate.status === "restricted") {
      return `Sample ${s.id} is restricted because ${gate.summary.toLowerCase()}\n\nMain drivers:\n${risk.reasons.map((r) => `• ${r}`).join("\n")}\n\nNext steps:\n${gate.nextSteps.map((n) => `• ${n}`).join("\n")}`;
    }
    return `Sample ${s.id} is not restricted. It scored ${risk.score}/100 (${RISK_LABEL[risk.level]}) and is "${gate.title}". An operator still needs to review it before any reuse.`;
  }

  if (/(score|risk|why)/.test(q)) {
    const top = risk.factors
      .filter((f) => f.subScore !== null)
      .sort((a, b) => (b.subScore ?? 0) - (a.subScore ?? 0))
      .slice(0, 3)
      .map((f) => `• ${f.label} (${f.value}) — sub-score ${Math.round(f.subScore ?? 0)}: ${f.explanation}`)
      .join("\n");
    return `Sample ${s.id} scored ${risk.score}/100, which is ${RISK_LABEL[risk.level]}.\n\nLargest contributors:\n${top}${risk.labDataMissing ? "\n\nHeavy-metal data is missing, so an uncertainty penalty was added." : ""}`;
  }

  if (/(reuse|option|best|match|use the water)/.test(q)) {
    const m = matchWater(s, L);
    if (m.blocked) return `No reuse option can be recommended for ${s.id} — the Safety Gate restricts it. Treat further and re-test first.`;
    const [a, b] = m.matches;
    if (!a) return "No reuse options were evaluated for this sample.";
    return `The most suitable potential application for ${s.id} is ${a.app.name} (suitability ${a.score}/100). ${a.reason}${b ? `\n\nRunner-up: ${b.app.name} (${b.score}/100).` : ""}\n\nThese are rule-based suggestions from simulated readings — confirm with lab results and an operator review.`;
  }

  if (/(lab|metal|cadmium|lead|cd|pb)/.test(q)) {
    return risk.labDataMissing
      ? `Yes. ${s.id} has no heavy-metal data. pH, turbidity and TDS sensors cannot detect cadmium (Cd) or lead (Pb), so an accredited laboratory test is required before any reuse.`
      : `${s.id} has an illustrative lab entry (Cd ${s.heavyMetals!.cd} mg/L, Pb ${s.heavyMetals!.pb} mg/L). It is example data, not a verified result — confirm with an accredited laboratory.`;
  }

  if (/(tree|plant|olive|eucalyptus|sesbania|pomegranate)/.test(q)) {
    return `With ECw ${ec} dS/m and SAR ${fmtSar(s)}, salt-tolerant species like Sesbania and Eucalyptus usually score highest, followed by Olive and Pomegranate. Plant suitability never overrides the Safety Gate. Open the Plant Matcher for a side-by-side comparison.`;
  }

  if (/(report|sustainab|summary)/.test(q)) {
    const m = matchWater(s, L);
    return `Sustainability summary — sample ${s.id} (simulated data)\n\n• Risk: ${risk.score}/100, ${RISK_LABEL[risk.level]}\n• Safety Gate: ${gate.title}\n• Top potential use: ${m.blocked ? "none — reuse restricted" : (m.matches[0]?.app.name ?? "none")}\n• Illustrative impact: ~68% reuse efficiency, ~18,400 trees supported\n\nOpen Reports to generate a printable version.`;
  }

  if (/(reading|quality|ph|turbid|tds|temperature|conductiv)/.test(q)) {
    return `Current simulated readings for ${s.id} (${s.name}):\n\n• pH ${s.ph.toFixed(1)} — reference ${L.ph.min}–${L.ph.max}\n• Turbidity ${s.turbidity} NTU — reference ≤ ${L.turbidity.max}\n• TDS ${s.tds} mg/L — reference ≤ ${L.tds.max.toLocaleString("en-US")}\n• Temperature ${fmtTemperature(s)}\n• Conductivity ${fmtEc(s)}${s.source === "wokwi-simulation" ? "\n\nSource: Wokwi ESP32 simulation demo reading — turbidity is on the simulation's 0–100 scale." : ""}\n\nOverall: ${RISK_LABEL[risk.level]} (${risk.score}/100).`;
  }

  return `I can explain readings, risk scores, Safety Gate restrictions, reuse options, lab-testing needs, tree matches, or draft a sustainability summary for sample ${s.id}. Try one of the suggested questions.`;
}

import { parseRomanToken } from "./romanNumerals";
import type { Mode } from "./types";

/**
 * Harmonic function analysis — the teaching layer's source of truth.
 * Tonic = home; Subdominant = departure; Dominant = tension that resolves home.
 */
export type HarmonicFunction = "tonic" | "subdominant" | "dominant" | "chromatic";

export interface ChordAnalysis {
  fn: HarmonicFunction;
  /** short badge text, e.g. "T", "S", "D", "♭" */
  badge: string;
  /** human label, e.g. "Tonic", "Secondary dominant → vi" */
  label: string;
  /** extra flavor tags: "borrowed", "secondary dominant", "diminished" */
  tags: string[];
}

/** Function by scale degree (0-indexed): I ii iii IV V vi vii°. */
const DEGREE_FUNCTION: HarmonicFunction[] = [
  "tonic", // I / i
  "subdominant", // ii
  "tonic", // iii / III
  "subdominant", // IV / iv
  "dominant", // V / v
  "tonic", // vi / VI
  "dominant", // vii° / VII
];

const FN_META: Record<HarmonicFunction, { badge: string; label: string }> = {
  tonic: { badge: "T", label: "Tonic" },
  subdominant: { badge: "S", label: "Subdominant" },
  dominant: { badge: "D", label: "Dominant" },
  chromatic: { badge: "♭", label: "Borrowed color" },
};

/** Analyze one roman token in context of the active mode. */
export function analyzeRoman(roman: string, _mode: Mode): ChordAnalysis {
  const token = roman.trim();

  if (token.includes("/")) {
    const target = token.split("/")[1]?.trim() ?? "";
    return {
      fn: "dominant",
      badge: "D",
      label: `Secondary dominant → ${target}`,
      tags: ["secondary dominant"],
    };
  }

  try {
    const parsed = parseRomanToken(token);
    const tags: string[] = [];
    let fn: HarmonicFunction = DEGREE_FUNCTION[parsed.degreeIndex] ?? "tonic";

    if (parsed.alteration !== 0) {
      fn = "chromatic";
      tags.push("borrowed");
    }
    if (/°|ø|dim/.test(parsed.suffix)) tags.push("diminished");

    const meta = FN_META[fn];
    return { fn, badge: meta.badge, label: meta.label, tags };
  } catch {
    return { fn: "tonic", badge: "T", label: "Tonic", tags: [] };
  }
}

/**
 * Deterministic one-liner explaining the progression's shape — composed from
 * the function sequence and cadence, so it is always true.
 */
export function explainProgression(romans: string[], mode: Mode): string {
  if (romans.length === 0) return "";
  const analyses = romans.map((r) => analyzeRoman(r, mode));

  const parts: string[] = [];
  const first = analyses[0];
  parts.push(
    first.fn === "tonic"
      ? "Starts at home on the tonic"
      : first.fn === "subdominant"
        ? "Opens away from home on the subdominant"
        : first.fn === "dominant"
          ? "Opens on the dominant, already leaning forward"
          : "Opens on borrowed color from the parallel key",
  );

  const hasBorrowed = analyses.some((a) => a.tags.includes("borrowed"));
  const hasSecondary = analyses.some((a) => a.tags.includes("secondary dominant"));
  if (hasSecondary) parts.push("detours through a secondary dominant to spotlight its target");
  else if (hasBorrowed) parts.push("colors the journey with a chord borrowed from the parallel key");

  const last = analyses[analyses.length - 1];
  const prev = analyses[analyses.length - 2];
  if (last.fn === "tonic" && prev?.fn === "dominant") {
    parts.push("and lands with a strong dominant → tonic cadence");
  } else if (last.fn === "tonic" && prev?.fn === "subdominant") {
    parts.push("and settles home with a gentle plagal cadence");
  } else if (last.fn === "dominant") {
    parts.push("and ends suspended on the dominant, begging to loop");
  } else if (last.fn === "tonic") {
    parts.push("and comes back to rest on the tonic");
  } else {
    parts.push("and ends in motion, perfect for looping");
  }

  return parts.join(", ") + ".";
}

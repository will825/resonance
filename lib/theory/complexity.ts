/**
 * Complexity dial: rewrite roman-numeral tokens to a target richness level
 * before realization. "auto" leaves the generator's own extensions untouched.
 *
 * - simple: strip extensions down to plain triads (diminished stays °)
 * - rich:   everything carries a 7th (Imaj7, ii7, V7, viiø7)
 * - lush:   everything carries a 9th (Imaj9, ii9, V9; diminished stays ø7)
 *
 * Colorful triads (sus2/sus4/aug) are left alone at every level — they are
 * deliberate flavor, not stackable extensions.
 */
export type Complexity = "auto" | "simple" | "rich" | "lush";

export const COMPLEXITIES: Complexity[] = ["auto", "simple", "rich", "lush"];

const SEGMENT =
  /^([b#]*)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/;

function transformSegment(segment: string, level: Complexity): string {
  const m = segment.trim().match(SEGMENT);
  if (!m) return segment;
  const [, accidental, numeral, rawSuffix] = m;
  const suffix = rawSuffix.trim();

  // Leave deliberate colors untouched at every level.
  if (/sus[24]|aug|^\+/.test(suffix)) return accidental + numeral + suffix;

  const isDiminished = /°|ø|dim|m7b5/.test(suffix);
  const isUpper = numeral === numeral.toUpperCase();
  const isDominantDegree = numeral.toUpperCase() === "V";

  switch (level) {
    case "simple":
      return accidental + numeral + (isDiminished ? "°" : "");
    case "rich":
      if (isDiminished) return accidental + numeral + "ø7";
      return accidental + numeral + (isUpper && !isDominantDegree ? "maj7" : "7");
    case "lush":
      if (isDiminished) return accidental + numeral + "ø7";
      return accidental + numeral + (isUpper && !isDominantDegree ? "maj9" : "9");
    default:
      return accidental + numeral + suffix;
  }
}

/** Apply the dial to one roman token (secondary dominants keep their target). */
export function applyComplexity(roman: string, level: Complexity): string {
  if (level === "auto") return roman;
  const [left, right] = roman.split("/");
  const transformed = transformSegment(left, level);
  return right !== undefined ? `${transformed}/${right.trim()}` : transformed;
}

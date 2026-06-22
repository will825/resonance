import type { ChordQuality } from "./chords";
import type { Mode } from "./types";
import { PITCH_CLASSES, scaleChromas } from "./scales";

const DEGREE_INDEX: Record<string, number> = {
  I: 0,
  II: 1,
  III: 2,
  IV: 3,
  V: 4,
  VI: 5,
  VII: 6,
};

const NUMERAL_RE = /^(VII|VI|IV|V|III|II|I)/i;

type BaseTriad = "maj" | "min" | "dim" | "aug";

export interface ResolvedChord {
  rootChroma: number;
  rootName: string;
  quality: ChordQuality;
}

interface ParsedToken {
  alteration: number;
  degreeIndex: number;
  isUpper: boolean;
  suffix: string;
}

/** Parse a single roman token (no secondary-dominant slash) into its parts. */
function parseToken(token: string): ParsedToken {
  let s = token.trim();
  let alteration = 0;
  while (s.length > 0 && (s[0] === "b" || s[0] === "#")) {
    alteration += s[0] === "b" ? -1 : 1;
    s = s.slice(1);
  }
  const m = s.match(NUMERAL_RE);
  if (!m) {
    throw new Error(`Could not parse roman numeral: "${token}"`);
  }
  const numeral = m[1];
  const isUpper = numeral === numeral.toUpperCase();
  return {
    alteration,
    degreeIndex: DEGREE_INDEX[numeral.toUpperCase()],
    isUpper,
    suffix: s.slice(numeral.length),
  };
}

/** Diatonic triad quality at a degree, derived from the actual scale tones. */
function diatonicTriad(chromas: number[], degree: number): BaseTriad {
  const n = chromas.length;
  const root = chromas[degree % n];
  const third = (chromas[(degree + 2) % n] - root + 12) % 12;
  const fifth = (chromas[(degree + 4) % n] - root + 12) % 12;
  if (third === 4 && fifth === 7) return "maj";
  if (third === 3 && fifth === 7) return "min";
  if (third === 3 && fifth === 6) return "dim";
  if (third === 4 && fifth === 8) return "aug";
  // Unusual stacks (e.g. modes with augmented seconds) — best-effort.
  return third <= 3 ? "min" : "maj";
}

/** Normalize a raw suffix string into a canonical extension tag. */
function normalizeSuffix(raw: string): {
  extension: string;
  explicitTriad: BaseTriad | null;
  halfDim: boolean;
} {
  let s = raw.trim();
  let halfDim = false;
  let explicitTriad: BaseTriad | null = null;

  // Half-diminished spellings.
  if (s.startsWith("ø")) {
    halfDim = true;
    s = s.slice(1);
  }
  if (s === "m7b5" || s === "min7b5") {
    return { extension: "7", explicitTriad: "dim", halfDim: true };
  }

  // Diminished spellings.
  if (s === "°" || s === "o" || s === "dim") return { extension: "", explicitTriad: "dim", halfDim };
  if (s === "°7" || s === "o7" || s === "dim7") return { extension: "dim7", explicitTriad: "dim", halfDim };

  // Augmented spellings.
  if (s === "+" || s === "aug") return { extension: "", explicitTriad: "aug", halfDim };

  // Leading dim/aug markers before an extension, e.g. "°7" handled above.
  if (s.startsWith("°") || s.startsWith("o")) {
    explicitTriad = "dim";
    s = s.replace(/^[°o]/, "");
  }
  if (s.startsWith("+")) {
    explicitTriad = "aug";
    s = s.slice(1);
  }

  // Major-seventh spellings.
  if (s === "M7" || s === "Δ" || s === "Δ7" || s === " maj7") s = "maj7";

  return { extension: s, explicitTriad, halfDim };
}

/** Combine a base triad + extension tag into a concrete chord quality. */
function combine(base: BaseTriad, extension: string, halfDim: boolean): ChordQuality {
  if (halfDim) return "m7b5";
  switch (extension) {
    case "":
      return base;
    case "7":
      if (base === "maj") return "7"; // dominant 7
      if (base === "min") return "min7";
      if (base === "dim") return "m7b5";
      return "7";
    case "maj7":
      return base === "min" ? "mMaj7" : "maj7";
    case "9":
      return base === "min" ? "min9" : "9";
    case "maj9":
      return "maj9";
    case "m9":
      return "min9";
    case "6":
      return base === "min" ? "m6" : "6";
    case "m6":
      return "m6";
    case "add9":
      return "add9";
    case "sus2":
      return "sus2";
    case "sus4":
      return "sus4";
    case "11":
      return "11";
    case "13":
      return "13";
    case "dim7":
      return "dim7";
    case "m7":
      return "min7";
    default:
      return base;
  }
}

/** Resolve a parsed token (relative to a given key/mode) into root + quality. */
function resolveSimple(token: string, tonic: string, mode: Mode): ResolvedChord {
  const parsed = parseToken(token);
  const chromas = scaleChromas(tonic, mode);
  const isDiatonicRoot = parsed.alteration === 0;
  const rootChroma = (chromas[parsed.degreeIndex] + parsed.alteration + 1200) % 12;

  const { extension, explicitTriad, halfDim } = normalizeSuffix(parsed.suffix);

  let base: BaseTriad;
  if (explicitTriad) {
    base = explicitTriad;
  } else if (isDiatonicRoot) {
    const dia = diatonicTriad(chromas, parsed.degreeIndex);
    const caseMajor = parsed.isUpper;
    const diaMajorish = dia === "maj" || dia === "aug";
    // Honor case when it clearly contradicts the diatonic major/minor sense
    // (e.g. an uppercase V in a minor key => major dominant). Preserve dim/aug
    // when the case agrees with the diatonic spelling (e.g. "vii" => vii°).
    if (caseMajor && !diaMajorish) base = "maj";
    else if (!caseMajor && diaMajorish) base = "min";
    else base = dia;
  } else {
    // Borrowed / chromatic root: case is the quality hint.
    base = parsed.isUpper ? "maj" : "min";
  }

  const quality = combine(base, extension, halfDim);
  return {
    rootChroma,
    rootName: PITCH_CLASSES[rootChroma],
    quality,
  };
}

/**
 * Resolve a roman-numeral token (supports secondary dominants "V/vi") into a
 * concrete root pitch class + chord quality, relative to the active key/mode.
 */
export function resolveRoman(roman: string, tonic: string, mode: Mode): ResolvedChord {
  const token = roman.trim();

  if (token.includes("/")) {
    const [leftRaw, rightRaw] = token.split("/");
    const left = leftRaw.trim();
    const right = rightRaw.trim();

    // Root of the tonicized target degree, in the active key.
    const target = resolveSimple(right, tonic, mode);
    const targetTonic = PITCH_CLASSES[target.rootChroma];

    // Resolve the applied chord in the target's MAJOR key.
    const parsedLeft = parseToken(left);
    const hasSuffix = parsedLeft.suffix.trim().length > 0;
    // A bare secondary "V" defaults to a dominant 7th (V/vi == dom7 of vi).
    const applied = hasSuffix ? left : `${left}7`;
    return resolveSimple(applied, targetTonic, "major");
  }

  return resolveSimple(token, tonic, mode);
}

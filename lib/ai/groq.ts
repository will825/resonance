import OpenAI from "openai";
import type { Mode, ProgressionSpec } from "@/lib/theory/types";
import { progressionSpecSchema } from "./schema";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

/** Thrown when Groq is rate-limited (HTTP 429) so the route can fall back. */
export class RateLimitError extends Error {
  constructor(message = "Groq rate limit reached") {
    super(message);
    this.name = "RateLimitError";
  }
}

/** Thrown when no API key is configured. */
export class MissingKeyError extends Error {
  constructor(message = "GROQ_API_KEY is not set") {
    super(message);
    this.name = "MissingKeyError";
  }
}

function getClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new MissingKeyError();
  return new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
}

const SCHEMA_DESCRIPTION = `{
  "key": string (tonic note, e.g. "C", "F#"),
  "mode": one of "major" | "minor" | "dorian" | "phrygian" | "lydian" | "mixolydian" | "aeolian" | "locrian" | "harmonicMinor" | "melodicMinor",
  "tempo": integer BPM (60-180),
  "feel": short text describing the vibe,
  "voicingStyle": "close" | "open" | "drop2",
  "arpeggio": "none" | "up" | "down" | "updown",
  "progression": array of { "roman": string, "bars": integer } (4-8 chords),
  "notes": short optional explanation
}`;

export function buildSystemPrompt(): string {
  return `You are a music-theory-aware assistant for producers. Given a vibe and a key/mode, output ONLY a JSON object matching this exact schema:

${SCHEMA_DESCRIPTION}

Rules:
- Express chords as ROMAN NUMERALS relative to the given key, with explicit extensions (e.g. "ii7", "V9", "Imaj7", "bVII", "V/vi").
- Uppercase = major-quality, lowercase = minor-quality. Use "°" for diminished, "+" for augmented, "ø7" for half-diminished.
- Stay mostly diatonic; add tasteful borrowed chords (e.g. "bVII", "iv", "bVI") or secondary dominants ("V/vi") when they fit the vibe.
- In minor keys, prefer a major or dominant V for cadences (harmonic-minor pull).
- Choose a tempo and voicing style that match the feel.
- Do NOT output note names, prose, or markdown — ONLY the JSON object.

Example 1 (vibe: "dreamy lofi turnaround", key C major):
{"key":"C","mode":"major","tempo":80,"feel":"dreamy lofi","voicingStyle":"open","arpeggio":"up","progression":[{"roman":"Imaj7","bars":1},{"roman":"vi7","bars":1},{"roman":"ii7","bars":1},{"roman":"V7","bars":1}],"notes":"Warm major-7th turnaround."}

Example 2 (vibe: "epic cinematic minor build", key A minor):
{"key":"A","mode":"minor","tempo":92,"feel":"epic cinematic","voicingStyle":"open","arpeggio":"none","progression":[{"roman":"i","bars":1},{"roman":"VI","bars":1},{"roman":"III","bars":1},{"roman":"VII","bars":1}],"notes":"Sweeping minor descent."}`;
}

export function buildUserPrompt(args: {
  vibe: string;
  key: string;
  mode: Mode;
  bars: number;
}): string {
  return `Vibe: "${args.vibe}"
Key: ${args.key}
Mode: ${args.mode}
Generate a progression of about ${args.bars} chords. Respond with ONLY the JSON object.`;
}

function isRateLimit(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status?: number }).status === 429
  );
}

async function callModel(
  client: OpenAI,
  model: string,
  system: string,
  user: string,
): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

/** Optionally confirm the primary model is live; otherwise use the fallback. */
async function chooseModel(client: OpenAI): Promise<string> {
  try {
    const models = await client.models.list();
    const ids = models.data.map((m) => m.id);
    return ids.includes(PRIMARY_MODEL) ? PRIMARY_MODEL : FALLBACK_MODEL;
  } catch {
    // If the listing fails (but not for rate-limit reasons), try primary anyway.
    return PRIMARY_MODEL;
  }
}

/**
 * Call Groq to generate a ProgressionSpec. Forces JSON output, zod-validates,
 * retries once with a correction message on invalid JSON, and throws
 * RateLimitError on 429 so the route can fall back deterministically.
 */
export async function generateSpec(args: {
  vibe: string;
  key: string;
  mode: Mode;
  bars: number;
}): Promise<ProgressionSpec> {
  const client = getClient();
  const system = buildSystemPrompt();
  const user = buildUserPrompt(args);

  let model: string;
  try {
    model = await chooseModel(client);
  } catch (err) {
    if (isRateLimit(err)) throw new RateLimitError();
    model = PRIMARY_MODEL;
  }

  const attempt = async (extraMessage?: string): Promise<ProgressionSpec> => {
    const userContent = extraMessage ? `${user}\n\n${extraMessage}` : user;
    let raw: string;
    try {
      raw = await callModel(client, model, system, userContent);
    } catch (err) {
      if (isRateLimit(err)) throw new RateLimitError();
      throw err;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new SyntaxError("Model did not return valid JSON");
    }

    const result = progressionSpecSchema.safeParse(parsed);
    if (!result.success) {
      throw new SyntaxError(`Schema validation failed: ${result.error.message}`);
    }
    // Force the user's chosen key/mode (the model occasionally drifts).
    return { ...result.data, key: args.key };
  };

  try {
    return await attempt();
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    // Retry once with a correction nudge.
    return attempt(
      "Your previous response was invalid. Respond with ONLY a single JSON object that exactly matches the schema. No markdown, no prose.",
    );
  }
}

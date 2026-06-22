import { NextResponse } from "next/server";
import { deterministicFallback } from "@/lib/ai/fallback";
import { generateSpec, MissingKeyError, RateLimitError } from "@/lib/ai/groq";
import { generateRequestSchema } from "@/lib/ai/schema";
import type { ProgressionSpec } from "@/lib/theory/types";

export const runtime = "nodejs";

interface GenerateResponse {
  spec: ProgressionSpec;
  source: "ai" | "fallback";
  reason?: string;
}

export async function POST(request: Request): Promise<NextResponse<GenerateResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    // Even on a bad request, hand back something usable rather than 4xx-ing the
    // producer mid-flow. Use sane defaults.
    const spec = deterministicFallback("C", "major", "uplifting pop", 8);
    return NextResponse.json({ spec, source: "fallback", reason: "invalid-request" });
  }

  const { vibe, key, mode, bars = 8 } = parsed.data;

  try {
    const spec = await generateSpec({ vibe, key, mode, bars });
    return NextResponse.json({ spec, source: "ai" });
  } catch (err) {
    let reason = "error";
    if (err instanceof RateLimitError) reason = "rate-limited";
    else if (err instanceof MissingKeyError) reason = "no-api-key";

    // Always return a usable progression (status 200).
    const spec = deterministicFallback(key, mode, vibe, bars);
    return NextResponse.json({ spec, source: "fallback", reason });
  }
}

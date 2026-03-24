import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const modeInstructions: Record<string, string> = {
  natural: "Everyday conversational tone. Mix short and long sentences. Use contractions. Sound like a smart person talking.",
  academic: "Scholarly but readable, like a knowledgeable grad student — precise, logical, formal but not robotic.",
  casual: "Very relaxed. Short sentences. Contractions everywhere. Personality. Like texting a smart friend.",
  creative: "Expressive and vivid — metaphors, varied rhythm, vivid word choices. Break grammar rules for effect.",
  simple: "Short sentences, common words only, 5th grade reading level max.",
};

const intensityInstructions: Record<string, string> = {
  light: "Fix only the obvious AI giveaways. Keep the original structure mostly intact.",
  medium: "Restructure paragraphs significantly, change word choices, vary sentence patterns noticeably.",
  heavy: "Fully rewrite. Change sentence order, add rhetorical questions, insert natural imperfections.",
};

function buildPrompt(mode: string, intensity: string): string {
  return `You are a professional human writing coach and editor. Rewrite the following AI-generated text to sound authentically written by a real person.

WRITING MODE: ${mode}
MODE RULES: ${modeInstructions[mode] || modeInstructions.natural}

INTENSITY: ${intensity}
INTENSITY RULES: ${intensityInstructions[intensity] || intensityInstructions.medium}

BANNED AI PATTERNS — remove ALL of these:
- "Furthermore," / "Moreover," / "Additionally," / "In conclusion,"
- "It is worth noting that" / "It is important to note" / "Notably," / "Significantly,"
- "In today's world" / "In the modern era" / "In recent years"
- Passive voice overuse — switch to active voice
- Starting every paragraph the same way
- Perfectly balanced pros AND cons every single time
- Overly hedging language: "may potentially", "could possibly", "it might be argued"

HUMAN AUTHENTICITY RULES — apply these:
- Vary sentence length dramatically (2-word sentences next to 20-word ones)
- Use contractions: don't, it's, they're, you'll, I've, we're
- Add 1-2 rhetorical questions if appropriate
- Use specific concrete details instead of vague generalities
- Occasional sentence fragment for emphasis. Like this.
- Show a clear point of view — don't be neutral about everything
- Start sentences with "And", "But", "So" occasionally — real humans do this

Return ONLY the rewritten text. No title, no explanation, no "Here is the rewritten version:". Just the rewritten text itself.`;
}

async function callAI(apiKey: string, systemPrompt: string, text: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (response.status === 402) throw new Error("AI credits exhausted. Please add funds in Settings > Workspace > Usage.");
    throw new Error("AI Gateway error");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, mode = "natural", intensity = "medium" } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const words = text.split(/\s+/);
    const CHUNK_SIZE = 800;
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      chunks.push(words.slice(i, i + CHUNK_SIZE).join(" "));
    }

    const prompt = buildPrompt(mode, intensity);
    const outputs: string[] = [];

    for (const chunk of chunks) {
      // Pass 1: Rewrite
      const pass1 = await callAI(LOVABLE_API_KEY, prompt, chunk);

      // Pass 2: Structure breaking
      const pass2 = await callAI(LOVABLE_API_KEY, `You are a structural editor. Break predictable flow. Vary sentence length aggressively — follow long with very short (2-5 words). Add small informal transitions: "Look,", "Here's the thing —", "And honestly,". Break any pattern where 3+ sentences follow the same rhythm. Start some sentences with "And" or "But". Use dashes for asides — like this. DO NOT change facts or meaning. Output ONLY the edited text.`, pass1);

      // Pass 3: Human noise
      const pass3 = await callAI(LOVABLE_API_KEY, `Add human texture. Ensure contractions appear naturally. Add slight imperfections: an occasional parenthetical thought, a rhetorical question, a sentence fragment for emphasis. Sprinkle in light personality: "I'd say", "probably", "honestly" — but sparingly. Add hedging where appropriate: "I think", "in my experience". 2-3 touches per paragraph max. PRESERVE all facts. Output ONLY the edited text.`, pass2);

      // Pass 4: Final polish
      const pass4 = await callAI(LOVABLE_API_KEY, `Final-pass editor. Remove any remaining AI-sounding phrases. Check meaning is preserved. Ensure smooth readability. Verify sentence variety exists. Remove repetitive words appearing too close together. Output ONLY the final polished text.`, pass3);

      outputs.push(pass4);
    }

    return new Response(
      JSON.stringify({ output: outputs.join("\n\n") }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("humanize-text error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("Rate limit") ? 429 : msg.includes("credits") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

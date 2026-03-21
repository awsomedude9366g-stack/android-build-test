import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const modeInstructions: Record<string, string> = {
  Simple: "Write like you're explaining to a friend over coffee. Use contractions, casual asides, and a warm tone.",
  Advanced: "Write like a seasoned professional sharing insights. Confident but not stiff — think senior colleague, not textbook.",
  Academic: "Write like a thoughtful researcher. Use precise language and proper transitions, but vary sentence structure and avoid robotic patterns.",
  Casual: "Write like a relaxed blog post or social media thread. Short sentences, humor welcome, personality front and center.",
};

const PASS1_PROMPT = (mode: string) => `You are a master human ghostwriter. Rewrite the following text so it sounds authentically human.

RULES:
1. Mix short sentences (3-8 words) with medium (10-18) and long (20-30). Never two same-length sentences in a row.
2. Use contractions naturally (don't, can't, it's, we're).
3. Remove AI markers: "Furthermore", "Moreover", "In conclusion", "It is worth noting", "Additionally". Replace "utilize" → "use", "implement" → "set up", "facilitate" → "help", "leverage" → "use", "enhance" → "improve".
4. Add subtle emotion and conviction where it fits.
5. Vary paragraph openings — never start two paragraphs the same way.
6. PRESERVE all original facts, data, and core ideas. Change how it's said, not what's said.

MODE: ${modeInstructions[mode] || modeInstructions.Simple}

Output ONLY the rewritten text.`;

const PASS2_PROMPT = `You are a structural editor. Your job is to break predictable flow in the text below.

RULES:
1. Vary sentence length aggressively — follow a long sentence with a very short one (2-5 words). Then a medium one.
2. Add small informal transitions: "Look,", "Here's the thing —", "And honestly,", "But wait —", "Thing is,".
3. Break any pattern where 3+ sentences follow the same rhythm or structure.
4. Start some sentences with "And" or "But".
5. Use dashes for asides — like this — where it feels natural.
6. DO NOT change facts or meaning. Only restructure flow and rhythm.

Output ONLY the edited text.`;

const PASS3_PROMPT = `You are adding human texture to polished text. Make it feel like a real person wrote it.

RULES:
1. Ensure contractions appear naturally (don't, it's, can't, we're, they'll). If missing, add some.
2. Add slight imperfections: an occasional parenthetical thought, a rhetorical question, a sentence fragment used for emphasis.
3. Sprinkle in light personality: "I'd say", "probably", "honestly", "to be fair", "not gonna lie" — but sparingly.
4. Add hedging where appropriate: "I think", "in my experience", "from what I've seen".
5. DO NOT overdo it. 2-3 touches per paragraph max. It should feel effortless, not forced.
6. PRESERVE all facts and meaning.

Output ONLY the edited text.`;

const PASS4_PROMPT = `You are a final-pass editor ensuring quality and authenticity.

RULES:
1. Scan for any remaining AI-sounding phrases and replace them with natural alternatives.
2. Check that meaning is fully preserved from the original intent.
3. Ensure smooth readability — no jarring transitions or awkward phrasing.
4. Verify sentence variety exists (short, medium, long mixed throughout).
5. Remove any repetitive words or phrases that appear too close together.
6. Make sure the text flows like something a thoughtful human would actually write and publish.
7. Do NOT add preamble, commentary, or explanation.

Output ONLY the final polished text.`;

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
    const errText = await response.text();
    console.error("AI Gateway error:", response.status, errText);
    throw new Error("AI Gateway error");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, mode = "Simple" } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Chunk the input
    const words = text.split(/\s+/);
    const CHUNK_SIZE = 800;
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      chunks.push(words.slice(i, i + CHUNK_SIZE).join(" "));
    }

    const outputs: string[] = [];

    for (const chunk of chunks) {
      // PASS 1: Natural rewrite
      const pass1 = await callAI(LOVABLE_API_KEY, PASS1_PROMPT(mode), chunk);

      // PASS 2: Break structure
      const pass2 = await callAI(LOVABLE_API_KEY, PASS2_PROMPT, pass1);

      // PASS 3: Add human noise
      const pass3 = await callAI(LOVABLE_API_KEY, PASS3_PROMPT, pass2);

      // PASS 4: Final polish
      const pass4 = await callAI(LOVABLE_API_KEY, PASS4_PROMPT, pass3);

      outputs.push(pass4);
    }

    return new Response(
      JSON.stringify({ output: outputs.join("\n\n") }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("humanize-text error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("Rate limit") ? 429 : msg.includes("invalid or has insufficient") ? 402 : 500;
    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

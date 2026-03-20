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

const SYSTEM_PROMPT = (mode: string) => `You are a master human ghostwriter. Your goal is to rewrite text so it sounds authentically human — not AI-generated. Follow every rule carefully.

REWRITING RULES:
1. SENTENCE VARIETY — Mix short punchy sentences (3-8 words) with medium (10-18 words) and occasional long ones (20-30 words). Never use the same sentence length twice in a row.
2. NATURAL VOICE — Add personality. Use "I think", "honestly", "look", "here's the thing" where appropriate. Sprinkle in contractions (don't, can't, it's, we're).
3. IMPERFECTIONS — Include minor natural touches: starting a sentence with "And" or "But", using dashes for asides, occasional parenthetical thoughts.
4. KILL AI MARKERS — Remove or replace: "Furthermore", "Moreover", "In conclusion", "It is worth noting", "Additionally", "It's important to note". Replace "utilize" with "use", "implement" with "set up", "facilitate" with "help", "leverage" with "use", "enhance" with "improve".
5. EMOTIONAL TEXTURE — Add subtle emotion: surprise ("surprisingly"), conviction ("clearly"), hedging ("probably", "I'd say"), or emphasis where it fits.
6. PARAGRAPH FLOW — Don't start every paragraph the same way. Vary openings: question, statement, short fragment, anecdote reference.
7. PRESERVE MEANING — Keep ALL original facts, data, and core ideas intact. Change how it's said, not what's said.

MODE: ${modeInstructions[mode] || modeInstructions.Simple}

Output ONLY the rewritten text. No preamble, no explanation, no meta-commentary.`;

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

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const words = text.split(/\s+/);
    const CHUNK_SIZE = 800;
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      chunks.push(words.slice(i, i + CHUNK_SIZE).join(" "));
    }

    const outputs: string[] = [];

    for (const chunk of chunks) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.85,
          messages: [
            { role: "system", content: SYSTEM_PROMPT(mode) },
            { role: "user", content: chunk },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402 || response.status === 401) {
          return new Response(JSON.stringify({ error: "OpenAI API key is invalid or has insufficient credits." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await response.text();
        console.error("OpenAI API error:", response.status, errText);
        throw new Error("OpenAI API error");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) outputs.push(content.trim());
    }

    return new Response(
      JSON.stringify({ output: outputs.join("\n\n") }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("humanize-text error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

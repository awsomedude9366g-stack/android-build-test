import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const modeInstructions: Record<string, string> = {
  Simple: "Use a conversational, casual tone. Write like you're explaining to a friend.",
  Advanced: "Use a professional, formal tone. Maintain authority and precision.",
  Academic: "Use a structured, precise academic tone. Include proper transitions and scholarly language.",
  Casual: "Use a friendly, informal tone. Write like a blog post or social media caption.",
};

const SYSTEM_PROMPT = (mode: string) => `You are an advanced AI writing assistant. Rewrite the provided text to make it fully human-like, natural, and readable while keeping the original meaning. Follow these instructions:

1. Vary sentence lengths (short, medium, long)
2. Add personal voice, casual touches, and subtle emotion
3. Include slight imperfections (grammar variations, casual phrasing)
4. Maintain readability and flow
5. Mode: ${modeInstructions[mode] || modeInstructions.Simple}
6. Remove repetitive phrases or AI markers like "Furthermore", "In conclusion", "It is worth noting"
7. Replace overly formal vocabulary (utilize→use, implement→set up, facilitate→help)

Output ONLY the rewritten text. No explanations, no preamble.`;

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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional AI text detection engine. Analyze the given text and estimate whether it is human-written, AI-generated, or mixed. Consider these signals:

- Sentence structure and paragraph patterns
- Tone consistency and emotional variance
- Repetitive phrases or filler words ("Furthermore", "In conclusion", "It is worth noting")
- Overly neutral or "safe" language
- Presence or absence of subtle errors typical for humans
- Lexical markers: overuse of formal vocabulary like "utilize", "implement", "facilitate"
- Advanced markers: lack of subtle errors, predictable openings, robotic structure
- Perplexity and burstiness patterns

Scoring:
0–20% → Clearly Human
21–45% → Mostly Human
46–65% → Mixed/AI-assisted Human
66–85% → Mostly AI
86–100% → Clearly AI

You MUST use the detect_result tool to return your analysis.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
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

    const results: { ai_probability: number; human_probability: number; reason: string }[] = [];

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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: chunk },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "detect_result",
                description: "Return AI detection analysis result",
                parameters: {
                  type: "object",
                  properties: {
                    ai_probability: { type: "number", description: "AI probability 0-100" },
                    human_probability: { type: "number", description: "Human probability 0-100" },
                    verdict: { type: "string", enum: ["Likely AI", "Likely Human", "Mixed Content"] },
                    reason: { type: "string", description: "1-2 sentence explanation" },
                  },
                  required: ["ai_probability", "human_probability", "verdict", "reason"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "detect_result" } },
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
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        results.push(parsed);
      }
    }

    if (results.length === 0) throw new Error("No results from AI analysis");

    const avgAi = Math.round(results.reduce((s, r) => s + r.ai_probability, 0) / results.length);
    const avgHuman = 100 - avgAi;
    const verdict = avgAi >= 66 ? "Likely AI" : avgAi <= 45 ? "Likely Human" : "Mixed Content";
    const reason = results.length === 1
      ? results[0].reason
      : `Averaged across ${results.length} text segments. ${results[0].reason}`;

    return new Response(
      JSON.stringify({ ai_probability: avgAi, human_probability: avgHuman, verdict, reason }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("detect-text error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

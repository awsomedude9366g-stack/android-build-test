import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert AI text detection engine. Your job is to estimate whether text is human-written, AI-generated, or a mix.

CRITICAL RULES — read carefully:
- Do NOT classify text as AI simply because it is well-structured, formal, or grammatically correct. Many humans write clean, organized prose.
- Only assign high AI probability (>65%) when MULTIPLE strong AI signals appear CONSISTENTLY throughout the text.
- If you see even moderate human signals, significantly reduce the AI score.

AI SIGNALS (must appear repeatedly to matter):
- Repetitive sentence structure (same length, same pattern paragraph after paragraph)
- Generic filler transitions: "Furthermore", "Moreover", "In conclusion", "It is worth noting", "Additionally"
- Overly neutral, hedging, "safe" tone throughout — no personality or opinion
- Predictable paragraph openings (each paragraph starts with a topic sentence + elaboration pattern)
- Overuse of formal vocabulary: "utilize", "facilitate", "implement", "leverage", "enhance"
- Lack of any subtle grammatical imperfections
- Robotic uniformity — every sentence ~same complexity

HUMAN SIGNALS (presence should LOWER AI score):
- Personal voice, opinions, or anecdotes (I think, I believe, in my experience)
- Sentence length variation — mix of short punchy and longer complex sentences
- Informal phrasing, contractions (don't, can't, it's, won't, I've)
- Subtle imperfections, colloquialisms, or conversational asides
- Emotional language or humor
- Unique word choices or creative phrasing

SCORING:
0–20% → Clearly Human
21–45% → Mostly Human  
46–65% → Mixed / AI-assisted
66–85% → Mostly AI
86–100% → Clearly AI

Also provide a confidence level:
- "High" if you are very certain of your assessment
- "Medium" if the text has ambiguous signals
- "Low" if the text is too short or unclear to judge well

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

    const results: { ai_probability: number; confidence: string; reason: string }[] = [];

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
                    confidence: { type: "string", enum: ["Low", "Medium", "High"] },
                    reason: { type: "string", description: "1-2 sentence explanation focusing on specific signals found" },
                  },
                  required: ["ai_probability", "human_probability", "verdict", "confidence", "reason"],
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

    // Aggregate scores
    let avgAi = Math.round(results.reduce((s, r) => s + r.ai_probability, 0) / results.length);

    // === POST-PROCESSING SCORE ADJUSTMENTS ===
    const lowerText = text.toLowerCase();

    // Personal tone indicators
    const personalPatterns = /\b(i think|i believe|in my experience|i feel|i've seen|we think|my opinion|personally)\b/gi;
    const personalMatches = (lowerText.match(personalPatterns) || []).length;
    if (personalMatches >= 1) avgAi = Math.max(0, avgAi - 5 * Math.min(personalMatches, 4));

    // First person pronouns
    const firstPersonCount = (lowerText.match(/\b(i|we|my|our|me|us)\b/g) || []).length;
    const wordCount = words.length;
    const firstPersonRatio = firstPersonCount / wordCount;
    if (firstPersonRatio > 0.02) avgAi = Math.max(0, avgAi - 8);

    // Informal language / contractions
    const informalPatterns = /\b(don't|can't|won't|isn't|aren't|couldn't|shouldn't|wouldn't|it's|i'm|i've|we're|they're|that's|what's|here's|there's|gonna|gotta|wanna|kinda|sorta)\b/gi;
    const informalMatches = (lowerText.match(informalPatterns) || []).length;
    if (informalMatches >= 2) avgAi = Math.max(0, avgAi - 5 * Math.min(informalMatches, 3));

    // Clamp
    avgAi = Math.max(0, Math.min(100, Math.round(avgAi)));
    const avgHuman = 100 - avgAi;

    const verdict = avgAi >= 66 ? "Likely AI" : avgAi <= 45 ? "Likely Human" : "Mixed Content";

    // Aggregate confidence
    const confidenceLevels = results.map(r => r.confidence || "Medium");
    const confMap: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
    const avgConf = confidenceLevels.reduce((s, c) => s + (confMap[c] || 2), 0) / confidenceLevels.length;
    const confidence = avgConf >= 2.5 ? "High" : avgConf >= 1.5 ? "Medium" : "Low";

    const reason = results.length === 1
      ? results[0].reason
      : `Averaged across ${results.length} text segments. ${results[0].reason}`;

    return new Response(
      JSON.stringify({ ai_probability: avgAi, human_probability: avgHuman, verdict, confidence, reason }),
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

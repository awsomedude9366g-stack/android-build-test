import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a forensic AI text detection expert trained on thousands of AI vs human writing samples.

Analyze the text using ALL these signals:

1. PERPLEXITY — Are word choices predictable or surprising? AI always picks "safe" words.
2. BURSTINESS — Does sentence length vary wildly (human) or stay uniform (AI)?
3. TRANSITION WORDS — Overuse of: Furthermore, Moreover, Additionally, In conclusion = AI
4. HEDGING LANGUAGE — Overuse of: "may", "might", "could potentially", "it is worth noting" = AI
5. PASSIVE VOICE — Excessive passive voice is an AI pattern
6. PERSONAL VOICE — Personal stories, opinions, errors, slang = Human signals
7. STRUCTURAL PREDICTABILITY — claim→explain→example→summary repeated = AI
8. VOCABULARY RICHNESS — AI uses safe, common words. Humans use niche, context-specific words
9. SENTENCE OPENINGS — AI repeats the same sentence starters. Humans vary them
10. EMOTIONAL AUTHENTICITY — AI avoids strong emotions, humor, sarcasm

CRITICAL: Do NOT classify text as AI simply because it is formal or grammatically correct. Only assign high AI probability when MULTIPLE strong AI signals repeat consistently.

You MUST use the detect_result tool to return your analysis.`;

async function callAI(apiKey: string, text: string, retries = 3): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        tools: [{
          type: "function",
          function: {
            name: "detect_result",
            description: "Return forensic AI detection analysis",
            parameters: {
              type: "object",
              properties: {
                verdict: { type: "string", enum: ["AI", "HUMAN", "MIXED"] },
                ai_probability: { type: "number" },
                human_probability: { type: "number" },
                confidence: { type: "number" },
                perplexity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                burstiness: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                vocab_richness: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                sentence_analysis: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      label: { type: "string", enum: ["AI", "HUMAN"] },
                      reason: { type: "string" },
                    },
                    required: ["text", "label", "reason"],
                  },
                },
                top_signals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      icon: { type: "string" },
                      signal: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
                    },
                    required: ["icon", "signal", "description", "severity"],
                  },
                },
                forensic_analysis: { type: "string" },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: ["verdict", "ai_probability", "human_probability", "confidence", "perplexity", "burstiness", "vocab_richness", "sentence_analysis", "top_signals", "forensic_analysis", "recommendations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "detect_result" } },
      }),
    });

    if (response.status === 429 && attempt < retries - 1) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
      continue;
    }
    if (response.status === 402) throw new Error("AI credits exhausted. Please add funds in Settings > Workspace > Usage.");
    if (!response.ok) {
      const t = await response.text();
      console.error("AI Gateway error:", response.status, t);
      throw new Error("AI Gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No result from AI");
    return JSON.parse(toolCall.function.arguments);
  }
  throw new Error("Rate limit exceeded. Please try again later.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const result = await callAI(LOVABLE_API_KEY, text.slice(0, 8000));

    // Post-processing adjustments
    const lowerText = text.toLowerCase();
    let aiProb = result.ai_probability;

    const personalPatterns = /\b(i think|i believe|in my experience|i feel|i've seen|we think|my opinion|personally)\b/gi;
    const personalMatches = (lowerText.match(personalPatterns) || []).length;
    if (personalMatches >= 1) aiProb = Math.max(0, aiProb - 4 * Math.min(personalMatches, 4));

    const informalPatterns = /\b(don't|can't|won't|isn't|aren't|couldn't|shouldn't|wouldn't|it's|i'm|i've|we're|they're|that's|what's|here's|there's|gonna|gotta|wanna|kinda|sorta)\b/gi;
    const informalMatches = (lowerText.match(informalPatterns) || []).length;
    if (informalMatches >= 2) aiProb = Math.max(0, aiProb - 3 * Math.min(informalMatches, 4));

    aiProb = Math.max(0, Math.min(100, Math.round(aiProb)));

    return new Response(JSON.stringify({
      ...result,
      ai_probability: aiProb,
      human_probability: 100 - aiProb,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("detect-text error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("Rate limit") ? 429 : msg.includes("credits") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

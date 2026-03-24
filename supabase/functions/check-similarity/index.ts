import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert plagiarism and similarity detection specialist. Compare these two texts at a deep semantic level — meaning, ideas, structure, and argument flow — not just word matching.

ANALYSIS TASKS:
1. SEMANTIC SIMILARITY — Do they convey the same meaning even if words differ?
2. STRUCTURAL SIMILARITY — Do they follow the same argument structure and paragraph order?
3. IDEA OVERLAP — Which specific ideas, claims, or arguments appear in both?
4. PARAPHRASE DETECTION — Is Text B a rewrite of Text A (or vice versa)?
5. PLAGIARISM RISK — Based on all signals combined, how likely is this plagiarism?

You MUST use the similarity_result tool to return your analysis.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { textA, textB } = await req.json();
    if (!textA || !textB || typeof textA !== "string" || typeof textB !== "string") {
      return new Response(JSON.stringify({ error: "Both textA and textB are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Text A:\n${textA.slice(0, 5000)}\n\nText B:\n${textB.slice(0, 5000)}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "similarity_result",
              description: "Return deep similarity analysis",
              parameters: {
                type: "object",
                properties: {
                  semantic_similarity: { type: "number" },
                  structural_similarity: { type: "number" },
                  idea_overlap: { type: "number" },
                  plagiarism_risk: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                  is_paraphrase: { type: "boolean" },
                  paraphrase_confidence: { type: "number" },
                  shared_ideas: { type: "array", items: { type: "string" } },
                  unique_to_A: { type: "array", items: { type: "string" } },
                  unique_to_B: { type: "array", items: { type: "string" } },
                  matching_segments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        from_A: { type: "string" },
                        from_B: { type: "string" },
                        type: { type: "string", enum: ["exact", "paraphrase", "concept"] },
                      },
                      required: ["from_A", "from_B", "type"],
                    },
                  },
                  verdict: { type: "string" },
                  risk_explanation: { type: "string" },
                  advice: { type: "string" },
                },
                required: ["semantic_similarity", "structural_similarity", "idea_overlap", "plagiarism_risk", "is_paraphrase", "paraphrase_confidence", "shared_ideas", "unique_to_A", "unique_to_B", "matching_segments", "verdict", "risk_explanation", "advice"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "similarity_result" } },
        }),
      });

      if (response.status === 429 && attempt < 2) {
        await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      if (response?.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response?.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI Gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No result from AI");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-similarity error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("Rate limit") ? 429 : msg.includes("credits") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

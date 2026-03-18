import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional semantic similarity engine. Compare two texts and calculate similarity based on meaning, not only exact words. Consider:

- Exact phrase matches
- Paraphrased content and synonyms
- Sentence/paragraph reordering
- Semantic context

You MUST use the similarity_result tool to return your analysis.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textA, textB } = await req.json();
    if (!textA || !textB || typeof textA !== "string" || typeof textB !== "string") {
      return new Response(JSON.stringify({ error: "Both textA and textB are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Text A:\n${textA}\n\nText B:\n${textB}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "similarity_result",
              description: "Return similarity analysis result",
              parameters: {
                type: "object",
                properties: {
                  similarity_percentage: { type: "number", description: "Similarity 0-100" },
                  matching_segments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text_from_A: { type: "string" },
                        text_from_B: { type: "string" },
                      },
                      required: ["text_from_A", "text_from_B"],
                    },
                  },
                  verdict: { type: "string", enum: ["Low Similarity", "Moderate Similarity", "High Similarity"] },
                  reason: { type: "string", description: "Explanation based on semantic match" },
                },
                required: ["similarity_percentage", "matching_segments", "verdict", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "similarity_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No result from AI");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        similarity: result.similarity_percentage,
        matching_segments: result.matching_segments || [],
        verdict: result.verdict,
        explanation: result.reason,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("check-similarity error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

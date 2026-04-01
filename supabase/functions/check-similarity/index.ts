import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a text similarity analysis engine.

Compare the two texts and return ONLY this exact JSON format with no extra text, no markdown, no backticks:

{
  "overall": 85,
  "semantic": 90,
  "structural": 80,
  "idea_overlap": 85,
  "plagiarism_risk": "High",
  "verdict": "Near-Identical",
  "matching_segments": [
    {
      "from_a": "first matching phrase from text A",
      "from_b": "matching phrase from text B",
      "type": "Exact Match"
    }
  ],
  "detail": "2-3 sentence explanation here"
}

STRICT RULES:
- All score values must be plain integers like 85 not "85" not "85%"
- overall + semantic + structural + idea_overlap all between 0-100
- plagiarism_risk must be one of: "Low" / "Medium" / "High"
- verdict must be one of: "Identical" / "Very Similar" / "Similar" / "Somewhat Similar" / "Different"
- If both texts are exactly the same → all scores = 100
- Return ONLY the JSON object, nothing else before or after`;

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
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("No result from AI");

    // Parse the JSON response - strip any markdown backticks if present
    const jsonStr = content.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    const result = JSON.parse(jsonStr);

    // Normalize the result to match our expected format, with NaN/undefined protection
    const safeNum = (v: unknown): number => {
      const n = Number(v);
      return isNaN(n) ? 0 : Math.min(100, Math.max(0, Math.round(n)));
    };

    const normalized = {
      semantic_similarity: safeNum(result.semantic),
      structural_similarity: safeNum(result.structural),
      idea_overlap: safeNum(result.idea_overlap),
      overall_score: safeNum(result.overall),
      plagiarism_risk: (result.plagiarism_risk || "Low").toUpperCase(),
      is_paraphrase: result.verdict === "Very Similar" || result.verdict === "Similar",
      paraphrase_confidence: safeNum(result.overall),
      shared_ideas: [],
      unique_to_A: [],
      unique_to_B: [],
      matching_segments: (result.matching_segments || []).map((seg: any) => ({
        from_A: seg.from_a || seg.from_A || "",
        from_B: seg.from_b || seg.from_B || "",
        type: (seg.type || "concept").toLowerCase().includes("exact") ? "exact" : "paraphrase",
      })),
      verdict: result.verdict || "Different",
      risk_explanation: result.detail || "",
      advice: "",
    };

    return new Response(JSON.stringify(normalized), {
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

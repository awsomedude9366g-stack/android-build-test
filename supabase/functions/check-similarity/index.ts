import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional semantic similarity engine. Compare two texts based on MEANING, not surface-level word matching. Consider:
- Paraphrased content conveying the same ideas
- Synonyms and equivalent expressions
- Sentence or paragraph reordering that preserves meaning
- Shared arguments, claims, or data points

Do NOT inflate similarity just because texts share a topic.

You MUST use the similarity_result tool to return your analysis.`;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function getEmbedding(apiKey: string, text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error("Embedding error:", response.status, errText);
    throw new Error("Embedding API error");
  }
  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textA, textB } = await req.json();
    if (!textA || !textB || typeof textA !== "string" || typeof textB !== "string") {
      return new Response(JSON.stringify({ error: "Both textA and textB are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    // Run embedding + GPT analysis in parallel
    const [embeddingA, embeddingB, gptResponse] = await Promise.all([
      getEmbedding(OPENAI_API_KEY, textA),
      getEmbedding(OPENAI_API_KEY, textB),
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Text A:\n${textA.slice(0, 5000)}\n\nText B:\n${textB.slice(0, 5000)}` },
          ],
          tools: [{
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
                  confidence: { type: "string", enum: ["Low", "Medium", "High"] },
                  reason: { type: "string" },
                },
                required: ["similarity_percentage", "matching_segments", "verdict", "confidence", "reason"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "similarity_result" } },
        }),
      }),
    ]);

    // Compute cosine similarity from embeddings
    const embeddingSimilarity = Math.round(cosineSimilarity(embeddingA, embeddingB) * 100);

    if (!gptResponse.ok) {
      if (gptResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (gptResponse.status === 402 || gptResponse.status === 401) {
        return new Response(JSON.stringify({ error: "OpenAI API key is invalid or has insufficient credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("OpenAI API error");
    }

    const gptData = await gptResponse.json();
    const toolCall = gptData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No result from AI");

    const gptResult = JSON.parse(toolCall.function.arguments);

    // Blend: 70% embedding + 30% GPT reasoning
    const finalSimilarity = Math.round(embeddingSimilarity * 0.7 + gptResult.similarity_percentage * 0.3);

    const verdict = finalSimilarity >= 60 ? "High Similarity" : finalSimilarity >= 30 ? "Moderate Similarity" : "Low Similarity";

    return new Response(
      JSON.stringify({
        similarity: finalSimilarity,
        embedding_similarity: embeddingSimilarity,
        gpt_similarity: gptResult.similarity_percentage,
        matching_segments: gptResult.matching_segments || [],
        verdict,
        confidence: gptResult.confidence || "Medium",
        explanation: gptResult.reason,
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

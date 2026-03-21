import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert AI text detection engine. Your job is to estimate whether text is human-written, AI-generated, or a mix.

CRITICAL RULES:
- Do NOT classify text as AI simply because it is well-structured, formal, or grammatically correct.
- Only assign high AI probability (>65%) when MULTIPLE strong AI signals appear CONSISTENTLY.
- If you see even moderate human signals, significantly reduce the AI score.

AI SIGNALS (must appear repeatedly):
- Repetitive sentence structure (same length, same pattern)
- Generic filler transitions: "Furthermore", "Moreover", "In conclusion", "Additionally"
- Overly neutral, hedging, "safe" tone — no personality
- Predictable paragraph openings
- Overuse of formal vocabulary: "utilize", "facilitate", "implement", "leverage"
- Robotic uniformity — every sentence ~same complexity

HUMAN SIGNALS (should LOWER AI score):
- Personal voice, opinions, anecdotes
- Sentence length variation — short punchy + longer complex
- Contractions (don't, can't, it's)
- Subtle imperfections, colloquialisms
- Emotional language or humor
- Unique word choices

SCORING: 0–20% Clearly Human, 21–45% Mostly Human, 46–65% Mixed, 66–85% Mostly AI, 86–100% Clearly AI

You MUST use the detect_result tool to return your analysis.`;

// === STATISTICAL ANALYSIS FUNCTIONS ===

function computeSentenceLengthVariance(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 2) return 0;
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  return variance;
}

function computeRepetitionScore(text: string): number {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  if (words.length === 0) return 0;
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  const repeated = Object.values(freq).filter(c => c > 2).reduce((s, c) => s + c, 0);
  return (repeated / words.length) * 100; // % of words that are repeated >2x
}

function computeVocabularyDiversity(text: string): number {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 1;
  const unique = new Set(words).size;
  return unique / words.length; // type-token ratio (0-1, higher = more diverse)
}

function computeStatisticalScore(text: string): { score: number; details: { sentenceVariance: number; repetitionPct: number; vocabDiversity: number } } {
  const sentenceVariance = computeSentenceLengthVariance(text);
  const repetitionPct = computeRepetitionScore(text);
  const vocabDiversity = computeVocabularyDiversity(text);

  let score = 50; // start neutral

  // Low sentence variance → AI signal
  if (sentenceVariance < 10) score += 15;
  else if (sentenceVariance < 20) score += 8;
  else if (sentenceVariance > 50) score -= 12;
  else if (sentenceVariance > 30) score -= 6;

  // High repetition → AI signal
  if (repetitionPct > 30) score += 12;
  else if (repetitionPct > 20) score += 6;
  else if (repetitionPct < 10) score -= 5;

  // Low vocabulary diversity → AI signal
  if (vocabDiversity < 0.4) score += 12;
  else if (vocabDiversity < 0.5) score += 6;
  else if (vocabDiversity > 0.7) score -= 10;
  else if (vocabDiversity > 0.6) score -= 5;

  return { score: Math.max(0, Math.min(100, score)), details: { sentenceVariance: Math.round(sentenceVariance * 10) / 10, repetitionPct: Math.round(repetitionPct * 10) / 10, vocabDiversity: Math.round(vocabDiversity * 100) / 100 } };
}

// === IMPROVED CHUNK AGGREGATION ===
function aggregateScores(chunks: { score: number; wordCount: number }[]): number {
  if (chunks.length === 0) return 50;
  if (chunks.length === 1) return chunks[0].score;

  // Remove outliers (highest and lowest) if 3+ chunks
  let filtered = [...chunks];
  if (filtered.length >= 3) {
    filtered.sort((a, b) => a.score - b.score);
    filtered = filtered.slice(1, -1); // remove min and max
  }

  // Weighted median by word count
  filtered.sort((a, b) => a.score - b.score);
  const totalWords = filtered.reduce((s, c) => s + c.wordCount, 0);
  let cumWeight = 0;
  for (const chunk of filtered) {
    cumWeight += chunk.wordCount;
    if (cumWeight >= totalWords / 2) return chunk.score;
  }
  return filtered[Math.floor(filtered.length / 2)].score;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Compute statistical analysis on full text
    const stats = computeStatisticalScore(text);

    const words = text.split(/\s+/);
    const CHUNK_SIZE = 800;
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      chunks.push(words.slice(i, i + CHUNK_SIZE).join(" "));
    }

    const gptResults: { ai_probability: number; confidence: string; reason: string; wordCount: number }[] = [];

    for (const chunk of chunks) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: chunk },
          ],
          tools: [{
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
                  reason: { type: "string", description: "1-2 sentence explanation" },
                },
                required: ["ai_probability", "human_probability", "verdict", "confidence", "reason"],
                additionalProperties: false,
              },
            },
          }],
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
        gptResults.push({ ...parsed, wordCount: chunk.split(/\s+/).length });
      }
    }

    if (gptResults.length === 0) throw new Error("No results from AI analysis");

    // Aggregate GPT scores using improved method
    const gptScore = aggregateScores(gptResults.map(r => ({ score: r.ai_probability, wordCount: r.wordCount })));

    // === COMBINE: GPT score + Statistical score ===
    let finalScore = Math.round((gptScore + stats.score) / 2);

    // === POST-PROCESSING ADJUSTMENTS ===
    const lowerText = text.toLowerCase();

    const personalPatterns = /\b(i think|i believe|in my experience|i feel|i've seen|we think|my opinion|personally)\b/gi;
    const personalMatches = (lowerText.match(personalPatterns) || []).length;
    if (personalMatches >= 1) finalScore = Math.max(0, finalScore - 5 * Math.min(personalMatches, 4));

    const firstPersonCount = (lowerText.match(/\b(i|we|my|our|me|us)\b/g) || []).length;
    const firstPersonRatio = firstPersonCount / words.length;
    if (firstPersonRatio > 0.02) finalScore = Math.max(0, finalScore - 8);

    const informalPatterns = /\b(don't|can't|won't|isn't|aren't|couldn't|shouldn't|wouldn't|it's|i'm|i've|we're|they're|that's|what's|here's|there's|gonna|gotta|wanna|kinda|sorta)\b/gi;
    const informalMatches = (lowerText.match(informalPatterns) || []).length;
    if (informalMatches >= 2) finalScore = Math.max(0, finalScore - 5 * Math.min(informalMatches, 3));

    // Statistical adjustments
    if (stats.details.sentenceVariance > 40) finalScore = Math.max(0, finalScore - 5);
    if (stats.details.repetitionPct > 25) finalScore = Math.min(100, finalScore + 5);

    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));
    const humanScore = 100 - finalScore;

    const verdict = finalScore >= 66 ? "Likely AI" : finalScore <= 45 ? "Likely Human" : "Mixed Content";

    const confidenceLevels = gptResults.map(r => r.confidence || "Medium");
    const confMap: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
    const avgConf = confidenceLevels.reduce((s, c) => s + (confMap[c] || 2), 0) / confidenceLevels.length;
    const confidence = avgConf >= 2.5 ? "High" : avgConf >= 1.5 ? "Medium" : "Low";

    const reason = gptResults.length === 1
      ? gptResults[0].reason
      : `Analyzed ${gptResults.length} text segments. ${gptResults[0].reason}`;

    return new Response(
      JSON.stringify({
        ai_probability: finalScore,
        human_probability: humanScore,
        verdict,
        confidence,
        reason,
        statistical_details: stats.details,
      }),
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

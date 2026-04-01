import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const modeInstructions: Record<string, string> = {
  natural: "Everyday conversational tone. Mix short and long sentences. Use contractions. Sound like a smart person talking.",
  academic: "Scholarly but readable, like a knowledgeable grad student — precise, logical, formal but not robotic. Break every complex academic sentence into simpler parts. Replace ALL technical jargon with plain English equivalents. Add a relatable real-world example after every technical claim. Use 'researchers' instead of 'the study demonstrates'. Use 'found' instead of 'it was evidenced that'. Keep the facts and data — just make the language human.",
  casual: "Very relaxed. Short sentences. Contractions everywhere. Personality. Like texting a smart friend.",
  creative: "Expressive and vivid — metaphors, varied rhythm, vivid word choices. Break grammar rules for effect.",
  simple: "Short sentences, common words only, 5th grade reading level max.",
};

const intensityInstructions: Record<string, string> = {
  light: "Fix only the obvious AI giveaways. Keep the original structure mostly intact.",
  medium: "Restructure paragraphs significantly, change word choices, vary sentence patterns noticeably.",
  heavy: "Fully rewrite. Change sentence order, add rhetorical questions, insert natural imperfections.",
};

function buildPrompt(mode: string, intensity: string): string {
  return `You are an elite human ghostwriter with 15+ years of experience writing for top journalists, professors, and executives. Your specialty is taking robotic, AI-generated text and completely transforming it into authentic, natural human writing that no AI detector can flag.

WRITING MODE: ${mode}
MODE RULES: ${modeInstructions[mode] || modeInstructions.natural}

INTENSITY: ${intensity}
INTENSITY RULES: ${intensityInstructions[intensity] || intensityInstructions.medium}

════════════════════════════════════════
WHAT YOU MUST ALWAYS DO:
════════════════════════════════════════

1. SENTENCE BREAKING
   - Any sentence longer than 25 words → split into 2 sentences
   - Never keep 3 long sentences in a row
   - After every 2-3 long sentences → add 1 short punchy sentence
   - Example short sentences: "And that matters." / "Here's why." / "That's the reality." / "Simple as that."

2. KILL THESE WORDS COMPLETELY
   - "Furthermore" → replace with "And" or "On top of that"
   - "Moreover" → replace with "What's more" or just remove
   - "It is important to note" → replace with "Here's the thing —"
   - "It is worth noting" → replace with "Worth mentioning —"
   - "In conclusion" → replace with "Bottom line" or "At the end of the day"
   - "In today's world" → replace with "Right now" or "These days"
   - "Delve into" → replace with "dig into" or "look at"
   - "Multifaceted" → replace with "complex" or "complicated"
   - "Leverage" → replace with "use"
   - "Utilize" → replace with "use"
   - "Facilitate" → replace with "help" or "make easier"
   - "Subsequently" → replace with "then" or "after that"
   - "Endeavor" → replace with "try"
   - "Commence" → replace with "start" or "begin"
   - "Demonstrate" → replace with "show"
   - "Significantly" → replace with "a lot" or "really" or remove
   - "Substantially" → replace with "a lot" or remove
   - "Unprecedented" → replace with "never seen before" or "massive"
   - "Rapidly evolving" → replace with "fast-changing" or "quickly changing"

3. CONTRACTIONS — ADD THEM EVERYWHERE NATURAL
   - "it is" → "it's", "do not" → "don't", "cannot" → "can't"
   - "they are" → "they're", "we are" → "we're", "that is" → "that's"
   - "you will" → "you'll", "there is" → "there's", "have not" → "haven't"

4. ACTIVE VOICE — ALWAYS
   - "Data was analyzed by the system" → "The system analyzed the data"
   - "Results were found to be" → "The results showed"
   - "It has been suggested that" → "Experts suggest"
   - "Studies have been conducted" → "Researchers studied"

5. ADD HUMAN PERSONALITY TOUCHES
   - Add 1-2 rhetorical questions per paragraph: "And why does that matter?" / "So what does this actually mean?" / "Sound familiar?"
   - Add 1 casual observation per paragraph: "which honestly makes sense" / "and that's a big deal" / "which is pretty remarkable"
   - Occasionally start a sentence with: "Look," / "Here's the thing —" / "Honestly," / "The truth is," / "And yet,"

6. FOR BUSINESS TEXT SPECIFICALLY:
   - Remove ALL corporate buzzwords
   - Replace "competitive advantage" with "stay ahead"
   - Replace "digital transformation" with "going digital"
   - Replace "sustainable growth" with "growth that lasts"
   - Replace "stakeholders" with "the people involved"

7. PARAGRAPH STRUCTURE:
   - Each paragraph: max 4-5 sentences
   - Start paragraphs with a SHORT sentence (under 10 words)
   - End paragraphs with either a short punchy sentence OR a rhetorical question
   - Add a line break between every paragraph

8. RHYTHM CHECK — before finalizing, verify:
   - No 3 sentences in a row are the same length
   - No paragraph sounds the same as the previous one
   - The text has energy — it flows when read out loud

════════════════════════════════════════
WHAT YOU MUST NEVER DO:
════════════════════════════════════════
❌ Never add "Here is the humanized version:"
❌ Never add any explanation or commentary
❌ Never summarize — keep same length as original
❌ Never change facts, data, or core meaning
❌ Never use the banned words listed above
❌ Never write more than 3 sentences of same length in a row
❌ Never start 2 consecutive sentences with the same word
❌ Never end with "In conclusion" or any summary phrase

════════════════════════════════════════
OUTPUT RULE:
════════════════════════════════════════
Output ONLY the humanized text.
Nothing before it. Nothing after it.
Just the rewritten human text — ready to use.`;
}

async function callAI(apiKey: string, systemPrompt: string, text: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (response.status === 402) throw new Error("AI credits exhausted. Please add funds in Settings > Workspace > Usage.");
    throw new Error("AI Gateway error");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, mode = "natural", intensity = "medium" } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const words = text.split(/\s+/);
    const CHUNK_SIZE = 800;
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      chunks.push(words.slice(i, i + CHUNK_SIZE).join(" "));
    }

    const prompt = buildPrompt(mode, intensity);
    const outputs: string[] = [];

    for (const chunk of chunks) {
      // Pass 1: Full rewrite with elite ghostwriter prompt
      const pass1 = await callAI(LOVABLE_API_KEY, prompt, chunk);

      // Pass 2: Structure breaking
      const pass2 = await callAI(LOVABLE_API_KEY, `You are a structural editor. Break predictable flow. Vary sentence length aggressively — follow long with very short (2-5 words). Add small informal transitions: "Look,", "Here's the thing —", "And honestly,". Break any pattern where 3+ sentences follow the same rhythm. Start some sentences with "And" or "But". Use dashes for asides — like this. DO NOT change facts or meaning. Output ONLY the edited text.`, pass1);

      // Pass 3: Human noise
      const pass3 = await callAI(LOVABLE_API_KEY, `Add human texture. Ensure contractions appear naturally. Add slight imperfections: an occasional parenthetical thought, a rhetorical question, a sentence fragment for emphasis. Sprinkle in light personality: "I'd say", "probably", "honestly" — but sparingly. Add hedging where appropriate: "I think", "in my experience". 2-3 touches per paragraph max. PRESERVE all facts. Output ONLY the edited text.`, pass2);

      // Pass 4: Final polish
      const pass4 = await callAI(LOVABLE_API_KEY, `Final-pass editor. Remove any remaining AI-sounding phrases. Check meaning is preserved. Ensure smooth readability. Verify sentence variety exists. Remove repetitive words appearing too close together. Verify no sentence starts with the same word as the previous sentence. Output ONLY the final polished text.`, pass3);

      outputs.push(pass4);
    }

    return new Response(
      JSON.stringify({ output: outputs.join("\n\n") }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("humanize-text error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("Rate limit") ? 429 : msg.includes("credits") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Simulated backend calls. Replace with actual backend endpoints.
const API_DELAY = 1800;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface DetectionResult {
  ai_probability: number;
  human_probability: number;
  verdict: 'Likely AI' | 'Likely Human' | 'Mixed';
  reason: string;
}

export interface HumanizeResult {
  output: string;
}

export interface SimilarityResult {
  similarity: number;
  explanation: string;
}

export async function detectText(text: string): Promise<DetectionResult> {
  await wait(API_DELAY);
  // Simulated response
  const ai = Math.round(Math.random() * 100);
  const human = 100 - ai;
  const verdict = ai > 65 ? 'Likely AI' : ai < 35 ? 'Likely Human' : 'Mixed';
  return {
    ai_probability: ai,
    human_probability: human,
    verdict,
    reason:
      verdict === 'Likely AI'
        ? 'Text exhibits uniform sentence structures and predictable transitions typical of AI-generated content.'
        : verdict === 'Likely Human'
        ? 'Text shows natural variation in syntax, idiomatic expressions, and personal voice.'
        : 'Text contains a mix of natural and formulaic patterns, suggesting partial AI involvement.',
  };
}

export async function humanizeText(
  text: string,
  mode: string
): Promise<HumanizeResult> {
  await wait(API_DELAY);
  // Simulated rewrite
  return {
    output: text
      .split('. ')
      .map((s, i) =>
        i % 2 === 0
          ? s.replace(/\b(utilize|implement|facilitate)\b/gi, (m) =>
              m === 'utilize' ? 'use' : m === 'implement' ? 'set up' : 'help'
            )
          : s
      )
      .join('. '),
  };
}

export async function checkSimilarity(
  textA: string,
  textB: string
): Promise<SimilarityResult> {
  await wait(API_DELAY);
  const similarity = Math.round(Math.random() * 100);
  return {
    similarity,
    explanation:
      similarity > 60
        ? 'High overlap detected in vocabulary and sentence structure.'
        : 'Texts show distinct phrasing and structure with minimal overlap.',
  };
}

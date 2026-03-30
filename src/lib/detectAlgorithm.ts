// Deterministic AI detection using 6 weighted signals

const AI_PHRASES = [
  'furthermore', 'moreover', 'consequently', 'nevertheless', 'nonetheless',
  'additionally', 'subsequently', 'conversely', 'accordingly', 'in conclusion',
  'to summarize', 'in summary', 'all in all', 'last but not least',
  'first and foremost', 'to put it simply', 'in other words',
  'it is worth noting', 'it is important to note', 'it should be noted',
  'it is evident', 'it is clear', 'it is undeniable', 'without a doubt',
  'needless to say', 'it can be argued', 'it is crucial', 'it is vital',
  'it goes without saying', 'one must consider', 'that being said',
  'having said that', 'utilize', 'utilization', 'leverage', 'facilitate',
  'implementation', 'paradigm shift', 'holistic approach', 'synergy',
  'robust', 'scalable', 'cutting-edge', 'state-of-the-art', 'best practices',
  'multifaceted', 'groundbreaking', 'transformative', 'innovative', 'seamless',
  'streamline', 'optimize', 'empower', 'actionable', 'disruptive', 'ecosystem',
  'as a result', 'due to the fact', 'in order to', 'by leveraging',
  'on the other hand', 'in the realm of', "in today's world", 'in the modern era',
  'rapidly evolving', 'ever-changing landscape', 'plays a crucial role',
  'plays a vital role', 'plays an important role', 'is essential', 'is paramount',
  'is of utmost importance', 'has been shown', 'research has shown',
  'studies have shown', 'a wide range of', 'a variety of', 'a number of',
  'delve into', 'dive into', 'at its core', 'this ensures', 'this allows',
  'this enables', 'significant', 'significantly', 'substantially',
];

export interface SignalBreakdown {
  name: string;
  score: number;      // 0–1 raw signal score (higher = more AI-like)
  weight: number;     // percentage weight
  weighted: number;   // score * weight
  detail: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface LocalDetectionResult {
  aiScore: number;            // 0–99
  verdict: 'AI' | 'HUMAN' | 'MIXED';
  signals: SignalBreakdown[];
  foundPhrases: string[];     // AI phrases found in text
}

function getSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function getWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z']+/g) || [];
}

export function runDetection(text: string): LocalDetectionResult {
  const sentences = getSentences(text);
  const words = getWords(text);
  const lowerText = text.toLowerCase();
  const sentenceCount = Math.max(sentences.length, 1);
  const wordCount = Math.max(words.length, 1);

  // 1. BURSTINESS (25%)
  const sentLengths = sentences.map(s => (s.match(/\S+/g) || []).length);
  const mean = sentLengths.reduce((a, b) => a + b, 0) / Math.max(sentLengths.length, 1);
  const std = Math.sqrt(sentLengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / Math.max(sentLengths.length, 1));
  const burstinessRatio = mean > 0 ? std / mean : 0;
  // Below 0.3 = AI-like (score→1), above 0.7 = human (score→0)
  const burstScore = burstinessRatio <= 0.3 ? 1.0
    : burstinessRatio >= 0.7 ? 0.0
    : 1.0 - (burstinessRatio - 0.3) / 0.4;

  // 2. AI PHRASE DETECTION (30%)
  const foundPhrases: string[] = [];
  for (const phrase of AI_PHRASES) {
    if (lowerText.includes(phrase)) {
      foundPhrases.push(phrase);
    }
  }
  const phraseScore = Math.min(foundPhrases.length / 8, 1.0);

  // 3. LEXICAL DIVERSITY (15%)
  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / wordCount;
  // Below 0.5 = AI, above 0.75 = human. Use (1 - diversity)
  const lexicalScore = 1 - diversity;

  // 4. PASSIVE VOICE (10%)
  const passiveMatches = (text.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi) || []).length;
  const passiveRatio = passiveMatches / sentenceCount;
  const passiveScore = Math.min(passiveRatio / 0.4, 1.0);

  // 5. AVERAGE SENTENCE LENGTH (10%)
  const avgSentLen = wordCount / sentenceCount;
  const sentLenScore = avgSentLen > 22 ? 0.8 : avgSentLen >= 14 ? 0.5 : 0.2;

  // 6. AVERAGE WORD LENGTH (10%)
  const totalCharLen = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLen = totalCharLen / wordCount;
  const wordLenScore = avgWordLen > 5.5 ? 0.75 : avgWordLen >= 4.5 ? 0.5 : 0.2;

  // FINAL SCORE
  const raw = burstScore * 0.25 + phraseScore * 0.30 + lexicalScore * 0.15
    + passiveScore * 0.10 + sentLenScore * 0.10 + wordLenScore * 0.10;
  const aiScore = Math.min(Math.round(raw * 100), 99);

  const verdict: 'AI' | 'HUMAN' | 'MIXED' =
    aiScore >= 65 ? 'AI' : aiScore >= 35 ? 'MIXED' : 'HUMAN';

  const toSeverity = (s: number): 'HIGH' | 'MEDIUM' | 'LOW' =>
    s >= 0.65 ? 'HIGH' : s >= 0.35 ? 'MEDIUM' : 'LOW';

  const signals: SignalBreakdown[] = [
    {
      name: 'Burstiness',
      score: burstScore,
      weight: 25,
      weighted: burstScore * 0.25,
      detail: `Sentence length variation ratio: ${burstinessRatio.toFixed(2)} (std/mean). ${burstinessRatio < 0.3 ? 'Very uniform — typical of AI.' : burstinessRatio > 0.7 ? 'Highly varied — typical of humans.' : 'Moderate variation.'}`,
      severity: toSeverity(burstScore),
    },
    {
      name: 'AI Phrases',
      score: phraseScore,
      weight: 30,
      weighted: phraseScore * 0.30,
      detail: `Found ${foundPhrases.length} AI-typical phrase${foundPhrases.length !== 1 ? 's' : ''} out of 80+ checked.`,
      severity: toSeverity(phraseScore),
    },
    {
      name: 'Lexical Diversity',
      score: lexicalScore,
      weight: 15,
      weighted: lexicalScore * 0.15,
      detail: `${uniqueWords.size} unique / ${wordCount} total words (${(diversity * 100).toFixed(0)}% diversity). ${diversity < 0.5 ? 'Low diversity — AI-like.' : diversity > 0.75 ? 'Rich vocabulary — human-like.' : 'Moderate diversity.'}`,
      severity: toSeverity(lexicalScore),
    },
    {
      name: 'Passive Voice',
      score: passiveScore,
      weight: 10,
      weighted: passiveScore * 0.10,
      detail: `${passiveMatches} passive construction${passiveMatches !== 1 ? 's' : ''} across ${sentenceCount} sentences (ratio: ${passiveRatio.toFixed(2)}).`,
      severity: toSeverity(passiveScore),
    },
    {
      name: 'Sentence Length',
      score: sentLenScore,
      weight: 10,
      weighted: sentLenScore * 0.10,
      detail: `Average ${avgSentLen.toFixed(1)} words/sentence. ${avgSentLen > 22 ? 'Long and uniform — AI pattern.' : avgSentLen < 14 ? 'Short and punchy — human pattern.' : 'Medium length.'}`,
      severity: toSeverity(sentLenScore),
    },
    {
      name: 'Word Length',
      score: wordLenScore,
      weight: 10,
      weighted: wordLenScore * 0.10,
      detail: `Average ${avgWordLen.toFixed(1)} chars/word. ${avgWordLen > 5.5 ? 'Complex vocabulary — AI tendency.' : avgWordLen < 4.5 ? 'Simple words — human tendency.' : 'Moderate complexity.'}`,
      severity: toSeverity(wordLenScore),
    },
  ];

  return { aiScore, verdict, signals, foundPhrases };
}

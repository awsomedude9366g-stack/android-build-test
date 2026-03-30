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
  // FIX 5 — extra AI phrases
  'artificial intelligence', 'machine learning', 'neural network',
  'natural language', 'large language model', 'it is increasingly',
  'plays a significant', 'it is widely', 'in recent years',
  'over the past', 'has the potential', 'in the context of',
  'it is possible', 'with the advent', 'has emerged as',
  'continues to', 'it remains', 'across various', 'across a wide',
  'in various industries', 'in numerous', 'it is becoming',
  'the ability to', 'the importance of', 'the role of',
  'the impact of', 'the need for', 'the use of',
  'the development of', 'the implementation of',
  'the advancement of', 'the integration of',
  'has revolutionized', 'are revolutionizing',
  "in today's", 'in the digital age', 'going forward',
  'moving forward', 'looking ahead', 'in the future',
  'it is essential to', 'it is necessary to',
  'one of the most', 'some of the most',
  'among the most', 'of the highest',
  'the fact that', 'in the sense that',
  'can be seen as', 'is often seen as',
  'is generally considered', 'is widely regarded',
  'it is generally', 'it is often',
];

export interface SignalBreakdown {
  name: string;
  score: number;
  weight: number;
  weighted: number;
  detail: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export type Verdict = 'HUMAN' | 'LIKELY_HUMAN' | 'MIXED' | 'LIKELY_AI' | 'AI';

export interface LocalDetectionResult {
  aiScore: number;
  verdict: Verdict;
  signals: SignalBreakdown[];
  foundPhrases: string[];
}

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
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

  // 1. BURSTINESS (20%) — FIX 2
  const sentLengths = sentences.map(s => (s.match(/\S+/g) || []).length);
  const mean = sentLengths.reduce((a, b) => a + b, 0) / Math.max(sentLengths.length, 1);
  const std = Math.sqrt(sentLengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / Math.max(sentLengths.length, 1));
  const burstinessRatio = mean > 0 ? std / mean : 0;
  const burstScore = burstinessRatio < 0.40 ? 0.90
    : burstinessRatio < 0.60 ? 0.60
    : 0.20;

  // 2. AI PHRASE DETECTION (40%) — FIX 1
  const foundPhrases: string[] = [];
  for (const phrase of AI_PHRASES) {
    if (lowerText.includes(phrase)) {
      foundPhrases.push(phrase);
    }
  }
  const phraseScore = Math.min(foundPhrases.length / 5, 1.0);

  // 3. LEXICAL DIVERSITY (20%) — FIX 3
  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / wordCount;
  const lexicalScore = diversity < 0.60 ? 1.0 - diversity : 1.0 - diversity;

  // 4. PASSIVE VOICE (5%)
  const passiveMatches = (text.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi) || []).length;
  const passiveRatio = passiveMatches / sentenceCount;
  const passiveScore = Math.min(passiveRatio / 0.4, 1.0);

  // 5. AVERAGE SENTENCE LENGTH (8%)
  const avgSentLen = wordCount / sentenceCount;
  const sentLenScore = avgSentLen > 22 ? 0.8 : avgSentLen >= 14 ? 0.5 : 0.2;

  // 6. AVERAGE WORD LENGTH (7%)
  const totalCharLen = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLen = totalCharLen / wordCount;
  const wordLenScore = avgWordLen > 5.5 ? 0.75 : avgWordLen >= 4.5 ? 0.5 : 0.2;

  // FIX 6 — recalibrated weights
  const raw = phraseScore * 0.40 + burstScore * 0.20 + lexicalScore * 0.20
    + sentLenScore * 0.08 + wordLenScore * 0.07 + passiveScore * 0.05;
  let aiScore = Math.min(Math.round(raw * 100), 99);

  // FIX 4 — minimum score floors
  if (foundPhrases.length >= 10) aiScore = Math.max(aiScore, 92);
  else if (foundPhrases.length >= 8) aiScore = Math.max(aiScore, 85);
  else if (foundPhrases.length >= 5) aiScore = Math.max(aiScore, 75);

  aiScore = Math.min(aiScore, 99);

  // FIX 7 — verdict bands
  const verdict: Verdict =
    aiScore >= 90 ? 'AI'
    : aiScore >= 75 ? 'LIKELY_AI'
    : aiScore >= 56 ? 'MIXED'
    : aiScore >= 31 ? 'LIKELY_HUMAN'
    : 'HUMAN';

  const toSeverity = (s: number): 'HIGH' | 'MEDIUM' | 'LOW' =>
    s >= 0.65 ? 'HIGH' : s >= 0.35 ? 'MEDIUM' : 'LOW';

  const signals: SignalBreakdown[] = [
    {
      name: 'AI Phrases',
      score: phraseScore, weight: 40, weighted: phraseScore * 0.40,
      detail: `Found ${foundPhrases.length} AI-typical phrase${foundPhrases.length !== 1 ? 's' : ''} out of ${AI_PHRASES.length} checked.`,
      severity: toSeverity(phraseScore),
    },
    {
      name: 'Burstiness',
      score: burstScore, weight: 20, weighted: burstScore * 0.20,
      detail: `Sentence length variation: ${burstinessRatio.toFixed(2)} (std/mean). ${burstinessRatio < 0.40 ? 'Very uniform — typical of AI.' : burstinessRatio < 0.60 ? 'Moderate variation.' : 'Highly varied — typical of humans.'}`,
      severity: toSeverity(burstScore),
    },
    {
      name: 'Lexical Diversity',
      score: lexicalScore, weight: 20, weighted: lexicalScore * 0.20,
      detail: `${uniqueWords.size} unique / ${wordCount} total words (${(diversity * 100).toFixed(0)}% diversity). ${diversity < 0.50 ? 'Low diversity — AI-like.' : diversity < 0.60 ? 'Below average — likely AI.' : diversity > 0.75 ? 'Rich vocabulary — human-like.' : 'Moderate diversity.'}`,
      severity: toSeverity(lexicalScore),
    },
    {
      name: 'Sentence Length',
      score: sentLenScore, weight: 8, weighted: sentLenScore * 0.08,
      detail: `Average ${avgSentLen.toFixed(1)} words/sentence. ${avgSentLen > 22 ? 'Long and uniform — AI pattern.' : avgSentLen < 14 ? 'Short and punchy — human pattern.' : 'Medium length.'}`,
      severity: toSeverity(sentLenScore),
    },
    {
      name: 'Word Length',
      score: wordLenScore, weight: 7, weighted: wordLenScore * 0.07,
      detail: `Average ${avgWordLen.toFixed(1)} chars/word. ${avgWordLen > 5.5 ? 'Complex vocabulary — AI tendency.' : avgWordLen < 4.5 ? 'Simple words — human tendency.' : 'Moderate complexity.'}`,
      severity: toSeverity(wordLenScore),
    },
    {
      name: 'Passive Voice',
      score: passiveScore, weight: 5, weighted: passiveScore * 0.05,
      detail: `${passiveMatches} passive construction${passiveMatches !== 1 ? 's' : ''} across ${sentenceCount} sentences (ratio: ${passiveRatio.toFixed(2)}).`,
      severity: toSeverity(passiveScore),
    },
  ];

  return { aiScore, verdict, signals, foundPhrases };
}

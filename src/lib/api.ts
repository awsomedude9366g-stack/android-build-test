import { supabase } from '@/integrations/supabase/client';

export interface SentenceAnalysis {
  text: string;
  label: 'AI' | 'HUMAN';
  reason: string;
}

export interface DetectionSignal {
  icon: string;
  signal: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DetectionResult {
  verdict: 'AI' | 'HUMAN' | 'MIXED';
  ai_probability: number;
  human_probability: number;
  confidence: number;
  perplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  burstiness: 'LOW' | 'MEDIUM' | 'HIGH';
  vocab_richness: 'LOW' | 'MEDIUM' | 'HIGH';
  sentence_analysis: SentenceAnalysis[];
  top_signals: DetectionSignal[];
  forensic_analysis: string;
  recommendations: string[];
}

export interface HumanizeResult {
  output: string;
}

export interface MatchingSegment {
  from_A: string;
  from_B: string;
  type: 'exact' | 'paraphrase' | 'concept';
}

export interface SimilarityResult {
  semantic_similarity: number;
  structural_similarity: number;
  idea_overlap: number;
  plagiarism_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  is_paraphrase: boolean;
  paraphrase_confidence: number;
  shared_ideas: string[];
  unique_to_A: string[];
  unique_to_B: string[];
  matching_segments: MatchingSegment[];
  verdict: string;
  risk_explanation: string;
  advice: string;
}

export async function detectText(text: string): Promise<DetectionResult> {
  const { data, error } = await supabase.functions.invoke('detect-text', {
    body: { text },
  });
  if (error) throw new Error(error.message || 'Detection failed');
  if (data.error) throw new Error(data.error);
  return data;
}

export async function humanizeText(text: string, mode: string, intensity: string): Promise<HumanizeResult> {
  const { data, error } = await supabase.functions.invoke('humanize-text', {
    body: { text, mode, intensity },
  });
  if (error) throw new Error(error.message || 'Humanization failed');
  if (data.error) throw new Error(data.error);
  return data;
}

export async function checkSimilarity(textA: string, textB: string): Promise<SimilarityResult> {
  const { data, error } = await supabase.functions.invoke('check-similarity', {
    body: { textA, textB },
  });
  if (error) throw new Error(error.message || 'Similarity check failed');
  if (data.error) throw new Error(data.error);
  return data;
}

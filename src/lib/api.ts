import { supabase } from '@/integrations/supabase/client';

export interface DetectionResult {
  ai_probability: number;
  human_probability: number;
  verdict: 'Likely AI' | 'Likely Human' | 'Mixed Content';
  reason: string;
}

export interface HumanizeResult {
  output: string;
}

export interface MatchingSegment {
  text_from_A: string;
  text_from_B: string;
}

export interface SimilarityResult {
  similarity: number;
  matching_segments?: MatchingSegment[];
  verdict?: string;
  explanation: string;
}

export async function detectText(text: string): Promise<DetectionResult> {
  const { data, error } = await supabase.functions.invoke('detect-text', {
    body: { text },
  });
  if (error) throw new Error(error.message || 'Detection failed');
  if (data.error) throw new Error(data.error);
  return data;
}

export async function humanizeText(text: string, mode: string): Promise<HumanizeResult> {
  const { data, error } = await supabase.functions.invoke('humanize-text', {
    body: { text, mode },
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

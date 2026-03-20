import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { checkSimilarity, SimilarityResult } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const MAX_CHARS = 5000;

export default function SimilarityPage() {
  const navigate = useNavigate();
  const addHistory = useAppStore((s) => s.addHistory);
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimilarityResult | null>(null);

  const handleCheck = async () => {
    if (!textA.trim() || !textB.trim() || loading) return;
    setResult(null);
    setLoading(true);
    try {
      const res = await checkSimilarity(textA.slice(0, MAX_CHARS), textB.slice(0, MAX_CHARS));
      setResult(res);
      addHistory({ type: 'similarity', input: textA.slice(0, 100), inputB: textB.slice(0, 100), result: res });
    } catch (err: any) {
      toast.error(err?.message || 'Similarity check failed.');
    } finally {
      setLoading(false);
    }
  };

  const simColor =
    result && result.similarity > 60
      ? 'text-destructive'
      : result && result.similarity > 30
      ? 'text-warning'
      : 'text-success';

  const confidenceBadgeColor =
    result?.confidence === 'High'
      ? 'bg-success/10 text-success'
      : result?.confidence === 'Medium'
      ? 'bg-warning/10 text-warning'
      : 'bg-muted text-muted-foreground';

  return (
    <div className="min-h-svh pb-20 px-4 pt-4">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="font-display text-lg text-foreground mb-4">Similarity Checker</h1>

      <label className="text-xs font-medium text-muted-foreground mb-1 block">Text A</label>
      <textarea
        value={textA}
        onChange={(e) => setTextA(e.target.value)}
        placeholder="Paste first text…"
        className="w-full min-h-[120px] p-4 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none resize-none transition-colors mb-3"
        maxLength={MAX_CHARS}
      />

      <label className="text-xs font-medium text-muted-foreground mb-1 block">Text B</label>
      <textarea
        value={textB}
        onChange={(e) => setTextB(e.target.value)}
        placeholder="Paste second text…"
        className="w-full min-h-[120px] p-4 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none resize-none transition-colors mb-4"
        maxLength={MAX_CHARS}
      />

      <button
        onClick={handleCheck}
        disabled={!textA.trim() || !textB.trim() || loading}
        className="h-12 w-full bg-primary text-primary-foreground rounded-xl font-medium active:scale-[0.97] transition-transform disabled:opacity-40"
      >
        {loading ? 'Comparing semantic patterns…' : 'Check Similarity'}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-card border border-border rounded-xl p-4 shadow-resting space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Similarity Score</h2>
              {result.confidence && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${confidenceBadgeColor}`}>
                  {result.confidence} confidence
                </span>
              )}
            </div>
            <div className={`text-4xl font-display text-center ${simColor}`}>{result.similarity}%</div>
            {result.verdict && (
              <div className="text-center text-xs font-medium text-muted-foreground">{result.verdict}</div>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed">{result.explanation}</p>

            {/* Matching segments */}
            {result.matching_segments && result.matching_segments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <h3 className="text-[11px] font-semibold text-foreground">Matching Segments</h3>
                {result.matching_segments.slice(0, 5).map((seg, i) => (
                  <div key={i} className="bg-secondary rounded-lg p-2.5 space-y-1">
                    <p className="text-[10px] text-muted-foreground">
                      <span className="font-medium text-foreground">A:</span> "{seg.text_from_A}"
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      <span className="font-medium text-foreground">B:</span> "{seg.text_from_B}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

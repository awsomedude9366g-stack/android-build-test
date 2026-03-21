import { useState } from 'react';
import { ArrowLeft, Columns2 } from 'lucide-react';
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
  const [sideBySide, setSideBySide] = useState(false);

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

  const simBarColor =
    result && result.similarity > 60
      ? 'bg-destructive'
      : result && result.similarity > 30
      ? 'bg-warning'
      : 'bg-success';

  const confidenceBadgeColor =
    result?.confidence === 'High'
      ? 'bg-success/10 text-success'
      : result?.confidence === 'Medium'
      ? 'bg-warning/10 text-warning'
      : 'bg-secondary text-muted-foreground';

  return (
    <div className="min-h-svh pb-24 px-5 pt-6">
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-muted-foreground text-sm mb-6 active:scale-[0.97] transition-transform"
      >
        <ArrowLeft size={16} strokeWidth={1.8} /> Back
      </motion.button>

      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="font-display text-xl text-foreground mb-5 tracking-tight"
      >
        Similarity Checker
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <label className="text-[10px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Text A</label>
        <textarea
          value={textA}
          onChange={(e) => setTextA(e.target.value)}
          placeholder="Paste first text…"
          className="w-full min-h-[120px] p-4 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:shadow-glow outline-none resize-none transition-all duration-300 mb-4"
          maxLength={MAX_CHARS}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <label className="text-[10px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Text B</label>
        <textarea
          value={textB}
          onChange={(e) => setTextB(e.target.value)}
          placeholder="Paste second text…"
          className="w-full min-h-[120px] p-4 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:shadow-glow outline-none resize-none transition-all duration-300 mb-5"
          maxLength={MAX_CHARS}
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleCheck}
        disabled={!textA.trim() || !textB.trim() || loading}
        className="w-full bg-primary text-primary-foreground rounded-2xl font-semibold text-sm tracking-tight disabled:opacity-30 transition-all duration-200 hover:shadow-glow"
        style={{ height: '52px' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Comparing…
          </span>
        ) : 'Check Similarity'}
      </motion.button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 bg-card border border-border rounded-2xl p-5 shadow-resting space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">Similarity Score</h2>
              {result.confidence && (
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${confidenceBadgeColor}`}>
                  {result.confidence}
                </span>
              )}
            </div>

            {/* Big score */}
            <div className={`text-5xl font-mono font-bold text-center py-2 ${simColor}`}>
              {result.similarity}%
            </div>

            {/* Bar */}
            <div className="space-y-1.5">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.similarity}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full ${simBarColor}`}
                />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground/50 font-mono">
                <span>Unique</span>
                <span>Identical</span>
              </div>
            </div>

            {result.verdict && (
              <div className="text-center text-xs font-semibold text-muted-foreground">{result.verdict}</div>
            )}

            {/* Score breakdown */}
            {/* Confidence */}
            {result.confidence && (
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Confidence</div>
                <div className="text-base font-mono font-bold text-foreground mt-1">{result.confidence}</div>
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">{result.explanation}</p>

            {/* Matching segments */}
            {result.matching_segments && result.matching_segments.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold text-foreground">Matched Segments</h3>
                  <button
                    onClick={() => setSideBySide(!sideBySide)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-primary active:scale-[0.97] transition-transform"
                  >
                    <Columns2 size={12} strokeWidth={2} />
                    {sideBySide ? 'Stack' : 'Side by side'}
                  </button>
                </div>

                {result.matching_segments.slice(0, 5).map((seg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`bg-secondary/40 rounded-xl p-3 ${sideBySide ? 'grid grid-cols-2 gap-3' : 'space-y-2'}`}
                  >
                    <div className="text-[10px]">
                      <span className="inline-block font-bold text-primary text-[9px] uppercase tracking-wider mb-1">A</span>
                      <p className="text-foreground/80 leading-relaxed bg-primary/5 rounded-lg px-2.5 py-1.5 border-l-2 border-primary">
                        {seg.text_from_A}
                      </p>
                    </div>
                    <div className="text-[10px]">
                      <span className="inline-block font-bold text-warning text-[9px] uppercase tracking-wider mb-1">B</span>
                      <p className="text-foreground/80 leading-relaxed bg-warning/5 rounded-lg px-2.5 py-1.5 border-l-2 border-warning">
                        {seg.text_from_B}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

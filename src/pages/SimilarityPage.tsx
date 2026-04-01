import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, ClipboardPaste, ArrowLeftRight } from 'lucide-react';
import { checkSimilarity, SimilarityResult } from '@/lib/api';
import { toast } from 'sonner';

const MAX_CHARS = 5000;

interface SimilarityPageProps {
  onBack: () => void;
}

export default function SimilarityPage({ onBack }: SimilarityPageProps) {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(SimilarityResult & { overall_score?: number }) | null>(null);

  const wordCountA = textA.trim() ? textA.trim().split(/\s+/).length : 0;
  const wordCountB = textB.trim() ? textB.trim().split(/\s+/).length : 0;

  const handleCheck = async () => {
    if (!textA.trim() || !textB.trim() || loading) return;
    setResult(null);
    setLoading(true);
    try {
      const res = await checkSimilarity(textA.slice(0, MAX_CHARS), textB.slice(0, MAX_CHARS));
      setResult(res);
    } catch (err: any) {
      toast.error(err?.message || 'Similarity check failed.');
    } finally {
      setLoading(false);
    }
  };

  const swapTexts = () => {
    const a = textA;
    setTextA(textB);
    setTextB(a);
  };

  const safeNum = (v: unknown): number => {
    const n = Number(v);
    return isNaN(n) ? 0 : Math.min(100, Math.max(0, Math.round(n)));
  };

  const overallScore = result
    ? safeNum((result as any).overall_score ?? Math.round((safeNum(result.semantic_similarity) + safeNum(result.structural_similarity) + safeNum(result.idea_overlap)) / 3))
    : 0;

  const scoreColor = overallScore <= 30 ? '#34D399' : overallScore <= 60 ? '#FBBF24' : '#F87171';

  const riskColor = (risk: string) => {
    const r = risk?.toUpperCase();
    return r === 'HIGH' ? { bg: 'rgba(248,113,113,0.15)', color: '#F87171' } :
      r === 'MEDIUM' ? { bg: 'rgba(251,191,36,0.15)', color: '#FBBF24' } :
      { bg: 'rgba(52,211,153,0.15)', color: '#34D399' };
  };

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="min-h-svh px-6 pt-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-card transition-colors">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-display text-lg text-foreground">Similarity Checker</h1>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #059669, #34D399)' }}>📊 Compare</span>
      </div>

      {/* Text A */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Text A</span>
          <span className="text-[10px] font-mono text-muted-foreground">{wordCountA}w</span>
        </div>
        <div className="bg-card rounded-2xl shadow-card overflow-hidden" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="Paste first text…"
            className="w-full min-h-[140px] p-5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
            maxLength={MAX_CHARS}
          />
          <div className="flex justify-end gap-2 px-4 py-2 border-t" style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}>
            <button onClick={() => setTextA('')} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-3 py-1 rounded-full" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <Trash2 size={11} /> Clear
            </button>
            <button onClick={async () => setTextA(await navigator.clipboard.readText())} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-3 py-1 rounded-full" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <ClipboardPaste size={11} /> Paste
            </button>
          </div>
        </div>
      </div>

      {/* VS Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }} />
        <button onClick={swapTexts} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeftRight size={14} /> VS
        </button>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }} />
      </div>

      {/* Text B */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Text B</span>
          <span className="text-[10px] font-mono text-muted-foreground">{wordCountB}w</span>
        </div>
        <div className="bg-card rounded-2xl shadow-card overflow-hidden" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="Paste second text…"
            className="w-full min-h-[140px] p-5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
            maxLength={MAX_CHARS}
          />
          <div className="flex justify-end gap-2 px-4 py-2 border-t" style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}>
            <button onClick={() => setTextB('')} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-3 py-1 rounded-full" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <Trash2 size={11} /> Clear
            </button>
            <button onClick={async () => setTextB(await navigator.clipboard.readText())} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-3 py-1 rounded-full" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <ClipboardPaste size={11} /> Paste
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-8 flex flex-col items-center py-12">
          <div className="w-10 h-10 rounded-full border-3 border-primary/30 border-t-primary animate-spin mb-4" />
          <span className="text-sm text-muted-foreground">Calculating similarity...</span>
          <div className="mt-6 w-full grid grid-cols-2 gap-3">
            <div className="h-20 rounded-2xl animate-shimmer" />
            <div className="h-20 rounded-2xl animate-shimmer" />
          </div>
        </div>
      )}

      {/* Action Button */}
      {!loading && !result && (
        <motion.button
          onClick={handleCheck}
          disabled={!textA.trim() || !textB.trim()}
          className="w-full mt-6 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-30 shadow-card"
          style={{ background: 'linear-gradient(135deg, #059669, #34D399)' }}
          whileTap={{ scale: 0.97 }}
        >
          📊 Check Similarity
        </motion.button>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 space-y-4"
          >
            {/* Score Circle + Bars */}
            <div className="bg-card rounded-2xl p-6 shadow-card flex flex-col sm:flex-row items-center gap-6" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div className="relative w-36 h-36 flex-shrink-0">
                <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="8" />
                  <motion.circle
                    cx="64" cy="64" r={radius} fill="none"
                    stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-mono font-bold" style={{ color: scoreColor }}>{overallScore}%</span>
                  <span className="text-[10px] text-muted-foreground">Overall</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-3">
                {[
                  { label: 'Semantic', value: safeNum(result.semantic_similarity) },
                  { label: 'Structural', value: safeNum(result.structural_similarity) },
                  { label: 'Idea Overlap', value: safeNum(result.idea_overlap) },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">{bar.label}</span>
                      <span className="font-mono font-semibold text-foreground">{bar.value}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.value}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verdict + Risk */}
            <div className="bg-card rounded-2xl p-4 shadow-card flex items-center justify-between flex-wrap gap-3" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <p className="text-xs text-foreground font-medium">{result.verdict}</p>
              <span
                className="text-[10px] font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: riskColor(result.plagiarism_risk).bg, color: riskColor(result.plagiarism_risk).color }}
              >
                Plagiarism Risk: {result.plagiarism_risk === 'HIGH' ? 'High' : result.plagiarism_risk === 'MEDIUM' ? 'Medium' : 'Low'}
              </span>
            </div>

            {/* Matching Segments Table */}
            {(result.matching_segments?.length ?? 0) > 0 && (
              <div className="bg-card rounded-2xl shadow-card overflow-hidden" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                  <h3 className="text-xs font-bold text-foreground">Matching Segments</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                        <th className="text-left px-4 py-2.5 font-semibold text-primary">From Text A</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-primary">From Text B</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-primary">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.matching_segments.map((seg, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-secondary/30' : ''} style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                          <td className="px-4 py-2.5 text-foreground">{seg.from_A || '—'}</td>
                          <td className="px-4 py-2.5 text-foreground">{seg.from_B || '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{
                              backgroundColor: seg.type === 'exact' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
                              color: seg.type === 'exact' ? '#F87171' : '#FBBF24',
                            }}>
                              {seg.type === 'exact' ? 'Exact Match' : seg.type === 'paraphrase' ? 'Paraphrase' : seg.type || 'Concept'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Advice */}
            {result.advice && (
              <div className="flex gap-3 items-start pl-3 py-2 bg-primary/5 rounded-xl" style={{ borderLeft: '3px solid #8B5CF6' }}>
                <span className="text-sm">💡</span>
                <p className="text-xs text-foreground leading-relaxed">{result.advice}</p>
              </div>
            )}

            <motion.button
              onClick={() => { setResult(null); setTextA(''); setTextB(''); }}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white shadow-card"
              style={{ background: 'linear-gradient(135deg, #059669, #34D399)' }}
              whileTap={{ scale: 0.97 }}
            >
              📊 Compare Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

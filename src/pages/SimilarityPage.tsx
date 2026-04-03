import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, ClipboardPaste, ArrowLeftRight } from 'lucide-react';
import { checkSimilarity, SimilarityResult } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const MAX_CHARS = 5000;

interface SimilarityPageProps {
  onBack: () => void;
}

export default function SimilarityPage({ onBack }: SimilarityPageProps) {
  const textA = useAppStore((s) => s.similarityTextA);
  const setTextA = useAppStore((s) => s.setSimilarityTextA);
  const textB = useAppStore((s) => s.similarityTextB);
  const setTextB = useAppStore((s) => s.setSimilarityTextB);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(SimilarityResult & { overall_score?: number }) | null>(null);

  const wordCountA = textA.trim() ? textA.trim().split(/\s+/).length : 0;
  const wordCountB = textB.trim() ? textB.trim().split(/\s+/).length : 0;

  const handleCheck = async () => {
    if (!textA.trim() || !textB.trim() || loading) return;
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

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="flex flex-col" style={{ height: '100%', overflow: 'hidden' }}>
      <div className="flex items-center justify-between shrink-0" style={{ height: 52, padding: '0 12px' }}>
        <button onClick={onBack} className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12 }}>
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-display text-base text-foreground">Similarity Checker</h1>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full text-primary-foreground gradient-green-btn">📊 Compare</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden inner-body" style={{ padding: '12px 12px 8px', WebkitOverflowScrolling: 'touch' }}>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Text A</span>
            <span className="text-[10px] font-mono text-muted-foreground">{wordCountA}w</span>
          </div>
          <div className="bg-card rounded-2xl shadow-card overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
            <textarea value={textA} onChange={(e) => setTextA(e.target.value)} placeholder="Paste first text…"
              className="w-full p-3 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
              style={{ minHeight: 90, maxHeight: '25vh', fontSize: 16, boxSizing: 'border-box' }} maxLength={MAX_CHARS} />
            <div className="flex justify-end gap-1.5 px-3 py-1.5 border-t border-border">
              <button onClick={() => { setTextA(''); }} className="flex items-center gap-1 text-[11px] text-muted-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid hsl(var(--border))', whiteSpace: 'nowrap' }}>
                <Trash2 size={11} /> Clear
              </button>
              <button onClick={async () => setTextA(await navigator.clipboard.readText())} className="flex items-center gap-1 text-[11px] text-muted-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid hsl(var(--border))', whiteSpace: 'nowrap' }}>
                <ClipboardPaste size={11} /> Paste
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3" style={{ margin: '6px 0' }}>
          <div className="flex-1 h-px bg-border" />
          <button onClick={swapTexts} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ArrowLeftRight size={12} /> VS
          </button>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Text B</span>
            <span className="text-[10px] font-mono text-muted-foreground">{wordCountB}w</span>
          </div>
          <div className="bg-card rounded-2xl shadow-card overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
            <textarea value={textB} onChange={(e) => setTextB(e.target.value)} placeholder="Paste second text…"
              className="w-full p-3 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
              style={{ minHeight: 90, maxHeight: '25vh', fontSize: 16, boxSizing: 'border-box' }} maxLength={MAX_CHARS} />
            <div className="flex justify-end gap-1.5 px-3 py-1.5 border-t border-border">
              <button onClick={() => { setTextB(''); }} className="flex items-center gap-1 text-[11px] text-muted-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid hsl(var(--border))', whiteSpace: 'nowrap' }}>
                <Trash2 size={11} /> Clear
              </button>
              <button onClick={async () => setTextB(await navigator.clipboard.readText())} className="flex items-center gap-1 text-[11px] text-muted-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid hsl(var(--border))', whiteSpace: 'nowrap' }}>
                <ClipboardPaste size={11} /> Paste
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 flex flex-col items-center py-8">
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-3" />
            <span className="text-sm text-muted-foreground">Calculating similarity...</span>
          </div>
        )}

        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-4 space-y-3">
              <div className="bg-card rounded-2xl p-4 shadow-card" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="6" />
                      <motion.circle cx="50" cy="50" r={radius} fill="none" stroke={scoreColor} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-mono font-bold" style={{ color: scoreColor }}>{overallScore}%</span>
                      <span className="text-[9px] text-muted-foreground">Overall</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    {[
                      { label: 'Semantic', value: safeNum(result.semantic_similarity) },
                      { label: 'Structural', value: safeNum(result.structural_similarity) },
                      { label: 'Idea Overlap', value: safeNum(result.idea_overlap) },
                    ].map((bar) => (
                      <div key={bar.label}>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-muted-foreground">{bar.label}</span>
                          <span className="font-mono font-semibold text-foreground">{bar.value}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-secondary">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${bar.value}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-3 shadow-card flex items-center justify-between flex-wrap gap-2" style={{ border: '1px solid hsl(var(--border))' }}>
                <p className="text-xs text-foreground font-medium">{result.verdict}</p>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: riskColor(result.plagiarism_risk).bg, color: riskColor(result.plagiarism_risk).color }}>
                  Risk: {result.plagiarism_risk === 'HIGH' ? 'High' : result.plagiarism_risk === 'MEDIUM' ? 'Medium' : 'Low'}
                </span>
              </div>

              {(result.matching_segments?.length ?? 0) > 0 && (
                <div className="bg-card rounded-xl shadow-card overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                  <div className="px-3 py-2 border-b border-border">
                    <h3 className="text-[11px] font-bold text-foreground">Matching Segments</h3>
                  </div>
                  <div className="overflow-x-hidden">
                    <table className="w-full text-[10px]" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="bg-primary/10">
                          <th className="text-left px-2.5 py-2 font-semibold text-primary" style={{ width: '38%' }}>Text A</th>
                          <th className="text-left px-2.5 py-2 font-semibold text-primary" style={{ width: '38%' }}>Text B</th>
                          <th className="text-left px-2.5 py-2 font-semibold text-primary" style={{ width: '24%' }}>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.matching_segments.map((seg, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-secondary/30' : ''} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                            <td className="px-2.5 py-2 text-foreground" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.from_A || '—'}</td>
                            <td className="px-2.5 py-2 text-foreground" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.from_B || '—'}</td>
                            <td className="px-2.5 py-2">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{
                                backgroundColor: seg.type === 'exact' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
                                color: seg.type === 'exact' ? '#F87171' : '#FBBF24',
                              }}>{seg.type === 'exact' ? 'Exact' : 'Para.'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.advice && (
                <div className="flex gap-2 items-start pl-3 py-2 bg-primary/5 rounded-xl" style={{ borderLeft: '3px solid hsl(var(--primary))' }}>
                  <span className="text-sm">💡</span>
                  <p className="text-[11px] text-foreground leading-relaxed">{result.advice}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 inner-footer" style={{ height: 68, padding: '10px 12px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <motion.button
          onClick={handleCheck}
          disabled={!textA.trim() || !textB.trim() || loading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-30 shadow-card gradient-green-btn"
          whileTap={{ scale: 0.97 }}
        >
          {loading ? 'Processing...' : '📊 Check Similarity'}
        </motion.button>
      </div>
    </div>
  );
}

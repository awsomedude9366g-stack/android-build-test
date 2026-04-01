import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkSimilarity, SimilarityResult } from '@/lib/api';
import { toast } from 'sonner';

const MAX_CHARS = 5000;

export default function SimilarityPage() {
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

  const safeNum = (v: unknown): number => {
    const n = Number(v);
    return isNaN(n) ? 0 : Math.min(100, Math.max(0, Math.round(n)));
  };

  const overallScore = result
    ? safeNum((result as any).overall_score ?? Math.round((safeNum(result.semantic_similarity) + safeNum(result.structural_similarity) + safeNum(result.idea_overlap)) / 3))
    : 0;

  const scoreColor =
    overallScore <= 30 ? 'hsl(var(--success))' :
    overallScore <= 60 ? 'hsl(var(--warning))' :
    'hsl(var(--destructive))';

  const riskColor = (risk: string) => {
    const r = risk?.toUpperCase();
    return r === 'HIGH' ? 'bg-destructive/10 text-destructive' : r === 'MEDIUM' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success';
  };

  const typeLabel = (type: string) => {
    if (type === 'exact') return 'Exact Match';
    if (type === 'paraphrase') return 'Paraphrase';
    return type || 'Concept';
  };

  const typeColor = (type: string) =>
    type === 'exact' ? 'bg-destructive/10 text-destructive' : type === 'paraphrase' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary';

  // SVG gauge
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div>
      {/* Two Column Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold text-foreground">Text A</span>
            <span className="text-[11px] font-mono text-muted-foreground">{wordCountA}w</span>
          </div>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="Paste first text…"
            className="w-full min-h-[180px] p-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
            maxLength={MAX_CHARS}
          />
        </div>
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold text-foreground">Text B</span>
            <span className="text-[11px] font-mono text-muted-foreground">{wordCountB}w</span>
          </div>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="Paste second text…"
            className="w-full min-h-[180px] p-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
            maxLength={MAX_CHARS}
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-3 mt-4">
        {(textA || textB) && (
          <button
            onClick={() => { setTextA(''); setTextB(''); setResult(null); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Clear All
          </button>
        )}
        <button
          onClick={handleCheck}
          disabled={!textA.trim() || !textB.trim() || loading}
          className="bg-primary text-primary-foreground text-xs font-semibold px-5 py-2 rounded-lg disabled:opacity-30 transition-all hover:-translate-y-px hover:shadow-card-hover active:translate-y-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Comparing…
            </span>
          ) : '⇄ Compare'}
        </button>
      </div>

      {/* Loading State */}
      {loading && !result && (
        <div className="mt-6 flex flex-col items-center justify-center py-12">
          <span className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
          <span className="text-xs text-muted-foreground">Analyzing similarity…</span>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 space-y-4"
          >
            {/* Score Display */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-card flex flex-col sm:flex-row items-center gap-6">
              {/* SVG Circle */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
                  <motion.circle
                    cx="60" cy="60" r={radius} fill="none"
                    stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-mono font-bold" style={{ color: scoreColor }}>{overallScore}%</span>
                  <span className="text-[10px] text-muted-foreground">Overall</span>
                </div>
              </div>

              {/* Breakdown Bars */}
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
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.value}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-card space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${riskColor(result.plagiarism_risk)}`}>
                  Plagiarism Risk: {result.plagiarism_risk === 'HIGH' ? 'High' : result.plagiarism_risk === 'MEDIUM' ? 'Medium' : 'Low'}
                </span>
                {result.is_paraphrase && (
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-warning/10 text-warning">
                    Paraphrase Detected ({safeNum(result.paraphrase_confidence)}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{result.risk_explanation}</p>
            </div>

            {/* Shared Ideas */}
            {(result.shared_ideas?.length ?? 0) > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                <h3 className="text-xs font-bold text-foreground mb-3">Shared Ideas</h3>
                <div className="flex flex-wrap gap-2">
                  {result.shared_ideas.map((idea, i) => (
                    <span key={i} className="text-[10px] bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full">{idea}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Unique Ideas */}
            {((result.unique_to_A?.length ?? 0) > 0 || (result.unique_to_B?.length ?? 0) > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(result.unique_to_A?.length ?? 0) > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                    <h4 className="text-[11px] font-bold text-foreground mb-2">Only in Text A</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {result.unique_to_A.map((idea, i) => (
                        <span key={i} className="text-[10px] bg-success/10 text-success px-2.5 py-1 rounded-full">{idea}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(result.unique_to_B?.length ?? 0) > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                    <h4 className="text-[11px] font-bold text-foreground mb-2">Only in Text B</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {result.unique_to_B.map((idea, i) => (
                        <span key={i} className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full">{idea}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Matching Segments Table */}
            {(result.matching_segments?.length ?? 0) > 0 && (
              <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-xs font-bold text-foreground">Matching Segments</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left px-4 py-2 font-semibold">From Text A</th>
                        <th className="text-left px-4 py-2 font-semibold">From Text B</th>
                        <th className="text-left px-4 py-2 font-semibold">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.matching_segments.map((seg, i) => (
                        <tr key={i} className={`border-b border-border ${i % 2 === 0 ? 'bg-secondary/30' : ''}`}>
                          <td className="px-4 py-2.5 text-foreground">{seg.from_A || '—'}</td>
                          <td className="px-4 py-2.5 text-foreground">{seg.from_B || '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${typeColor(seg.type)}`}>
                              {typeLabel(seg.type)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Verdict & Advice */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-muted-foreground leading-relaxed">{result.verdict}</p>
              {result.advice && (
                <div className="flex gap-3 items-start border-l-2 border-primary pl-3 py-2 bg-primary/5 rounded-r-xl">
                  <span className="text-sm">💡</span>
                  <p className="text-xs text-foreground leading-relaxed">{result.advice}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

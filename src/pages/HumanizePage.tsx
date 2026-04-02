import { useState } from 'react';
import { Copy, Check, ArrowLeft, ArrowRight, ArrowDown, Trash2, ClipboardPaste, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { humanizeText, HumanizeResult } from '@/lib/api';
import { humanizeLocally, Replacement } from '@/lib/humanizeAlgorithm';
import { runDetection } from '@/lib/detectAlgorithm';
import { toast } from 'sonner';

const modes = ['natural', 'academic', 'casual', 'creative', 'simple'] as const;
const intensities = ['light', 'medium', 'heavy'] as const;
const MAX_CHARS = 5000;

interface HumanizePageProps {
  onBack: () => void;
}

interface ScoreComparison {
  before: number;
  after: number;
  reduction: number;
  replacements: Replacement[];
  totalReplacements: number;
}

export default function HumanizePage({ onBack }: HumanizePageProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<string>('natural');
  const [intensity, setIntensity] = useState<string>('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HumanizeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [scoreComparison, setScoreComparison] = useState<ScoreComparison | null>(null);

  const charCount = text.length;
  const outputWordCount = result?.output.trim() ? result.output.trim().split(/\s+/).length : 0;

  const handleHumanize = async () => {
    if (!text.trim() || loading) return;
    setResult(null);
    setScoreComparison(null);
    setLoading(true);
    try {
      const beforeScore = runDetection(text).aiScore;
      const local = humanizeLocally(text.slice(0, MAX_CHARS));
      const res = await humanizeText(local.output, mode, intensity);
      const finalLocal = humanizeLocally(res.output);
      const finalOutput = finalLocal.output;
      const afterScore = runDetection(finalOutput).aiScore;
      const allReplacements = [...local.replacements, ...finalLocal.replacements];
      const seen = new Set<string>();
      const uniqueReplacements = allReplacements.filter(r => {
        const key = `${r.original.toLowerCase()}→${r.replacement.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setResult({ output: finalOutput });
      setScoreComparison({
        before: beforeScore,
        after: afterScore,
        reduction: beforeScore - afterScore,
        replacements: uniqueReplacements,
        totalReplacements: allReplacements.length,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Humanization failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    if (result) {
      navigator.clipboard.writeText(result.output);
      setCopied(true);
      toast.success('Copied! ✅');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePaste = async () => {
    const t = await navigator.clipboard.readText();
    setText(t);
  };

  const handleShare = () => {
    if (result && navigator.share) {
      navigator.share({ text: result.output }).catch(() => {});
    } else {
      copyOutput();
    }
  };

  return (
    <div className="flex flex-col" style={{ height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between shrink-0" style={{ height: 52, padding: '0 12px' }}>
        <button onClick={onBack} className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12 }}>
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-display text-base text-foreground">Humanizer</h1>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full gradient-purple-btn text-primary-foreground">✍️ AI → Human</span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden inner-body" style={{ padding: '12px 12px 8px', WebkitOverflowScrolling: 'touch' }}>
        {/* Mode + Intensity */}
        <div className="space-y-3 mb-4">
          <div>
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5 block">Mode</span>
            <div className="flex flex-wrap gap-1.5">
              {modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize ${
                    mode === m ? 'gradient-purple-btn text-primary-foreground shadow-card' : 'bg-card text-muted-foreground'
                  }`}
                  style={mode !== m ? { border: '1px solid hsl(var(--border))' } : { minHeight: 32 }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5 block">Intensity</span>
            <div className="flex gap-1.5">
              {intensities.map((int) => (
                <button
                  key={int}
                  onClick={() => setIntensity(int)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize ${
                    intensity === int ? 'gradient-purple-btn text-primary-foreground shadow-card' : 'bg-card text-muted-foreground'
                  }`}
                  style={intensity !== int ? { border: '1px solid hsl(var(--border))' } : { minHeight: 32 }}
                >
                  {int}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5 block">AI-Generated Text</span>
        <div className="bg-card rounded-2xl shadow-card overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste AI-generated text here..."
            className="w-full p-4 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
            style={{ minHeight: 120, maxHeight: '35vh', fontSize: 16, boxSizing: 'border-box' }}
            maxLength={MAX_CHARS}
          />
          <div className="flex items-center justify-between px-3 py-2 border-t border-border">
            <span className="text-[11px] font-mono text-muted-foreground">{charCount}/{MAX_CHARS}</span>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => { setText(''); setResult(null); setScoreComparison(null); }} className="flex items-center gap-1 text-[11px] text-muted-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid hsl(var(--border))', whiteSpace: 'nowrap' }}>
                <Trash2 size={12} /> Clear
              </button>
              <button onClick={handlePaste} className="flex items-center gap-1 text-[11px] text-muted-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid hsl(var(--border))', whiteSpace: 'nowrap' }}>
                <ClipboardPaste size={12} /> Paste
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-6 flex flex-col items-center py-8">
            <div className="flex gap-1 text-2xl mb-3">
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}>.</motion.span>
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}>.</motion.span>
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}>.</motion.span>
            </div>
            <span className="text-sm text-muted-foreground">Rewriting your text...</span>
            <div className="mt-4 w-full">
              <div className="h-20 rounded-2xl animate-shimmer" />
            </div>
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-4 space-y-3"
            >
              {/* Output card */}
              <div>
                <span className="text-[10px] font-semibold text-success uppercase tracking-wider mb-1.5 block">Humanized Output ✅</span>
                <div className="bg-card rounded-2xl p-4 shadow-card" style={{ border: '1px solid hsl(var(--border))', borderLeft: '3px solid hsl(var(--success))', overflow: 'hidden', wordBreak: 'break-word' }}>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.output}</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border flex-wrap gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{outputWordCount} words</span>
                    <div className="flex gap-1.5">
                      <button onClick={copyOutput} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-xl text-primary" style={{ border: '1px solid hsl(var(--border))' }}>
                        {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                        {copied ? 'Copied!' : '📋 Copy'}
                      </button>
                      <button onClick={handleShare} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-xl text-primary-foreground gradient-purple-btn">
                        <Share2 size={12} /> 📤 Share
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-center">
                  <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-success/15 text-success">Ready to use — AI detector safe ✅</span>
                </div>
              </div>

              {/* Score Comparison */}
              {scoreComparison && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-card rounded-xl p-3 text-center shadow-card" style={{ border: '1px solid hsl(var(--border))' }}>
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase block mb-0.5">Before</span>
                      <span className="text-xl font-bold font-mono" style={{ color: scoreComparison.before >= 75 ? '#F87171' : scoreComparison.before >= 56 ? '#FBBF24' : '#34D399' }}>
                        {scoreComparison.before}%
                      </span>
                    </div>
                    <div className="bg-card rounded-xl p-3 text-center flex flex-col items-center justify-center shadow-card" style={{ border: '1px solid hsl(var(--border))' }}>
                      <ArrowDown size={14} className="text-muted-foreground" />
                      <span className="text-[9px] font-semibold text-success">−{scoreComparison.reduction}%</span>
                    </div>
                    <div className="bg-card rounded-xl p-3 text-center shadow-card" style={{ border: '1px solid hsl(var(--border))' }}>
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase block mb-0.5">After</span>
                      <span className="text-xl font-bold font-mono" style={{ color: scoreComparison.after >= 75 ? '#F87171' : scoreComparison.after >= 56 ? '#FBBF24' : '#34D399' }}>
                        {scoreComparison.after}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-card rounded-xl px-3 py-2 shadow-card" style={{ border: '1px solid hsl(var(--border))' }}>
                    <span className="text-[11px] font-semibold text-foreground">{scoreComparison.totalReplacements} replacement{scoreComparison.totalReplacements !== 1 ? 's' : ''} applied</span>
                  </div>
                  {scoreComparison.replacements.length > 0 && (
                    <div className="bg-card rounded-xl p-3 shadow-card" style={{ border: '1px solid hsl(var(--border))', overflow: 'hidden' }}>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Replacements Made</span>
                      <div className="flex flex-wrap gap-1.5">
                        {scoreComparison.replacements.map((r, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-secondary rounded-full px-2 py-0.5" style={{ border: '1px solid hsl(var(--border))' }}>
                            <span className="text-destructive line-through">{r.original}</span>
                            <ArrowRight size={8} className="text-muted-foreground" />
                            <span className="text-success font-medium">{r.replacement}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="shrink-0 inner-footer" style={{ height: 68, padding: '10px 12px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        {result ? (
          <motion.button
            onClick={() => { setResult(null); setText(''); setScoreComparison(null); }}
            className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground gradient-purple-btn shadow-card"
            whileTap={{ scale: 0.97 }}
          >
            ✍️ Humanize Again
          </motion.button>
        ) : (
          <motion.button
            onClick={handleHumanize}
            disabled={!text.trim() || loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-30 gradient-purple-btn shadow-card"
            whileTap={{ scale: 0.97 }}
          >
            {loading ? 'Processing...' : '✍️ Start Humanizing'}
          </motion.button>
        )}
      </div>
    </div>
  );
}

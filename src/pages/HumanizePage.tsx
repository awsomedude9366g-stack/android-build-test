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

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const outputWordCount = result?.output.trim() ? result.output.trim().split(/\s+/).length : 0;
  const charCount = text.length;

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
    <div className="min-h-svh px-6 pt-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-card transition-colors">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-display text-lg text-foreground">Humanizer</h1>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full gradient-purple-btn text-white">✍️ AI → Human</span>
      </div>

      {/* Mode + Intensity */}
      <div className="space-y-4 mb-5">
        <div>
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2 block">Mode</span>
          <div className="flex flex-wrap gap-2">
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                  mode === m
                    ? 'gradient-purple-btn text-white shadow-card'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
                style={mode !== m ? { border: '1px solid rgba(139, 92, 246, 0.2)' } : {}}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2 block">Intensity</span>
          <div className="flex gap-2">
            {intensities.map((int) => (
              <button
                key={int}
                onClick={() => setIntensity(int)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                  intensity === int
                    ? 'gradient-purple-btn text-white shadow-card'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
                style={intensity !== int ? { border: '1px solid rgba(139, 92, 246, 0.2)' } : {}}
              >
                {int}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input */}
      <div>
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2 block">AI-Generated Text</span>
        <div className="bg-card rounded-2xl shadow-card overflow-hidden" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste AI-generated text here..."
            className="w-full min-h-[180px] p-5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
            maxLength={MAX_CHARS}
          />
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}>
            <span className="text-[11px] font-mono text-muted-foreground">{charCount}/{MAX_CHARS}</span>
            <div className="flex gap-2">
              <button onClick={() => { setText(''); setResult(null); setScoreComparison(null); }} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <Trash2 size={12} /> Clear
              </button>
              <button onClick={handlePaste} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <ClipboardPaste size={12} /> Paste
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-8 flex flex-col items-center py-12">
          <div className="flex gap-1 text-2xl mb-3">
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}>.</motion.span>
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}>.</motion.span>
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}>.</motion.span>
          </div>
          <span className="text-sm text-muted-foreground">Rewriting your text...</span>
          <div className="mt-6 w-full max-w-md">
            <div className="h-24 rounded-2xl animate-shimmer" />
          </div>
        </div>
      )}

      {/* Action Button */}
      {!loading && !result && (
        <motion.button
          onClick={handleHumanize}
          disabled={!text.trim()}
          className="w-full mt-6 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-30 gradient-purple-btn shadow-card"
          whileTap={{ scale: 0.97 }}
          title={!text.trim() ? 'Enter text first' : ''}
        >
          ✍️ Start Humanizing
        </motion.button>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 space-y-4"
          >
            {/* Output card */}
            <div>
              <span className="text-[10px] font-semibold text-success uppercase tracking-wider mb-2 block">Humanized Output ✅</span>
              <div
                className="bg-card rounded-2xl p-5 shadow-card"
                style={{ border: '1px solid rgba(139, 92, 246, 0.2)', borderLeft: '3px solid #34D399' }}
              >
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.output}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                  <span className="text-[10px] font-mono text-muted-foreground">{outputWordCount} words</span>
                  <div className="flex gap-2">
                    <button
                      onClick={copyOutput}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-4 py-2 rounded-xl transition-all"
                      style={{ border: '1px solid rgba(139, 92, 246, 0.3)', color: '#A78BFA' }}
                    >
                      {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      {copied ? 'Copied! ✅' : '📋 Copy Text'}
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-4 py-2 rounded-xl text-white gradient-purple-btn"
                    >
                      <Share2 size={12} /> 📤 Share
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex justify-center">
                <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-success/15 text-success">
                  Ready to use — AI detector safe ✅
                </span>
              </div>
            </div>

            {/* Score Comparison */}
            {scoreComparison && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-card rounded-2xl p-4 text-center shadow-card" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">AI Score Before</span>
                    <span className="text-2xl font-bold font-mono" style={{ color: scoreComparison.before >= 75 ? '#F87171' : scoreComparison.before >= 56 ? '#FBBF24' : '#34D399' }}>
                      {scoreComparison.before}%
                    </span>
                  </div>
                  <div className="bg-card rounded-2xl p-4 text-center flex flex-col items-center justify-center shadow-card" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <ArrowRight size={16} className="text-muted-foreground hidden sm:block" />
                    <ArrowDown size={16} className="text-muted-foreground sm:hidden" />
                    <span className="text-[10px] font-semibold text-success mt-1">−{scoreComparison.reduction}% reduction</span>
                  </div>
                  <div className="bg-card rounded-2xl p-4 text-center shadow-card" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">AI Score After</span>
                    <span className="text-2xl font-bold font-mono" style={{ color: scoreComparison.after >= 75 ? '#F87171' : scoreComparison.after >= 56 ? '#FBBF24' : '#34D399' }}>
                      {scoreComparison.after}%
                    </span>
                  </div>
                </div>
                <div className="bg-card rounded-2xl px-4 py-3 shadow-card" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <span className="text-xs font-semibold text-foreground">{scoreComparison.totalReplacements} replacement{scoreComparison.totalReplacements !== 1 ? 's' : ''} applied</span>
                </div>
                {scoreComparison.replacements.length > 0 && (
                  <div className="bg-card rounded-2xl p-4 shadow-card" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Replacements Made</span>
                    <div className="flex flex-wrap gap-2">
                      {scoreComparison.replacements.map((r, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 text-[11px] bg-secondary rounded-full px-2.5 py-1" style={{ border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                          <span style={{ color: '#F87171' }} className="line-through">{r.original}</span>
                          <ArrowRight size={10} className="text-muted-foreground" />
                          <span style={{ color: '#34D399' }} className="font-medium">{r.replacement}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <motion.button
              onClick={() => { setResult(null); setText(''); setScoreComparison(null); }}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white gradient-purple-btn shadow-card"
              whileTap={{ scale: 0.97 }}
            >
              ✍️ Humanize Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

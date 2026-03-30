import { useState } from 'react';
import { Copy, Download, Check, ArrowDown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { humanizeText, HumanizeResult } from '@/lib/api';
import { humanizeLocally, Replacement } from '@/lib/humanizeAlgorithm';
import { runDetection } from '@/lib/detectAlgorithm';
import { toast } from 'sonner';

const modes = ['natural', 'academic', 'casual', 'creative', 'simple'] as const;
const intensities = ['light', 'medium', 'heavy'] as const;

const intensityDesc: Record<string, string> = {
  light: 'Fix obvious AI patterns only',
  medium: 'Restructure and vary significantly',
  heavy: 'Full rewrite with natural imperfections',
};

const MAX_CHARS = 5000;

interface ScoreComparison {
  before: number;
  after: number;
  reduction: number;
  replacements: Replacement[];
  totalReplacements: number;
}

export default function HumanizePage() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<string>('natural');
  const [intensity, setIntensity] = useState<string>('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HumanizeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [scoreComparison, setScoreComparison] = useState<ScoreComparison | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const outputWordCount = result?.output.trim() ? result.output.trim().split(/\s+/).length : 0;

  const handleHumanize = async () => {
    if (!text.trim() || loading) return;
    setResult(null);
    setScoreComparison(null);
    setLoading(true);
    try {
      // Step 1: Score BEFORE
      const beforeScore = runDetection(text).aiScore;

      // Step 2: Local phrase replacements + contractions
      const local = humanizeLocally(text.slice(0, MAX_CHARS));

      // Step 3: AI rewrite on the locally-cleaned text
      const res = await humanizeText(local.output, mode, intensity);

      // Step 4: Run local replacements again on AI output for any remaining phrases
      const finalLocal = humanizeLocally(res.output);
      const finalOutput = finalLocal.output;

      // Step 5: Score AFTER
      const afterScore = runDetection(finalOutput).aiScore;

      // Merge all replacements (dedup by original+replacement)
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
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadOutput = () => {
    if (!result) return;
    const blob = new Blob([result.output], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'humanized-text.txt';
    a.click();
  };

  return (
    <div>
      {/* Controls */}
      <div className="space-y-4 mb-5">
        <div>
          <span className="text-xs font-semibold text-foreground mb-2 block">Mode:</span>
          <div className="flex flex-wrap gap-2">
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                  mode === m
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'bg-card border-border text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-foreground mb-2 block">Intensity:</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              {intensities.map((int) => (
                <button
                  key={int}
                  onClick={() => setIntensity(int)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                    intensity === int
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  {int}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline">{intensityDesc[intensity]}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left - Original */}
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold text-foreground">Original (AI) Text</span>
            <span className="text-[11px] font-mono text-muted-foreground">{wordCount}w</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste AI-generated text here..."
            className="w-full min-h-[240px] p-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
            maxLength={MAX_CHARS}
          />
          <div className="flex items-center justify-end px-4 py-3 border-t border-border">
            <button
              onClick={handleHumanize}
              disabled={!text.trim() || loading}
              className="bg-success text-success-foreground text-xs font-semibold px-5 py-2 rounded-lg disabled:opacity-30 transition-all hover:-translate-y-px hover:shadow-card-hover active:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-success-foreground/30 border-t-success-foreground rounded-full animate-spin" />
                  Rewriting…
                </span>
              ) : '✦ Humanize'}
            </button>
          </div>
        </div>

        {/* Right - Output */}
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold text-foreground">Humanized Output</span>
            {result && (
              <button
                onClick={copyOutput}
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <div className="min-h-[240px] p-4">
            {result ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.output}</p>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground/40">
                <span className="text-3xl mb-2">✦</span>
                <span className="text-xs">Humanized text will appear here</span>
              </div>
            )}
          </div>
          {result && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-[10px] font-mono text-muted-foreground">
                Before: {wordCount}w · After: {outputWordCount}w · Δ {outputWordCount - wordCount > 0 ? '+' : ''}{outputWordCount - wordCount}w
              </span>
              <button
                onClick={downloadOutput}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download size={12} /> Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Score Comparison */}
      <AnimatePresence>
        {scoreComparison && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-5 space-y-4"
          >
            {/* Score cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">AI Score Before</span>
                <span className={`text-2xl font-bold font-mono ${scoreComparison.before >= 75 ? 'text-destructive' : scoreComparison.before >= 56 ? 'text-warning' : 'text-success'}`}>
                  {scoreComparison.before}%
                </span>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center flex flex-col items-center justify-center">
                <ArrowRight size={16} className="text-muted-foreground hidden sm:block" />
                <ArrowDown size={16} className="text-muted-foreground sm:hidden" />
                <span className="text-[10px] font-semibold text-success mt-1">
                  −{scoreComparison.reduction}% reduction
                </span>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">AI Score After</span>
                <span className={`text-2xl font-bold font-mono ${scoreComparison.after >= 75 ? 'text-destructive' : scoreComparison.after >= 56 ? 'text-warning' : 'text-success'}`}>
                  {scoreComparison.after}%
                </span>
              </div>
            </div>

            {/* Replacement count */}
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <span className="text-xs font-semibold text-foreground">
                {scoreComparison.totalReplacements} replacement{scoreComparison.totalReplacements !== 1 ? 's' : ''} applied
              </span>
            </div>

            {/* Replacement tags */}
            {scoreComparison.replacements.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Replacements Made</span>
                <div className="flex flex-wrap gap-2">
                  {scoreComparison.replacements.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-[11px] bg-muted/50 border border-border rounded-full px-2.5 py-1"
                    >
                      <span className="text-destructive/70 line-through">{r.original}</span>
                      <ArrowRight size={10} className="text-muted-foreground" />
                      <span className="text-success font-medium">{r.replacement}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

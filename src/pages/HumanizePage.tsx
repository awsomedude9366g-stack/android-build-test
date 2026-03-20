import { useState } from 'react';
import { ArrowLeft, Upload, Copy, Download, Check, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { humanizeText, HumanizeResult, detectText } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const modes = ['Simple', 'Advanced', 'Academic', 'Casual'] as const;
const modeDescriptions: Record<string, string> = {
  Simple: 'Conversational & easy',
  Advanced: 'Professional & natural',
  Academic: 'Formal but varied',
  Casual: 'Friendly & informal',
};
const MAX_CHARS = 5000;

export default function HumanizePage() {
  const navigate = useNavigate();
  const addHistory = useAppStore((s) => s.addHistory);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<string>('Simple');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HumanizeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [humanScoreImproved, setHumanScoreImproved] = useState<number | null>(null);
  const [scoringInProgress, setScoringInProgress] = useState(false);

  const handleHumanize = async () => {
    if (!text.trim() || loading) return;
    setResult(null);
    setHumanScoreImproved(null);
    setShowComparison(false);
    setLoading(true);
    try {
      const res = await humanizeText(text.slice(0, MAX_CHARS), mode);
      setResult(res);
      addHistory({ type: 'humanize', input: text.slice(0, 200), result: res });

      // Background: score improvement check
      setScoringInProgress(true);
      try {
        const [beforeScore, afterScore] = await Promise.all([
          detectText(text.slice(0, MAX_CHARS)),
          detectText(res.output.slice(0, MAX_CHARS)),
        ]);
        const improvement = beforeScore.ai_probability - afterScore.ai_probability;
        setHumanScoreImproved(Math.max(0, improvement));
      } catch {
        // silently fail scoring
      } finally {
        setScoringInProgress(false);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Humanization failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'text/plain') setText(await file.text());
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
    <div className="min-h-svh pb-20 px-4 pt-4">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-muted-foreground text-sm mb-4 active:scale-[0.97] transition-transform">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="font-display text-lg text-foreground mb-4">Text Humanizer</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text to humanize…"
        className="w-full min-h-[180px] p-4 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none resize-none transition-colors"
        maxLength={MAX_CHARS}
      />

      <div className="flex items-center justify-between mt-2 mb-3">
        <span className="text-[10px] text-muted-foreground">{text.length}/{MAX_CHARS}</span>
        <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer active:scale-[0.97] transition-transform">
          <Upload size={14} /> Upload .txt
          <input type="file" accept=".txt" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-2.5 rounded-xl text-left transition-all active:scale-[0.97] ${
              mode === m
                ? 'bg-accent text-accent-foreground shadow-active'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            <span className="text-xs font-medium block">{m}</span>
            <span className="text-[10px] opacity-70">{modeDescriptions[m]}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleHumanize}
        disabled={!text.trim() || loading}
        className="h-12 w-full bg-primary text-primary-foreground rounded-xl font-medium active:scale-[0.97] transition-transform disabled:opacity-40"
      >
        {loading ? 'Rewriting with natural voice…' : 'Start Humanizing'}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-card border border-border rounded-xl p-4 shadow-resting space-y-3"
          >
            {/* Score improvement badge */}
            {humanScoreImproved !== null && humanScoreImproved > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-1.5 bg-success/10 text-success rounded-lg py-2 text-xs font-medium"
              >
                <Check size={14} />
                Human score improved by {humanScoreImproved}%
              </motion.div>
            )}
            {scoringInProgress && (
              <div className="flex items-center justify-center gap-1.5 bg-muted rounded-lg py-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                Measuring improvement…
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Humanized Output</h2>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-1 text-[10px] font-medium text-accent active:scale-[0.97] transition-transform"
              >
                <ArrowLeftRight size={12} />
                {showComparison ? 'Show output' : 'Before vs After'}
              </button>
            </div>

            {showComparison ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground mb-1 block">Before</span>
                  <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3 text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {text}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground mb-1 block">After</span>
                  <div className="bg-success/5 border border-success/10 rounded-lg p-3 text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {result.output}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.output}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={copyOutput}
                className="flex-1 h-10 bg-secondary text-foreground rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={downloadOutput}
                className="flex-1 h-10 bg-secondary text-foreground rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
              >
                <Download size={14} /> Download
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

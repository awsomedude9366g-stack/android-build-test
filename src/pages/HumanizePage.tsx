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

      setScoringInProgress(true);
      try {
        const [beforeScore, afterScore] = await Promise.all([
          detectText(text.slice(0, MAX_CHARS)),
          detectText(res.output.slice(0, MAX_CHARS)),
        ]);
        const improvement = beforeScore.ai_probability - afterScore.ai_probability;
        setHumanScoreImproved(Math.max(0, improvement));
      } catch {
        // silent
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
        Text Humanizer
      </motion.h1>

      <motion.textarea
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text to humanize…"
        className="w-full min-h-[180px] p-4 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:shadow-glow outline-none resize-none transition-all duration-300"
        maxLength={MAX_CHARS}
      />

      <div className="flex items-center justify-between mt-2.5 mb-4">
        <span className="text-[10px] text-muted-foreground font-mono">{text.length}/{MAX_CHARS}</span>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer active:scale-[0.97] transition-transform hover:text-foreground">
          <Upload size={14} strokeWidth={1.8} /> Upload .txt
          <input type="file" accept=".txt" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {/* Mode selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-2 mb-5"
      >
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3.5 py-3 rounded-xl text-left transition-all duration-200 active:scale-[0.97] border ${
              mode === m
                ? 'bg-primary/10 border-primary/30 text-foreground shadow-glow'
                : 'bg-card border-border text-muted-foreground hover:border-border hover:bg-secondary'
            }`}
          >
            <span className="text-xs font-semibold block tracking-tight">{m}</span>
            <span className="text-[10px] opacity-60 mt-0.5 block">{modeDescriptions[m]}</span>
          </button>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleHumanize}
        disabled={!text.trim() || loading}
        className="w-full bg-primary text-primary-foreground rounded-2xl font-semibold text-sm tracking-tight disabled:opacity-30 transition-all duration-200 hover:shadow-glow"
        style={{ height: '52px' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Rewriting…
          </span>
        ) : 'Start Humanizing'}
      </motion.button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 bg-card border border-border rounded-2xl p-5 shadow-resting space-y-4"
          >
            {/* Score improvement */}
            {humanScoreImproved !== null && humanScoreImproved > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 bg-success/10 text-success rounded-xl py-2.5 text-xs font-semibold"
              >
                <Check size={14} strokeWidth={2.5} />
                Human score improved by {humanScoreImproved}%
              </motion.div>
            )}
            {scoringInProgress && (
              <div className="flex items-center justify-center gap-2 bg-secondary rounded-xl py-2.5 text-xs text-muted-foreground">
                <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                Measuring improvement…
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">Humanized Output</h2>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-primary active:scale-[0.97] transition-transform"
              >
                <ArrowLeftRight size={12} strokeWidth={2} />
                {showComparison ? 'Output' : 'Compare'}
              </button>
            </div>

            {showComparison ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Before</span>
                  <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {text}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">After</span>
                  <div className="bg-success/5 border border-success/10 rounded-xl p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {result.output}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{result.output}</p>
            )}

            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={copyOutput}
                className="flex-1 h-11 bg-secondary text-foreground rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:bg-secondary/80"
              >
                {copied ? <Check size={14} className="text-success" strokeWidth={2.5} /> : <Copy size={14} strokeWidth={1.8} />}
                {copied ? 'Copied' : 'Copy'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={downloadOutput}
                className="flex-1 h-11 bg-secondary text-foreground rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:bg-secondary/80"
              >
                <Download size={14} strokeWidth={1.8} /> Download
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

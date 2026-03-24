import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { humanizeText, HumanizeResult } from '@/lib/api';
import { toast } from 'sonner';

const modes = ['natural', 'academic', 'casual', 'creative', 'simple'] as const;
const intensities = ['light', 'medium', 'heavy'] as const;

const intensityDesc: Record<string, string> = {
  light: 'Fix obvious AI patterns only',
  medium: 'Restructure and vary significantly',
  heavy: 'Full rewrite with natural imperfections',
};

const MAX_CHARS = 5000;

export default function HumanizePage() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<string>('natural');
  const [intensity, setIntensity] = useState<string>('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HumanizeResult | null>(null);
  const [copied, setCopied] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const outputWordCount = result?.output.trim() ? result.output.trim().split(/\s+/).length : 0;

  const handleHumanize = async () => {
    if (!text.trim() || loading) return;
    setResult(null);
    setLoading(true);
    try {
      const res = await humanizeText(text.slice(0, MAX_CHARS), mode, intensity);
      setResult(res);
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
        {/* Mode selector */}
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

        {/* Intensity selector */}
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
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-mono">{result.output}</p>
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

      {/* Tips */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 space-y-2"
          >
            {['Run the output through AI Detector to verify it passes', 'Review for factual accuracy — meaning is preserved but phrasing changes', 'Add your own personal touches for maximum authenticity'].map((tip, i) => (
              <div key={i} className="flex gap-3 items-start border-l-2 border-primary pl-3 py-1">
                <span className="text-[10px] font-mono font-bold text-primary mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-xs text-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

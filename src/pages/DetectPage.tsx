import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, ClipboardPaste, Paperclip } from 'lucide-react';
import { runDetection, LocalDetectionResult } from '@/lib/detectAlgorithm';
import { toast } from 'sonner';

const MAX_CHARS = 5000;

interface DetectPageProps {
  onBack: () => void;
}

export default function DetectPage({ onBack }: DetectPageProps) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<LocalDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const isReady = wordCount >= 20;

  const handleDetect = () => {
    if (!isReady) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(runDetection(text.slice(0, MAX_CHARS)));
      setLoading(false);
    }, 800);
  };

  const handlePaste = async () => {
    const t = await navigator.clipboard.readText();
    setText(t);
  };

  const verdictConfig: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
    AI: { label: 'Almost Certainly AI', emoji: '🤖', color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
    LIKELY_AI: { label: 'Likely AI Written', emoji: '⚠️', color: '#FB923C', bg: 'rgba(251,146,60,0.15)' },
    MIXED: { label: 'Mixed / Uncertain', emoji: '🔀', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
    LIKELY_HUMAN: { label: 'Likely Human', emoji: '👤', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
    HUMAN: { label: 'Human Written', emoji: '👤', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  };

  const getVerdict = (v: string) => verdictConfig[v] || verdictConfig.MIXED;

  const signalIcon: Record<string, string> = {
    'Burstiness': '📊', 'AI Phrases': '🔤', 'Lexical Diversity': '📚',
    'Passive Voice': '🔄', 'Sentence Length': '📏', 'Word Length': '🔡',
  };

  const renderHighlightedText = () => {
    if (!result || result.foundPhrases.length === 0) return null;
    const lower = text.toLowerCase();
    const ranges: { start: number; end: number }[] = [];
    for (const phrase of result.foundPhrases) {
      let idx = lower.indexOf(phrase);
      while (idx !== -1) {
        ranges.push({ start: idx, end: idx + phrase.length });
        idx = lower.indexOf(phrase, idx + 1);
      }
    }
    ranges.sort((a, b) => a.start - b.start);
    const merged: typeof ranges = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
      else merged.push({ ...r });
    }
    const parts: JSX.Element[] = [];
    let cursor = 0;
    merged.forEach((r, i) => {
      if (cursor < r.start) parts.push(<span key={`t-${i}`}>{text.slice(cursor, r.start)}</span>);
      parts.push(<mark key={`h-${i}`} className="rounded px-0.5" style={{ backgroundColor: 'rgba(248,113,113,0.2)', color: '#F87171' }}>{text.slice(r.start, r.end)}</mark>);
      cursor = r.end;
    });
    if (cursor < text.length) parts.push(<span key="end">{text.slice(cursor)}</span>);
    return parts;
  };

  return (
    <div className="min-h-svh px-6 pt-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-card transition-colors">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-display text-lg text-foreground">AI Detector</h1>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full gradient-purple-btn text-white">🔍 Beta</span>
      </div>

      {/* Input Card */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your text here..."
          className="w-full min-h-[200px] p-5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none focus:ring-1 focus:ring-primary/30 rounded-t-2xl"
          maxLength={MAX_CHARS}
        />
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}>
          <span className="text-[11px] font-mono text-muted-foreground">{charCount}/{MAX_CHARS}</span>
          <div className="flex gap-2">
            <button onClick={() => { setText(''); setResult(null); }} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <Trash2 size={12} /> Clear
            </button>
            <button onClick={handlePaste} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <ClipboardPaste size={12} /> Paste
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-8 flex flex-col items-center py-12">
          <div className="w-10 h-10 rounded-full border-3 border-primary/30 border-t-primary animate-spin mb-4" />
          <span className="text-sm text-muted-foreground animate-pulse">Analyzing patterns...</span>
          <div className="mt-6 w-full max-w-md space-y-3">
            <div className="h-20 rounded-2xl animate-shimmer" />
            <div className="h-12 rounded-2xl animate-shimmer" />
          </div>
        </div>
      )}

      {/* Action Button */}
      {!loading && !result && (
        <motion.button
          onClick={handleDetect}
          disabled={!isReady}
          className="w-full mt-6 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-30 gradient-purple-btn shadow-card animate-pulse-glow"
          whileTap={{ scale: 0.97 }}
        >
          🔍 Start Detection
        </motion.button>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 space-y-4"
          >
            {/* AI vs Human bars */}
            <div className="bg-card rounded-2xl p-5 shadow-card" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              {/* AI bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">🤖 AI</span>
                  <span className="font-mono font-bold" style={{ color: '#F87171' }}>{result.aiScore}%</span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.aiScore}%` }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #F87171, #FB923C)' }}
                  />
                </div>
              </div>
              {/* Human bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">👤 Human</span>
                  <span className="font-mono font-bold" style={{ color: '#34D399' }}>{100 - result.aiScore}%</span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - result.aiScore}%` }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #34D399, #059669)' }}
                  />
                </div>
              </div>

              {/* Verdict badge */}
              <div className="mt-5 flex justify-center">
                <span
                  className="text-sm font-bold px-5 py-2 rounded-full"
                  style={{ backgroundColor: getVerdict(result.verdict).bg, color: getVerdict(result.verdict).color }}
                >
                  {getVerdict(result.verdict).emoji} {getVerdict(result.verdict).label}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                Based on {wordCount} words across {result.signals.length} signals
              </p>
            </div>

            {/* Signal Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-foreground">Signal Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.signals.map((sig, i) => (
                  <motion.div
                    key={sig.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-2xl p-3.5 shadow-card"
                    style={{ border: '1px solid rgba(139, 92, 246, 0.15)' }}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{signalIcon[sig.name] || '📈'}</span>
                        <span className="text-xs font-bold text-foreground">{sig.name}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        sig.severity === 'HIGH' ? 'bg-destructive/15 text-destructive' :
                        sig.severity === 'MEDIUM' ? 'bg-warning/15 text-warning' :
                        'bg-success/15 text-success'
                      }`}>{sig.severity}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(sig.score * 100)}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: sig.score >= 0.65 ? '#F87171' : sig.score >= 0.35 ? '#FBBF24' : '#34D399',
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground w-8 text-right">{Math.round(sig.score * 100)}%</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">{sig.detail}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Highlighted Phrases */}
            {result.foundPhrases.length > 0 && (
              <div className="bg-card rounded-2xl p-5 shadow-card space-y-3" style={{ border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                <h3 className="text-xs font-bold text-foreground">AI Phrases Found ({result.foundPhrases.length})</h3>
                <div className="text-sm leading-relaxed">{renderHighlightedText()}</div>
                <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                  {result.foundPhrases.map((p) => (
                    <span key={p} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(248,113,113,0.15)', color: '#F87171' }}>{p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Detect Again */}
            <motion.button
              onClick={() => { setResult(null); setText(''); }}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white gradient-purple-btn shadow-card"
              whileTap={{ scale: 0.97 }}
            >
              🔍 Detect Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

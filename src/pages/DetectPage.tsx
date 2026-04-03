import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, ClipboardPaste } from 'lucide-react';
import { runDetection, LocalDetectionResult } from '@/lib/detectAlgorithm';
import { useAppStore } from '@/lib/store';

const MAX_CHARS = 5000;

interface DetectPageProps {
  onBack: () => void;
}

export default function DetectPage({ onBack }: DetectPageProps) {
  const text = useAppStore((s) => s.detectText);
  const setText = useAppStore((s) => s.setDetectText);
  const [result, setResult] = useState<LocalDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const isReady = wordCount >= 20;

  const handleDetect = () => {
    if (!isReady) return;
    setLoading(true);
    setTimeout(() => {
      setResult(runDetection(text.slice(0, MAX_CHARS)));
      setLoading(false);
    }, 800);
  };

  const handlePaste = async () => {
    const t = await navigator.clipboard.readText();
    setText(t);
  };

  const handleClear = () => {
    setText('');
    setResult(null);
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

  return (
    <div className="flex flex-col" style={{ height: '100%', overflow: 'hidden' }}>
      <div className="flex items-center justify-between shrink-0" style={{ height: 52, padding: '0 12px' }}>
        <button onClick={onBack} className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12 }}>
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-display text-base text-foreground">AI Detector</h1>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full gradient-purple-btn text-primary-foreground">🔍 Beta</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden inner-body" style={{ padding: '12px 12px 8px', WebkitOverflowScrolling: 'touch' }}>
        <div className="bg-card rounded-2xl shadow-card overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your text here..."
            className="w-full p-4 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
            style={{ minHeight: 120, maxHeight: '35vh', fontSize: 16, boxSizing: 'border-box' }}
            maxLength={MAX_CHARS}
          />
          <div className="flex items-center justify-between px-3 py-2 border-t border-border">
            <span className="text-[11px] font-mono text-muted-foreground">{charCount}/{MAX_CHARS}</span>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={handleClear} className="flex items-center gap-1 text-[11px] text-muted-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid hsl(var(--border))', whiteSpace: 'nowrap' }}>
                <Trash2 size={12} /> Clear
              </button>
              <button onClick={handlePaste} className="flex items-center gap-1 text-[11px] text-muted-foreground px-3 py-1.5 rounded-full" style={{ border: '1px solid hsl(var(--border))', whiteSpace: 'nowrap' }}>
                <ClipboardPaste size={12} /> Paste
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 flex flex-col items-center py-8">
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-3" />
            <span className="text-sm text-muted-foreground animate-pulse">Analyzing patterns...</span>
            <div className="mt-4 w-full space-y-2">
              <div className="h-16 rounded-2xl animate-shimmer" />
              <div className="h-10 rounded-2xl animate-shimmer" />
            </div>
          </div>
        )}

        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 space-y-3"
            >
              <div className="bg-card rounded-2xl p-4 shadow-card" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">🤖 AI</span>
                    <span className="font-mono font-bold text-destructive">{result.aiScore}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${result.aiScore}%` }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #F87171, #FB923C)' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">👤 Human</span>
                    <span className="font-mono font-bold text-success">{100 - result.aiScore}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${100 - result.aiScore}%` }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #34D399, #059669)' }} />
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <span className="text-xs font-bold px-4 py-1.5 rounded-full" style={{ backgroundColor: getVerdict(result.verdict).bg, color: getVerdict(result.verdict).color }}>
                    {getVerdict(result.verdict).emoji} {getVerdict(result.verdict).label}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">Based on {wordCount} words across {result.signals.length} signals</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground">Signal Breakdown</h3>
                <div className="space-y-2">
                  {result.signals.map((sig, i) => (
                    <motion.div
                      key={sig.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-2xl p-3 shadow-card"
                      style={{ border: '1px solid hsl(var(--border))', overflow: 'hidden', wordBreak: 'break-word' }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{signalIcon[sig.name] || '📈'}</span>
                          <span className="text-[11px] font-bold text-foreground">{sig.name}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          sig.severity === 'HIGH' ? 'bg-destructive/15 text-destructive' :
                          sig.severity === 'MEDIUM' ? 'bg-warning/15 text-warning' :
                          'bg-success/15 text-success'
                        }`}>{sig.severity}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(sig.score * 100)}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: sig.score >= 0.65 ? '#F87171' : sig.score >= 0.35 ? '#FBBF24' : '#34D399' }} />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground w-7 text-right">{Math.round(sig.score * 100)}%</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-snug">{sig.detail}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {result.foundPhrases.length > 0 && (
                <div className="bg-card rounded-2xl p-4 shadow-card space-y-2" style={{ border: '1px solid hsl(var(--border))', overflow: 'hidden', wordBreak: 'break-word' }}>
                  <h3 className="text-xs font-bold text-foreground">AI Phrases Found ({result.foundPhrases.length})</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.foundPhrases.map((p) => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-destructive/15 text-destructive">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 inner-footer" style={{ height: 68, padding: '10px 12px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <motion.button
          onClick={handleDetect}
          disabled={!isReady || loading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-30 gradient-purple-btn shadow-card"
          whileTap={{ scale: 0.97 }}
        >
          {loading ? 'Processing...' : '🔍 Start Detection'}
        </motion.button>
      </div>
    </div>
  );
}

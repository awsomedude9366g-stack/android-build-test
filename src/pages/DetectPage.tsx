import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runDetection, LocalDetectionResult } from '@/lib/detectAlgorithm';

const MAX_CHARS = 5000;

export default function DetectPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<LocalDetectionResult | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const isReady = wordCount >= 20;

  const handleDetect = () => {
    if (!isReady) return;
    setResult(runDetection(text.slice(0, MAX_CHARS)));
  };

  const verdictConfig: Record<string, { label: string; bg: string; text: string }> = {
    AI: { label: '🤖 Almost Certainly AI', bg: 'bg-destructive', text: 'text-destructive-foreground' },
    LIKELY_AI: { label: '⚠️ Likely AI Written', bg: 'bg-orange-500', text: 'text-white' },
    MIXED: { label: '🔀 Mixed / Uncertain', bg: 'bg-warning', text: 'text-warning-foreground' },
    LIKELY_HUMAN: { label: '👤 Likely Human', bg: 'bg-emerald-400', text: 'text-emerald-950' },
    HUMAN: { label: '🧑 Human Written', bg: 'bg-success', text: 'text-success-foreground' },
  };

  const getVerdict = (v: string) => verdictConfig[v] || verdictConfig.MIXED;

  const severityColor = (s: string) =>
    s === 'HIGH' ? 'bg-destructive/10 text-destructive' : s === 'MEDIUM' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success';

  const signalIcon: Record<string, string> = {
    'Burstiness': '📊',
    'AI Phrases': '🔤',
    'Lexical Diversity': '📚',
    'Passive Voice': '🔄',
    'Sentence Length': '📏',
    'Word Length': '🔡',
  };

  const gaugeColor =
    result && result.aiScore > 65 ? 'hsl(var(--destructive))' :
    result && result.aiScore > 35 ? 'hsl(var(--warning))' : 'hsl(var(--success))';

  // Highlight AI phrases in text
  const renderHighlightedText = () => {
    if (!result || result.foundPhrases.length === 0) return null;
    const lower = text.toLowerCase();
    // Build ranges of matched phrases
    const ranges: { start: number; end: number; phrase: string }[] = [];
    for (const phrase of result.foundPhrases) {
      let idx = lower.indexOf(phrase);
      while (idx !== -1) {
        ranges.push({ start: idx, end: idx + phrase.length, phrase });
        idx = lower.indexOf(phrase, idx + 1);
      }
    }
    // Sort and merge overlapping
    ranges.sort((a, b) => a.start - b.start);
    const merged: typeof ranges = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r.start <= last.end) {
        last.end = Math.max(last.end, r.end);
      } else {
        merged.push({ ...r });
      }
    }

    const parts: JSX.Element[] = [];
    let cursor = 0;
    merged.forEach((r, i) => {
      if (cursor < r.start) {
        parts.push(<span key={`t-${i}`}>{text.slice(cursor, r.start)}</span>);
      }
      parts.push(
        <mark key={`h-${i}`} className="bg-destructive/15 text-destructive rounded px-0.5" title={`AI phrase: "${text.slice(r.start, r.end)}"`}>
          {text.slice(r.start, r.end)}
        </mark>
      );
      cursor = r.end;
    });
    if (cursor < text.length) {
      parts.push(<span key="end">{text.slice(cursor)}</span>);
    }
    return parts;
  };

  return (
    <div>
      {/* Input Card */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-xs font-semibold text-foreground">Input Text</span>
          <span className="text-[11px] font-mono text-muted-foreground">{wordCount}w · {charCount}c</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste any essay, article, email, or report..."
          className="w-full min-h-[200px] p-4 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
          maxLength={MAX_CHARS}
        />
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className={`text-[11px] font-medium ${isReady ? 'text-success' : 'text-muted-foreground'}`}>
            {isReady ? '✓ Ready' : 'Min 20 words'}
          </span>
          <div className="flex gap-2">
            {text && (
              <button
                onClick={() => { setText(''); setResult(null); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleDetect}
              disabled={!isReady}
              className="bg-success text-success-foreground text-xs font-semibold px-5 py-2 rounded-lg disabled:opacity-30 transition-all hover:-translate-y-px hover:shadow-card-hover active:translate-y-0"
            >
              ▶ Detect AI
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 space-y-4"
          >
            {/* Verdict Banner */}
            <div className={`${getVerdict(result.verdict).bg} rounded-xl p-4 flex items-center justify-between`}>
              <span className={`text-sm font-bold ${getVerdict(result.verdict).text}`}>
                {getVerdict(result.verdict).label}
              </span>
              <div className="flex gap-2">
                <span className="bg-card/90 backdrop-blur text-foreground text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg">
                  {result.aiScore}% AI
                </span>
                <span className="bg-card/90 backdrop-blur text-foreground text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg">
                  {100 - result.aiScore}% Human
                </span>
              </div>
            </div>

            {/* Gauge Bar */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-card">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
                <span>HUMAN ◀</span>
                <span className="font-semibold text-foreground">AI Likelihood</span>
                <span>▶ AI</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.aiScore}%` }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: gaugeColor }}
                />
              </div>
            </div>

            {/* Signal Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-foreground">Signal Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.signals.map((sig) => (
                  <motion.div
                    key={sig.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-xl p-3.5 shadow-card"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{signalIcon[sig.name] || '📈'}</span>
                        <span className="text-xs font-bold text-foreground">{sig.name}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${severityColor(sig.severity)}`}>
                        {sig.severity}
                      </span>
                    </div>
                    {/* Score bar */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(sig.score * 100)}%` }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: sig.score >= 0.65 ? 'hsl(var(--destructive))' : sig.score >= 0.35 ? 'hsl(var(--warning))' : 'hsl(var(--success))',
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground w-8 text-right">
                        {Math.round(sig.score * 100)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">{sig.detail}</div>
                    <div className="text-[9px] text-muted-foreground/60 mt-1">Weight: {sig.weight}%</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Highlighted AI Phrases */}
            {result.foundPhrases.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground">
                    AI Phrases Found ({result.foundPhrases.length})
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-destructive/30" /> Highlighted below
                  </div>
                </div>
                <div className="text-sm leading-relaxed font-mono">
                  {renderHighlightedText()}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                  {result.foundPhrases.map((p) => (
                    <span key={p} className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                      {p}
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

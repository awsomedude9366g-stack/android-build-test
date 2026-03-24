import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectText, DetectionResult } from '@/lib/api';
import { toast } from 'sonner';

const MAX_CHARS = 5000;

export default function DetectPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const isReady = wordCount >= 20;

  const handleDetect = async () => {
    if (!isReady || loading) return;
    setResult(null);
    setLoading(true);
    try {
      const res = await detectText(text.slice(0, MAX_CHARS));
      setResult(res);
    } catch (err: any) {
      toast.error(err?.message || 'Detection failed.');
    } finally {
      setLoading(false);
    }
  };

  const verdictConfig = {
    AI: { label: '🤖 AI Generated', bg: 'bg-destructive', text: 'text-destructive-foreground' },
    HUMAN: { label: '🧑 Human Written', bg: 'bg-success', text: 'text-success-foreground' },
    MIXED: { label: '🔀 Mixed Content', bg: 'bg-primary', text: 'text-primary-foreground' },
  };

  const metricColor = (val: string) =>
    val === 'LOW' ? 'text-destructive' : val === 'MEDIUM' ? 'text-warning' : 'text-success';

  const severityColor = (sev: string) =>
    sev === 'HIGH' ? 'bg-destructive/10 text-destructive' : sev === 'MEDIUM' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success';

  const gaugeColor =
    result && result.ai_probability > 65 ? 'hsl(var(--destructive))' :
    result && result.ai_probability > 35 ? 'hsl(var(--warning))' : 'hsl(var(--success))';

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
              disabled={!isReady || loading}
              className="bg-success text-success-foreground text-xs font-semibold px-5 py-2 rounded-lg disabled:opacity-30 transition-all hover:-translate-y-px hover:shadow-card-hover active:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-success-foreground/30 border-t-success-foreground rounded-full animate-spin" />
                  Analyzing…
                </span>
              ) : '▶ Detect AI'}
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
            <div className={`${verdictConfig[result.verdict].bg} rounded-xl p-4 flex items-center justify-between`}>
              <span className={`text-sm font-bold ${verdictConfig[result.verdict].text}`}>
                {verdictConfig[result.verdict].label}
              </span>
              <div className="flex gap-2">
                {[
                  { label: 'AI', val: result.ai_probability },
                  { label: 'Human', val: result.human_probability },
                  { label: 'Conf', val: result.confidence },
                ].map((chip) => (
                  <span key={chip.label} className="bg-card/90 backdrop-blur text-foreground text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg">
                    {chip.val}% {chip.label}
                  </span>
                ))}
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
                  animate={{ width: `${result.ai_probability}%` }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: gaugeColor }}
                />
              </div>
            </div>

            {/* Linguistic Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Perplexity', value: result.perplexity, hint: 'Word predictability' },
                { label: 'Burstiness', value: result.burstiness, hint: 'Length variation' },
                { label: 'Vocabulary', value: result.vocab_richness, hint: 'Word diversity' },
              ].map((m) => (
                <div key={m.label} className="bg-card border border-border rounded-xl p-3 text-center shadow-card">
                  <div className={`text-sm font-bold font-mono ${metricColor(m.value)}`}>{m.value}</div>
                  <div className="text-[11px] font-semibold text-foreground mt-1">{m.label}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{m.hint}</div>
                </div>
              ))}
            </div>

            {/* Sentence Analysis */}
            {result.sentence_analysis && result.sentence_analysis.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground">Sentence Analysis</h3>
                  <div className="flex gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Human-like</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> AI-like</span>
                  </div>
                </div>
                <div className="text-sm leading-relaxed">
                  {result.sentence_analysis.map((s, i) => (
                    <span
                      key={i}
                      className={`px-0.5 rounded ${s.label === 'AI' ? 'bg-destructive/8' : 'bg-success/8'}`}
                      title={s.reason}
                    >
                      {s.text}{' '}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">Hover sentences to see reason</p>
              </div>
            )}

            {/* Detected Signals */}
            {result.top_signals && result.top_signals.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.top_signals.map((sig, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-lg">{sig.icon}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${severityColor(sig.severity)}`}>
                        {sig.severity}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-foreground">{sig.signal}</div>
                    <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{sig.description}</div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Forensic Analysis */}
            {result.forensic_analysis && (
              <div className="bg-secondary rounded-xl p-4">
                <h3 className="text-xs font-bold text-foreground mb-2">Forensic Analysis</h3>
                <p className="text-xs font-mono text-muted-foreground leading-[1.9]">{result.forensic_analysis}</p>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 items-start border-l-2 border-primary pl-3 py-1">
                    <span className="text-[10px] font-mono font-bold text-primary mt-0.5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-xs text-foreground leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

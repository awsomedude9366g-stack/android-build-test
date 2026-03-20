import { useState } from 'react';
import { ArrowLeft, Upload, Shield, ChevronDown, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { detectText, DetectionResult } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import ResultGauge from '@/components/ResultGauge';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const MAX_CHARS = 5000;

export default function DetectPage() {
  const navigate = useNavigate();
  const addHistory = useAppStore((s) => s.addHistory);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  const handleDetect = async () => {
    if (!text.trim() || loading) return;
    setResult(null);
    setLoading(true);
    setScanning(true);
    try {
      const res = await detectText(text.slice(0, MAX_CHARS));
      setScanning(false);
      setResult(res);
      addHistory({ type: 'detection', input: text.slice(0, 200), result: res });
    } catch (err: any) {
      setScanning(false);
      toast.error(err?.message || 'Detection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'text/plain') setText(await file.text());
  };

  const verdictColor =
    result?.verdict === 'Likely AI'
      ? 'text-destructive'
      : result?.verdict === 'Likely Human'
      ? 'text-success'
      : 'text-warning';

  const confidenceLevel = result?.confidence || 'Medium';
  const confidenceValue = confidenceLevel === 'High' ? 90 : confidenceLevel === 'Medium' ? 60 : 30;
  const confidenceBarColor = confidenceLevel === 'High' ? 'bg-success' : confidenceLevel === 'Medium' ? 'bg-warning' : 'bg-muted-foreground';

  const confidenceBadgeColor =
    confidenceLevel === 'High'
      ? 'bg-success/10 text-success'
      : confidenceLevel === 'Medium'
      ? 'bg-warning/10 text-warning'
      : 'bg-muted text-muted-foreground';

  return (
    <div className="min-h-svh pb-20 px-4 pt-4">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-muted-foreground text-sm mb-4 active:scale-[0.97] transition-transform">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="font-display text-lg text-foreground mb-4">AI Text Detector</h1>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type text to analyze…"
          className="w-full min-h-[200px] p-4 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none resize-none transition-colors"
          maxLength={MAX_CHARS}
        />
        {scanning && (
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <div className="animate-scan absolute inset-x-0 h-8 bg-gradient-to-b from-accent/20 to-transparent" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 mb-4">
        <span className="text-[10px] text-muted-foreground">{text.length}/{MAX_CHARS}</span>
        <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer active:scale-[0.97] transition-transform">
          <Upload size={14} />
          Upload .txt
          <input type="file" accept=".txt" className="hidden" onChange={handleFile} />
        </label>
      </div>

      <button
        onClick={handleDetect}
        disabled={!text.trim() || loading}
        className="h-12 w-full bg-primary text-primary-foreground rounded-xl font-medium active:scale-[0.97] transition-transform disabled:opacity-40"
      >
        {loading ? 'Analyzing syntax patterns…' : 'Start Detection'}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-card border border-border rounded-xl p-4 shadow-resting space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Estimated AI Probability</h2>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${confidenceBadgeColor}`}>
                {confidenceLevel} confidence
              </span>
            </div>

            {/* Gauge */}
            <ResultGauge percentage={result.ai_probability} />
            <div className="flex justify-between text-xs">
              <span className="text-success font-mono">{result.human_probability}% Human</span>
              <span className="text-destructive font-mono">{result.ai_probability}% AI</span>
            </div>

            {/* Verdict */}
            <div className={`text-center text-lg font-display ${verdictColor}`}>{result.verdict}</div>

            {/* Confidence Meter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">Confidence Meter</span>
                <span className="text-[11px] font-mono text-foreground">{confidenceValue}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidenceValue}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full ${confidenceBarColor}`}
                />
              </div>
            </div>

            {/* Statistical Details */}
            {result.statistical_details && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-secondary rounded-lg p-2 text-center">
                  <div className="text-[10px] text-muted-foreground">Sentence Var.</div>
                  <div className="text-xs font-mono font-semibold text-foreground">{result.statistical_details.sentenceVariance}</div>
                </div>
                <div className="bg-secondary rounded-lg p-2 text-center">
                  <div className="text-[10px] text-muted-foreground">Repetition</div>
                  <div className="text-xs font-mono font-semibold text-foreground">{result.statistical_details.repetitionPct}%</div>
                </div>
                <div className="bg-secondary rounded-lg p-2 text-center">
                  <div className="text-[10px] text-muted-foreground">Vocab Div.</div>
                  <div className="text-xs font-mono font-semibold text-foreground">{result.statistical_details.vocabDiversity}</div>
                </div>
              </div>
            )}

            {/* Why this result? */}
            <Collapsible open={whyOpen} onOpenChange={setWhyOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium text-accent py-2 active:scale-[0.98] transition-transform">
                <span className="flex items-center gap-1.5">
                  <BarChart3 size={13} />
                  Why this result?
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${whyOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground leading-relaxed pb-1"
                >
                  {result.reason}
                </motion.div>
              </CollapsibleContent>
            </Collapsible>

            <p className="text-[10px] text-muted-foreground/60 text-center flex items-center justify-center gap-1">
              <Shield size={10} /> Algorithmic + statistical estimation. Use as a secondary reference.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

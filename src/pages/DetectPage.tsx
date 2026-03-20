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
  const confidenceValue = confidenceLevel === 'High' ? 92 : confidenceLevel === 'Medium' ? 60 : 28;
  const confidenceBarColor = confidenceLevel === 'High' ? 'bg-success' : confidenceLevel === 'Medium' ? 'bg-warning' : 'bg-muted-foreground';

  return (
    <div className="min-h-svh pb-24 px-5 pt-6">
      {/* Back */}
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
        AI Text Detector
      </motion.h1>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type text to analyze…"
          className="w-full min-h-[200px] p-4 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:shadow-glow outline-none resize-none transition-all duration-300"
          maxLength={MAX_CHARS}
        />
        {scanning && (
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="animate-scan absolute inset-x-0 h-10 bg-gradient-to-b from-primary/15 to-transparent" />
          </div>
        )}
      </motion.div>

      <div className="flex items-center justify-between mt-2.5 mb-5">
        <span className="text-[10px] text-muted-foreground font-mono">{text.length}/{MAX_CHARS}</span>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer active:scale-[0.97] transition-transform hover:text-foreground">
          <Upload size={14} strokeWidth={1.8} />
          Upload .txt
          <input type="file" accept=".txt" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleDetect}
        disabled={!text.trim() || loading}
        className="h-13 w-full bg-primary text-primary-foreground rounded-2xl font-semibold text-sm tracking-tight disabled:opacity-30 transition-all duration-200 hover:shadow-glow"
        style={{ height: '52px' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Analyzing…
          </span>
        ) : 'Start Detection'}
      </motion.button>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 bg-card border border-border rounded-2xl p-5 shadow-resting space-y-5"
          >
            {/* Circular gauge */}
            <ResultGauge percentage={result.ai_probability} />

            {/* Human vs AI */}
            <div className="flex justify-between text-xs px-2">
              <span className="text-success font-mono font-medium">{result.human_probability}% Human</span>
              <span className="text-destructive font-mono font-medium">{result.ai_probability}% AI</span>
            </div>

            {/* Verdict */}
            <div className={`text-center text-lg font-display tracking-tight ${verdictColor}`}>
              {result.verdict}
            </div>

            {/* Confidence meter */}
            <div className="space-y-2 bg-secondary/50 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">Confidence</span>
                <span className="text-[11px] font-mono text-foreground font-medium">{confidenceLevel}</span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidenceValue}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full ${confidenceBarColor}`}
                />
              </div>
            </div>

            {/* Statistical details */}
            {result.statistical_details && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Sentence Var.', value: result.statistical_details.sentenceVariance },
                  { label: 'Repetition', value: `${result.statistical_details.repetitionPct}%` },
                  { label: 'Vocab Div.', value: result.statistical_details.vocabDiversity },
                ].map((stat) => (
                  <div key={stat.label} className="bg-secondary/50 rounded-xl p-3 text-center">
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</div>
                    <div className="text-sm font-mono font-semibold text-foreground mt-1">{stat.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Why this result */}
            <Collapsible open={whyOpen} onOpenChange={setWhyOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium text-primary py-2 active:scale-[0.98] transition-transform">
                <span className="flex items-center gap-1.5">
                  <BarChart3 size={13} strokeWidth={1.8} />
                  Why this result?
                </span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${whyOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground leading-relaxed pb-1 pl-5"
                >
                  {result.reason}
                </motion.p>
              </CollapsibleContent>
            </Collapsible>

            <p className="text-[10px] text-muted-foreground/40 text-center flex items-center justify-center gap-1.5 pt-1">
              <Shield size={10} strokeWidth={1.8} /> Algorithmic + statistical estimation
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

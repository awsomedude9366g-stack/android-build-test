import { useState } from 'react';
import { ArrowLeft, Upload, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { detectText, DetectionResult } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import ResultGauge from '@/components/ResultGauge';
import { toast } from 'sonner';

const MAX_CHARS = 5000;

export default function DetectPage() {
  const navigate = useNavigate();
  const addHistory = useAppStore((s) => s.addHistory);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

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
    if (file.type === 'text/plain') {
      setText(await file.text());
    }
  };

  const verdictColor =
    result?.verdict === 'Likely AI'
      ? 'text-destructive'
      : result?.verdict === 'Likely Human'
      ? 'text-success'
      : 'text-warning';

  const confidenceBadgeColor =
    result?.confidence === 'High'
      ? 'bg-success/10 text-success'
      : result?.confidence === 'Medium'
      ? 'bg-warning/10 text-warning'
      : 'bg-muted text-muted-foreground';

  return (
    <div className="min-h-svh pb-20 px-4 pt-4">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
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
        <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
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
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Estimated AI Probability</h2>
              {result.confidence && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${confidenceBadgeColor}`}>
                  {result.confidence} confidence
                </span>
              )}
            </div>
            <ResultGauge percentage={result.ai_probability} />
            <div className="flex justify-between text-xs">
              <span className="text-success font-mono">{result.human_probability}% Human</span>
              <span className="text-destructive font-mono">{result.ai_probability}% AI</span>
            </div>
            <div className={`text-center text-lg font-display ${verdictColor}`}>{result.verdict}</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{result.reason}</p>
            <p className="text-[10px] text-muted-foreground/60 text-center flex items-center justify-center gap-1">
              <Shield size={10} /> Algorithmic estimation. Use as a secondary reference.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

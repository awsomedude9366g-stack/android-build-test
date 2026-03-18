import { useState } from 'react';
import { ArrowLeft, Upload, Copy, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { humanizeText, HumanizeResult } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const modes = ['Simple', 'Advanced', 'Academic', 'Casual'] as const;
const MAX_CHARS = 5000;

export default function HumanizePage() {
  const navigate = useNavigate();
  const addHistory = useAppStore((s) => s.addHistory);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<string>('Simple');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HumanizeResult | null>(null);

  const handleHumanize = async () => {
    if (!text.trim() || loading) return;
    setResult(null);
    setLoading(true);
    try {
      const res = await humanizeText(text.slice(0, MAX_CHARS), mode);
      setResult(res);
      addHistory({ type: 'humanize', input: text.slice(0, 200), result: res });
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
      toast.success('Copied to clipboard');
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
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
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
        <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
          <Upload size={14} /> Upload .txt
          <input type="file" accept=".txt" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              mode === m
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <button
        onClick={handleHumanize}
        disabled={!text.trim() || loading}
        className="h-12 w-full bg-primary text-primary-foreground rounded-xl font-medium active:scale-[0.97] transition-transform disabled:opacity-40"
      >
        {loading ? 'Adjusting linguistic variance…' : 'Start Humanizing'}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-card border border-border rounded-xl p-4 shadow-resting space-y-3"
          >
            <h2 className="text-sm font-semibold text-foreground">Humanized Output</h2>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.output}</p>
            <div className="flex gap-2">
              <button
                onClick={copyOutput}
                className="flex-1 h-10 bg-secondary text-foreground rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
              >
                <Copy size={14} /> Copy
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

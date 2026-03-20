import { Scan, Sparkles, GitCompare, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, HistoryEntry } from '@/lib/store';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const iconMap = {
  detection: Scan,
  humanize: Sparkles,
  similarity: GitCompare,
};

const labelMap = {
  detection: 'Detection',
  humanize: 'Humanizer',
  similarity: 'Similarity',
};

const colorMap = {
  detection: 'text-destructive',
  humanize: 'text-primary',
  similarity: 'text-warning',
};

export default function HistoryPage() {
  const history = useAppStore((s) => s.history);

  const copyResult = (entry: HistoryEntry) => {
    const text =
      entry.type === 'detection'
        ? `${entry.result.verdict}: ${entry.result.ai_probability}% AI`
        : entry.type === 'humanize'
        ? entry.result.output
        : `${entry.result.similarity}% similar`;
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  return (
    <div className="min-h-svh pb-24 px-5 pt-8">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-xl text-foreground mb-6 tracking-tight"
      >
        History
      </motion.h1>

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center mt-24 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Scan size={20} className="text-muted-foreground/40" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-muted-foreground">No history yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Results will appear here after you use a tool.</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {history.map((entry, i) => {
            const Icon = iconMap[entry.type];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3 group"
              >
                <div className={`w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 ${colorMap[entry.type]}`}>
                  <Icon size={16} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      {labelMap[entry.type]}
                    </span>
                    <span className="text-[9px] text-muted-foreground/40 font-mono">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 truncate">{entry.input}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => copyResult(entry)}
                  className="text-muted-foreground/40 hover:text-foreground p-1.5 rounded-lg transition-colors"
                >
                  <Copy size={14} strokeWidth={1.8} />
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

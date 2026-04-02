import { Scan, Sparkles, GitCompare, Copy } from 'lucide-react';
import { useAppStore, HistoryEntry } from '@/lib/store';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const iconMap = { detection: Scan, humanize: Sparkles, similarity: GitCompare };
const labelMap = { detection: 'Detection', humanize: 'Humanizer', similarity: 'Similarity' };
const colorMap = { detection: '#F87171', humanize: '#A78BFA', similarity: '#FBBF24' };

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
    <div className="flex flex-col" style={{ height: '100%', overflow: 'hidden', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="shrink-0" style={{ height: 52, padding: '0 16px', display: 'flex', alignItems: 'center' }}>
        <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-lg text-foreground tracking-tight">
          History
        </motion.h1>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: '0 12px 12px', WebkitOverflowScrolling: 'touch' }}>
        {history.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center justify-center mt-20 text-center">
            <div className="flex items-center justify-center mb-3 bg-card rounded-2xl" style={{ width: 48, height: 48, border: '1px solid hsl(var(--border))' }}>
              <Scan size={20} className="text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">No history yet</p>
            <p className="text-[11px] text-muted-foreground/50 mt-1">Results will appear here after you use a tool.</p>
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
                  className="bg-card rounded-2xl p-3 flex items-start gap-3 shadow-card"
                  style={{ border: '1px solid hsl(var(--border))', overflow: 'hidden', wordBreak: 'break-word' }}
                >
                  <div className="shrink-0 flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, backgroundColor: `${colorMap[entry.type]}15` }}>
                    <Icon size={14} strokeWidth={1.8} style={{ color: colorMap[entry.type] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{labelMap[entry.type]}</span>
                      <span className="text-[9px] text-muted-foreground/40 font-mono">{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[11px] text-foreground/80 truncate">{entry.input}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => copyResult(entry)} className="text-muted-foreground/40 p-1.5 rounded-lg" style={{ minWidth: 32, minHeight: 32 }}>
                    <Copy size={14} strokeWidth={1.8} />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

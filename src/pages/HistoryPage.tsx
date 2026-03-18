import { ArrowLeft, Scan, Sparkles, GitCompare, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, HistoryEntry } from '@/lib/store';
import { toast } from 'sonner';

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
    <div className="min-h-svh pb-20 px-4 pt-6">
      <h1 className="font-display text-lg text-foreground mb-6">History</h1>

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center mt-20">No history yet. Start using a tool.</p>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => {
            const Icon = iconMap[entry.type];
            return (
              <div
                key={entry.id}
                className="bg-card border border-border rounded-xl p-3 flex items-start gap-3"
              >
                <Icon size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {labelMap[entry.type]}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground mt-1 truncate">{entry.input}</p>
                </div>
                <button onClick={() => copyResult(entry)} className="text-muted-foreground p-1">
                  <Copy size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

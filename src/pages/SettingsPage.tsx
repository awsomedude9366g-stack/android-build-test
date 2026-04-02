import { useAppStore } from '@/lib/store';
import { Trash2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { clearHistory } = useAppStore();

  return (
    <div className="flex flex-col" style={{ height: '100%', overflow: 'hidden', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="shrink-0" style={{ height: 52, padding: '0 16px', display: 'flex', alignItems: 'center' }}>
        <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-lg text-foreground tracking-tight">
          Settings
        </motion.h1>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: '0 12px 12px', WebkitOverflowScrolling: 'touch' }}>
        <div className="space-y-2">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => clearHistory()}
            className="w-full bg-card rounded-2xl p-3.5 flex items-center gap-3 shadow-card"
            style={{ border: '1px solid hsl(var(--border))', minHeight: 48 }}
          >
            <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 36, height: 36, backgroundColor: 'rgba(248,113,113,0.15)' }}>
              <Trash2 size={16} className="text-destructive" strokeWidth={1.8} />
            </div>
            <span className="text-sm text-foreground flex-1 text-left font-medium">Clear History</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-3.5 flex items-start gap-3 shadow-card"
            style={{ border: '1px solid hsl(var(--border))' }}
          >
            <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 36, height: 36, backgroundColor: 'rgba(139,92,246,0.15)' }}>
              <Info size={16} className="text-primary" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">About ClarityScribe</h3>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Professional AI writing toolkit. Detect AI text, humanize your writing, and compare documents.
              </p>
              <span className="text-[10px] text-muted-foreground/40 font-mono mt-1.5 block">v3.0.0</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

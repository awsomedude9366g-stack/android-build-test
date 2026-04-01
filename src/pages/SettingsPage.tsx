import { useAppStore } from '@/lib/store';
import { Trash2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { clearHistory } = useAppStore();

  return (
    <div className="min-h-svh px-6 pt-8 pb-12">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-xl text-foreground mb-6 tracking-tight"
      >
        Settings
      </motion.h1>

      <div className="space-y-2">
        {/* Clear history */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => clearHistory()}
          className="w-full bg-card rounded-2xl p-4 flex items-center gap-3.5 transition-colors hover:glow-purple-sm shadow-card"
          style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(248,113,113,0.15)' }}>
            <Trash2 size={16} style={{ color: '#F87171' }} strokeWidth={1.8} />
          </div>
          <span className="text-sm text-foreground flex-1 text-left font-medium">Clear History</span>
        </motion.button>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-4 flex items-start gap-3.5 shadow-card"
          style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
            <Info size={16} className="text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">About ClarityScribe</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Professional AI writing toolkit. Detect AI text, humanize your writing, and compare documents. Built for precision and speed.
            </p>
            <span className="text-[10px] text-muted-foreground/40 font-mono mt-2 block">v3.0.0</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

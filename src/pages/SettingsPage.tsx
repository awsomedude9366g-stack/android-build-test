import { useAppStore } from '@/lib/store';
import { Moon, Sun, Trash2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { darkMode, toggleDarkMode, clearHistory } = useAppStore();

  return (
    <div className="min-h-svh pb-24 px-5 pt-8">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-xl text-foreground mb-6 tracking-tight"
      >
        Settings
      </motion.h1>

      <div className="space-y-2">
        {/* Dark mode */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleDarkMode}
          className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3.5 transition-colors hover:border-primary/20"
        >
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            {darkMode ? <Sun size={16} className="text-warning" strokeWidth={1.8} /> : <Moon size={16} className="text-muted-foreground" strokeWidth={1.8} />}
          </div>
          <span className="text-sm text-foreground flex-1 text-left font-medium">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
          <div className={`w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-secondary'} relative`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
        </motion.button>

        {/* Clear history */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => clearHistory()}
          className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3.5 transition-colors hover:border-destructive/20"
        >
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <Trash2 size={16} className="text-destructive" strokeWidth={1.8} />
          </div>
          <span className="text-sm text-foreground flex-1 text-left font-medium">Clear History</span>
        </motion.button>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3.5"
        >
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Info size={16} className="text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">About Syntax</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Professional AI writing toolkit. Detect AI text, humanize your writing, and compare documents. Built for precision and speed.
            </p>
            <span className="text-[10px] text-muted-foreground/40 font-mono mt-2 block">v1.0.0</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

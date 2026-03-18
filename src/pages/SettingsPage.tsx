import { useAppStore } from '@/lib/store';
import { Moon, Sun, Trash2, Info } from 'lucide-react';

export default function SettingsPage() {
  const { darkMode, toggleDarkMode, clearHistory } = useAppStore();

  return (
    <div className="min-h-svh pb-20 px-4 pt-6">
      <h1 className="font-display text-lg text-foreground mb-6">Settings</h1>

      <div className="space-y-2">
        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3"
        >
          {darkMode ? <Sun size={18} className="text-warning" /> : <Moon size={18} className="text-muted-foreground" />}
          <span className="text-sm text-foreground flex-1 text-left">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
          <span className="text-[10px] text-muted-foreground">{darkMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* Clear history */}
        <button
          onClick={() => {
            clearHistory();
          }}
          className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3"
        >
          <Trash2 size={18} className="text-destructive" />
          <span className="text-sm text-foreground flex-1 text-left">Clear History</span>
        </button>

        {/* About */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
          <Info size={18} className="text-accent mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">About Syntax</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Syntax is a professional AI writing toolkit. Detect AI-generated text, refine your prose, and compare documents — all from your mobile device. Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

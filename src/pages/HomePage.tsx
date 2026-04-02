import { motion } from 'framer-motion';
import { Settings, ChevronRight } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const stats = (() => {
    try {
      const h = JSON.parse(localStorage.getItem('syntax-history') || '[]');
      return {
        scans: h.filter((e: any) => e.type === 'detection').length,
        humanized: h.filter((e: any) => e.type === 'humanize').length,
        compared: h.filter((e: any) => e.type === 'similarity').length,
      };
    } catch { return { scans: 0, humanized: 0, compared: 0 }; }
  })();

  const tools = [
    { emoji: '🔍', title: 'AI Detector', subtitle: 'Detect AI-written text instantly', page: 'detect', accent: 'hsl(var(--primary))' },
    { emoji: '✍️', title: 'Humanizer', subtitle: 'Make AI text sound human', page: 'humanize', accent: '#A78BFA' },
    { emoji: '📊', title: 'Similarity Checker', subtitle: 'Compare two texts accurately', page: 'similarity', accent: '#7C3AED' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Header — 56px */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between shrink-0"
        style={{ height: 56, padding: '0 16px' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg" />
            <div className="relative w-7 h-7 rounded-full gradient-purple-btn flex items-center justify-center">
              <span className="text-primary-foreground font-display text-xs">C</span>
            </div>
          </div>
          <div>
            <h1 className="font-display text-base text-foreground tracking-tight leading-none">ClarityScribe</h1>
            <p className="text-[9px] text-muted-foreground leading-none mt-0.5">AI Writing Toolkit</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
        >
          <Settings size={18} className="text-primary" strokeWidth={1.5} />
        </button>
      </motion.div>

      {/* Hero — auto height, compact */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="shrink-0"
        style={{ padding: '8px 16px 0' }}
      >
        <h2 className="font-display text-foreground leading-tight" style={{ fontSize: 22 }}>
          Your AI Writing<br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Toolkit 🚀</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Detect, Humanize & Compare — instantly</p>
      </motion.div>

      {/* Stats row — 48px */}
      <div className="flex items-center shrink-0" style={{ height: 48, padding: '0 16px' }}>
        <span className="text-foreground font-semibold text-xs">10K+</span>
        <span className="text-muted-foreground text-[10px] ml-1">Scans</span>
        <span className="mx-2.5 w-px h-3.5 bg-border" />
        <span className="text-foreground font-semibold text-xs">99%</span>
        <span className="text-muted-foreground text-[10px] ml-1">Accurate</span>
        <span className="mx-2.5 w-px h-3.5 bg-border" />
        <span className="text-foreground font-semibold text-xs">Free</span>
      </div>

      {/* Tools — flex 1, fills remaining */}
      <div className="flex flex-col gap-2.5 min-h-0" style={{ flex: 1, padding: '0 16px 8px' }}>
        {tools.map((tool, i) => (
          <motion.button
            key={tool.page}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate(tool.page)}
            className="flex items-center gap-3 bg-card rounded-2xl shadow-card"
            style={{
              flex: 1,
              maxHeight: 90,
              padding: '12px 14px',
              border: '1px solid hsl(var(--border))',
              borderLeft: `3px solid ${tool.accent}`,
              textAlign: 'left',
            }}
          >
            <div
              className="flex items-center justify-center shrink-0 rounded-xl"
              style={{ width: 36, height: 36, backgroundColor: `${tool.accent}15` }}
            >
              <span className="text-base">{tool.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground tracking-tight leading-tight">{tool.title}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{tool.subtitle}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </motion.button>
        ))}
      </div>

      {/* Bottom stats row */}
      <div className="grid grid-cols-3 gap-2 shrink-0" style={{ padding: '0 16px 12px' }}>
        {[
          { label: 'Scans Done', value: stats.scans },
          { label: 'Humanized', value: stats.humanized },
          { label: 'Compared', value: stats.compared },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-xl text-center shadow-card"
            style={{ padding: '8px 4px', border: '1px solid hsl(var(--border))' }}
          >
            <span className="text-lg font-display text-primary block leading-none">{s.value}</span>
            <span className="text-[9px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

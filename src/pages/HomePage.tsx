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
    {
      emoji: '🔍',
      title: 'AI Detector',
      subtitle: 'Detect AI-written text instantly',
      page: 'detect',
      borderColor: '#8B5CF6',
    },
    {
      emoji: '✍️',
      title: 'Humanizer',
      subtitle: 'Make AI text sound human',
      page: 'humanize',
      borderColor: '#A78BFA',
    },
    {
      emoji: '📊',
      title: 'Similarity Checker',
      subtitle: 'Compare two texts accurately',
      page: 'similarity',
      borderColor: '#7C3AED',
      fullWidth: true,
    },
  ];

  return (
    <div className="min-h-svh px-6 pt-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between mb-10"
      >
        <div className="flex items-center gap-3">
          {/* Glowing orb */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg animate-pulse-glow" />
            <div className="relative w-8 h-8 rounded-full gradient-purple-btn flex items-center justify-center">
              <span className="text-white font-display text-sm">C</span>
            </div>
          </div>
          <div>
            <h1 className="font-display text-xl text-foreground tracking-tight">ClarityScribe</h1>
            <p className="text-[10px] text-muted-foreground">AI Writing Toolkit</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-card transition-colors"
        >
          <Settings size={18} className="text-primary" strokeWidth={1.5} />
        </button>
      </motion.div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight">
          Your AI Writing<br />
          <span className="bg-gradient-to-r from-primary to-[#A78BFA] bg-clip-text text-transparent">Toolkit 🚀</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-3">
          Detect, Humanize & Compare — instantly
        </p>
        {/* Stats row */}
        <div className="flex items-center gap-0 mt-4 text-xs text-muted-foreground">
          <span className="text-foreground font-semibold">10K+</span>&nbsp;Scans
          <span className="mx-3 w-px h-4 bg-border" />
          <span className="text-foreground font-semibold">99%</span>&nbsp;Accurate
          <span className="mx-3 w-px h-4 bg-border" />
          <span className="text-foreground font-semibold">Free</span>
        </div>
      </motion.div>

      {/* Tool Cards */}
      <div className="space-y-3">
        {tools.map((tool, i) => (
          <motion.button
            key={tool.page}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate(tool.page)}
            className={`w-full bg-card rounded-2xl p-5 text-left flex items-center gap-4 shadow-card transition-all duration-200 hover:shadow-card-hover hover:glow-purple-sm group ${tool.fullWidth ? '' : ''}`}
            style={{
              borderLeft: `3px solid ${tool.borderColor}`,
              border: `1px solid rgba(139, 92, 246, 0.2)`,
              borderLeftWidth: 3,
              borderLeftColor: tool.borderColor,
            }}
          >
            {/* Icon with glow */}
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-xl blur-md" style={{ backgroundColor: `${tool.borderColor}20` }} />
              <div className="relative w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${tool.borderColor}15` }}>
                <span className="text-lg">{tool.emoji}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">{tool.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{tool.subtitle}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </motion.button>
        ))}
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="grid grid-cols-3 gap-3 mt-10"
      >
        {[
          { label: 'Scans Done', value: stats.scans },
          { label: 'Humanized', value: stats.humanized },
          { label: 'Compared', value: stats.compared },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-2xl p-4 text-center shadow-card"
            style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}
          >
            <span className="text-xl font-display text-primary block">{s.value}</span>
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Version */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 text-center"
      >
        <span className="text-[10px] text-muted-foreground/40 font-mono">ClarityScribe v3.0</span>
      </motion.div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import logoImg from '@/assets/logo.png';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center shrink-0"
        style={{ height: 56, padding: '0 16px' }}
      >
        <div className="flex items-center gap-2.5">
          <img
            src={logoImg}
            alt="AIdusk logo"
            style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'contain' }}
          />
          <div>
            <h1 className="font-display text-base text-foreground tracking-tight leading-none">
              <span style={{ fontWeight: 800, color: '#FFFFFF' }}>AI</span>
              <span style={{ fontWeight: 800, color: '#8B5CF6' }}>dusk</span>
            </h1>
            <p className="leading-none mt-0.5" style={{ fontSize: 11, color: '#4B5563', fontWeight: 400 }}>
              Darkness reveals the truth
            </p>
          </div>
        </div>
      </motion.div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="shrink-0"
        style={{ padding: '8px 16px 0' }}
      >
        <h2 className="font-display leading-tight" style={{ fontSize: 28 }}>
          <span style={{ fontWeight: 800, color: '#FFFFFF' }}>AI written?</span>
          <br />
          <span style={{ fontWeight: 800, color: '#8B5CF6' }}>We'll know.</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Detect, Humanize & Compare — instantly</p>
      </motion.div>

      {/* Stats row */}
      <div className="flex items-center shrink-0" style={{ height: 48, padding: '0 16px' }}>
        <span className="text-foreground font-semibold text-xs">10K+</span>
        <span className="text-muted-foreground text-[10px] ml-1">Scans</span>
        <span className="mx-2.5 w-px h-3.5 bg-border" />
        <span className="text-foreground font-semibold text-xs">99%</span>
        <span className="text-muted-foreground text-[10px] ml-1">Accurate</span>
        <span className="mx-2.5 w-px h-3.5 bg-border" />
        <span className="text-foreground font-semibold text-xs">Free</span>
      </div>

      {/* Tools */}
      <div className="flex flex-col gap-2.5 min-h-0" style={{ flex: 1, padding: '0 16px 16px' }}>
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

    </div>
  );
}

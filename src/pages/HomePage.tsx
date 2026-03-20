import ToolCard from '@/components/ToolCard';
import { Scan, Sparkles, GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-svh pb-24 px-5 pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <h1 className="font-display text-2xl text-foreground tracking-tight">Syntax</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Your AI writing toolkit</p>
      </motion.div>

      {/* Tool Cards */}
      <div className="space-y-3">
        {[
          {
            icon: Scan,
            title: 'AI Text Detector',
            description: 'Estimate the probability of AI-generated content.',
            path: '/detect',
            accentClass: 'text-destructive',
            delay: 0.1,
          },
          {
            icon: Sparkles,
            title: 'Text Humanizer',
            description: 'Refine your prose into natural, human-like writing.',
            path: '/humanize',
            accentClass: 'text-primary',
            delay: 0.2,
          },
          {
            icon: GitCompare,
            title: 'Similarity Checker',
            description: 'Compare two texts for semantic overlap.',
            path: '/similarity',
            accentClass: 'text-warning',
            delay: 0.3,
          },
        ].map((card) => (
          <motion.div
            key={card.path}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: card.delay, ease: [0.16, 1, 0.3, 1] }}
          >
            <ToolCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* Version badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-10 flex justify-center"
      >
        <span className="text-[10px] text-muted-foreground/40 font-mono">v1.0.0</span>
      </motion.div>
    </div>
  );
}

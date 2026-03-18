import ToolCard from '@/components/ToolCard';
import { Scan, Sparkles, GitCompare } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-svh pb-20 px-4 pt-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-xl text-foreground">Syntax</h1>
        <p className="text-xs text-muted-foreground mt-1">Your AI writing toolkit</p>
      </div>

      {/* Tool Cards */}
      <div className="space-y-3">
        <ToolCard
          icon={Scan}
          title="AI Text Detector"
          description="Estimate the probability of AI-generated content."
          path="/detect"
          accentClass="text-destructive"
        />
        <ToolCard
          icon={Sparkles}
          title="Text Humanizer"
          description="Refine your prose into natural, human-like writing."
          path="/humanize"
          accentClass="text-accent"
        />
        <ToolCard
          icon={GitCompare}
          title="Similarity Checker"
          description="Compare two texts for overlap and structural similarity."
          path="/similarity"
          accentClass="text-warning"
        />
      </div>

      {/* Ad placeholder */}
      <div className="mt-8 h-14 rounded-xl bg-secondary border border-border flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Ad Space</span>
      </div>
    </div>
  );
}

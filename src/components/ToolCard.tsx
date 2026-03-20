import { motion } from 'framer-motion';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  accentClass?: string;
}

export default function ToolCard({ title, description, icon: Icon, path, accentClass = 'text-muted-foreground' }: ToolCardProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(path)}
      className="w-full bg-card border border-border rounded-2xl p-5 text-left flex items-center gap-4 shadow-resting transition-all duration-200 hover:shadow-active hover:border-primary/20 group"
    >
      <div className={`w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0 ${accentClass} group-hover:shadow-glow transition-shadow duration-300`}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
    </motion.button>
  );
}

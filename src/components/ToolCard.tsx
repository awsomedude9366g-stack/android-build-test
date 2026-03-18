import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
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
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(path)}
      className="w-full bg-card border border-border p-4 rounded-xl shadow-resting text-left flex items-start gap-4 transition-shadow hover:shadow-active active:shadow-active"
    >
      <div className={`mt-0.5 ${accentClass}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </motion.button>
  );
}

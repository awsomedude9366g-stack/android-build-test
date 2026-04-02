import { Home, Clock, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface VerticalNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const items = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function VerticalNav({ activeTab, onNavigate }: VerticalNavProps) {
  const activePages = ['home', 'history', 'settings'];
  const currentActive = activePages.includes(activeTab) ? activeTab : 'home';

  return (
    <nav
      className="flex flex-col items-center justify-center gap-7"
      style={{
        width: 56,
        minWidth: 56,
        height: '100dvh',
        background: 'hsl(var(--secondary))',
        borderLeft: '1px solid hsl(var(--border))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {items.map((item) => {
        const active = currentActive === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="relative flex flex-col items-center justify-center"
            style={{
              width: 44,
              height: 56,
              borderRadius: 12,
              gap: 3,
            }}
          >
            {active && (
              <motion.div
                layoutId="vnav-pill"
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-sm"
                style={{ width: 3, height: 28, backgroundColor: 'hsl(var(--primary))' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon
              size={20}
              strokeWidth={active ? 2 : 1.5}
              className="transition-colors duration-200"
              style={{
                color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                filter: active ? 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.5))' : 'none',
              }}
            />
            <span
              className="transition-colors duration-200"
              style={{
                fontSize: 8,
                fontWeight: 500,
                color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

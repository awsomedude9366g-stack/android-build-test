import { Home, Clock, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

type Tab = 'detect' | 'humanize' | 'similarity' | 'home' | 'history' | 'settings';

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
      className="fixed right-0 top-0 bottom-0 z-[1000] flex flex-col items-center justify-center gap-8"
      style={{
        width: 60,
        background: '#12102A',
        borderLeft: '1px solid rgba(139, 92, 246, 0.2)',
      }}
    >
      {items.map((item) => {
        const active = currentActive === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="relative flex flex-col items-center gap-1 group"
            style={{ transition: 'transform 0.2s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {/* Active indicator pill */}
            {active && (
              <motion.div
                layoutId="vnav-pill"
                className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-full"
                style={{ backgroundColor: '#8B5CF6' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon
              size={20}
              strokeWidth={active ? 2 : 1.5}
              className="transition-colors duration-200"
              style={{
                color: active ? '#8B5CF6' : '#4D3F77',
                filter: active ? 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.5))' : 'none',
              }}
            />
            <span
              className="transition-colors duration-200"
              style={{
                fontSize: 9,
                fontWeight: 500,
                color: active ? '#8B5CF6' : '#4D3F77',
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

import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 glass border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 px-5 py-2 relative active:scale-[0.95] transition-transform"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute -top-px left-3 right-3 h-[2px] bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                className={`transition-colors duration-200 ${active ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

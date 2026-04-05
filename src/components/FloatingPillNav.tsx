import { Home, Clock, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingPillNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const items = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function FloatingPillNav({ activeTab, onNavigate }: FloatingPillNavProps) {
  const activePages = ['home', 'history', 'settings'];
  const currentActive = activePages.includes(activeTab) ? activeTab : 'home';

  return (
    <>
      {/* Glow under pill */}
      <div
        style={{
          position: 'fixed',
          bottom: 55,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 180,
          height: 16,
          background: 'radial-gradient(ellipse at center, rgba(109,40,217,0.55) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
      />

      {/* Pill background */}
      <div
        style={{
          position: 'fixed',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 220,
          height: 52,
          background: '#13113A',
          border: '1.5px solid rgba(139,92,246,0.45)',
          borderRadius: 30,
          boxShadow: '0 4px 20px rgba(109,40,217,0.45)',
          zIndex: 9999,
        }}
      />

      {/* Icons row */}
      <div
        style={{
          position: 'fixed',
          bottom: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 220,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          zIndex: 10000,
          pointerEvents: 'auto',
        }}
      >
        {items.map((item) => {
          const active = currentActive === item.id;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                padding: '4px 8px',
                background: 'none',
                border: 'none',
              }}
            >
              <motion.div
                animate={{
                  y: 0,
                  background: active ? '#6D28D9' : '#1E1B4B',
                  boxShadow: active
                    ? '0 0 16px rgba(109,40,217,0.85), 0 -4px 14px rgba(109,40,217,0.4), 0 4px 10px rgba(0,0,0,0.3)'
                    : 'none',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: active ? 'none' : '1px solid #312E81',
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={1.8}
                  style={{ color: active ? '#FFFFFF' : '#4B5563' }}
                />
              </motion.div>

              <motion.span
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: active ? '#A78BFA' : '#4B5563',
                }}
              >
                {item.label}
              </motion.span>

              {active && (
                <motion.div
                  layoutId="pill-dot"
                  animate={{ y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#8B5CF6',
                    boxShadow: '0 0 6px rgba(139,92,246,0.8)',
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </>
  );
}

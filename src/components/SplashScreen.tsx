import { useState, useEffect } from 'react';

export default function SplashScreen({ onFinished }: { onFinished: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const duration = 2500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      // ease-in-out
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setProgress(eased * 100);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        setFading(true);
        setTimeout(onFinished, 400);
      }
    };
    requestAnimationFrame(tick);
  }, [onFinished]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(160deg, #0a0520 0%, #07071a 50%, #0d0520 100%)',
        zIndex: 99999,
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Top left glow */}
      <div style={{
        position: 'absolute', top: -40, left: -40, width: 200, height: 200,
        background: 'radial-gradient(circle, rgba(109,40,217,0.3) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />

      {/* Bottom right glow */}
      <div style={{
        position: 'absolute', bottom: 60, right: -20, width: 160, height: 160,
        background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      {/* Center content */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', position: 'relative', zIndex: 10,
      }}>
        {/* Logo box */}
        <div style={{
          width: 70, height: 70, borderRadius: 22,
          background: 'linear-gradient(135deg, #1e0a40, #6d28d9)',
          boxShadow: '0 0 40px rgba(109,40,217,0.8), 0 0 80px rgba(109,40,217,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Moon crescent */}
          <div style={{ position: 'relative', width: 32, height: 32 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#ddd6fe',
            }} />
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: '#4c1d95',
              position: 'absolute', top: -4, right: -6,
            }} />
          </div>
        </div>

        {/* App name */}
        <div style={{
          marginTop: 20, fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 30, fontWeight: 800, letterSpacing: -0.5,
        }}>
          <span style={{ color: '#FFFFFF' }}>AI</span>
          <span style={{ color: '#8B5CF6' }}>dusk</span>
        </div>

        {/* Subtitle */}
        <div style={{
          marginTop: 5, fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 8.5, color: '#6D28D9', letterSpacing: 3, textTransform: 'uppercase',
        }}>
          AI WRITING TOOLKIT
        </div>

        {/* Line */}
        <div style={{
          width: 50, height: 1, margin: '14px auto',
          background: 'linear-gradient(90deg, transparent, #6D28D9, transparent)',
        }} />

        {/* Tagline */}
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 9,
          color: '#4B5563', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.5,
        }}>
          Darkness reveals the truth
        </div>

        {/* Loading bar */}
        <div style={{
          marginTop: 22, width: 90, height: 3,
          background: '#1E1B4B', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'linear-gradient(90deg, #6D28D9, #A78BFA)',
            width: `${progress}%`,
            transition: 'width 0.05s linear',
          }} />
        </div>

        {/* Loading text */}
        <div style={{
          marginTop: 6, fontSize: 6.5, color: '#4B5563', letterSpacing: 0.5,
        }}>
          Initializing...
        </div>
      </div>

      {/* Version */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        textAlign: 'center', fontSize: 6.5, color: '#2D2B5A',
      }}>
        v1.0.0
      </div>
    </div>
  );
}

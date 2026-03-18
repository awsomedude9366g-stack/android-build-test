import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Shield, Scan, Sparkles, ArrowRight } from 'lucide-react';

const slides = [
  {
    icon: Sparkles,
    title: 'Text Humanizer',
    description: 'Refine AI-generated prose into natural, human-like writing. Choose from multiple modes — simple, academic, casual — to match your tone.',
  },
  {
    icon: Scan,
    title: 'AI Text Detector',
    description: 'Analyze any text to estimate the likelihood of AI authorship. Get transparent probability scores with clear explanations.',
  },
  {
    icon: Shield,
    title: 'Write with certainty.',
    description: 'Syntax is your professional AI writing toolkit. Detect, refine, and compare text — all in one place. Secure, fast, and built for mobile.',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const navigate = useNavigate();

  const finish = () => {
    setOnboarded();
    navigate('/', { replace: true });
  };

  const isLast = step === slides.length - 1;
  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <div className="min-h-svh flex flex-col bg-background px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-8">
              <Icon size={32} className="text-accent" />
            </div>
            <h1 className="font-display text-2xl text-foreground mb-3">{slide.title}</h1>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">{slide.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mb-8">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-accent' : 'w-1.5 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      <button
        onClick={isLast ? finish : () => setStep(step + 1)}
        className="h-12 w-full bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
      >
        {isLast ? 'Get Started' : 'Next'}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

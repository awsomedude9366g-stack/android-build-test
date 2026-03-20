import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Shield, Scan, Sparkles, ArrowRight } from 'lucide-react';

const slides = [
  {
    icon: Sparkles,
    title: 'Text Humanizer',
    description: 'Transform AI-generated text into natural, human-like writing. Multiple modes — simple, academic, casual — to match your voice.',
  },
  {
    icon: Scan,
    title: 'AI Text Detector',
    description: 'Analyze any text with advanced statistical and AI-driven analysis to estimate the probability of AI authorship.',
  },
  {
    icon: Shield,
    title: 'Write with certainty.',
    description: 'Syntax is your professional AI writing toolkit. Detect, refine, and compare text — all in one place.',
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
            initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 shadow-glow">
              <Icon size={36} className="text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-2xl text-foreground mb-3 tracking-tight">{slide.title}</h1>
            <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed">{slide.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mb-8">
        {slides.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === step ? 24 : 6,
              backgroundColor: i === step ? 'hsl(224, 100%, 65%)' : 'hsl(225, 10%, 25%)',
            }}
            className="h-1.5 rounded-full"
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={isLast ? finish : () => setStep(step + 1)}
        className="w-full bg-primary text-primary-foreground rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:shadow-glow"
        style={{ height: '52px' }}
      >
        {isLast ? 'Get Started' : 'Next'}
        <ArrowRight size={16} strokeWidth={2} />
      </motion.button>
    </div>
  );
}

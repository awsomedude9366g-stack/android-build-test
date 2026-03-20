import { motion } from 'framer-motion';

interface ResultGaugeProps {
  percentage: number; // 0–100, AI probability
}

export default function ResultGauge({ percentage }: ResultGaugeProps) {
  const radius = 58;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage <= 35
      ? 'hsl(152, 69%, 47%)'  // success
      : percentage <= 65
      ? 'hsl(38, 92%, 50%)'   // warning
      : 'hsl(0, 72%, 56%)';   // destructive

  const trackColor = 'hsl(225, 10%, 15%)';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          {/* Track */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={trackColor}
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress */}
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-semibold text-foreground">{percentage}</span>
          <span className="text-[10px] text-muted-foreground font-medium">% AI</span>
        </div>
      </div>
    </div>
  );
}

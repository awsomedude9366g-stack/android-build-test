interface ResultGaugeProps {
  percentage: number; // 0–100, AI probability
}

export default function ResultGauge({ percentage }: ResultGaugeProps) {
  const segments = 10;

  const getColor = (i: number) => {
    const threshold = percentage / segments;
    if (i < threshold) {
      if (i < 3.5) return 'bg-success';
      if (i < 6.5) return 'bg-warning';
      return 'bg-destructive';
    }
    return 'bg-secondary';
  };

  return (
    <div className="flex gap-1">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`h-3 flex-1 rounded-sm transition-colors duration-300 ${getColor(i)}`}
        />
      ))}
    </div>
  );
}

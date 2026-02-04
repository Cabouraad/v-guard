import { cn } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function ScoreRing({ 
  score, 
  maxScore = 100, 
  size = 'md', 
  label,
  className 
}: ScoreRingProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  
  const dimensions = {
    sm: { size: 64, stroke: 4, fontSize: 'text-lg' },
    md: { size: 96, stroke: 6, fontSize: 'text-2xl' },
    lg: { size: 128, stroke: 8, fontSize: 'text-4xl' },
  };

  const { size: dim, stroke, fontSize } = dimensions[size];
  const radius = (dim - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-status-success stroke-status-success';
    if (pct >= 60) return 'text-severity-medium stroke-severity-medium';
    if (pct >= 40) return 'text-severity-high stroke-severity-high';
    return 'text-severity-critical stroke-severity-critical';
  };

  const colorClass = getScoreColor(percentage);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: dim, height: dim }}>
        {/* Background ring */}
        <svg className="absolute inset-0 -rotate-90" width={dim} height={dim}>
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/30"
          />
        </svg>
        
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" width={dim} height={dim}>
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-700 ease-out", colorClass)}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold font-mono", fontSize, colorClass.split(' ')[0])}>
            {score}
          </span>
        </div>
      </div>

      {label && (
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      )}
    </div>
  );
}

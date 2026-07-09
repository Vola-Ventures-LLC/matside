import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  completed: number;
  total: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function OnboardingProgress({
  completed,
  total,
  size = "md",
  showLabel = true,
  className,
}: OnboardingProgressProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completed} of {total} complete</span>
          <span>{percent}%</span>
        </div>
      )}
      <Progress value={percent} className={sizeClasses[size]} />
    </div>
  );
}

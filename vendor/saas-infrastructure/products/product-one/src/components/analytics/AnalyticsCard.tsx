import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function AnalyticsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  className,
  variant = "default",
}: AnalyticsCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-3 w-3" />;
    return trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "text-muted-foreground";
    if (variant === "danger") return trend > 0 ? "text-destructive" : "text-emerald-500";
    return trend > 0 ? "text-emerald-500" : "text-destructive";
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-emerald-500/20 bg-emerald-500/5";
      case "warning":
        return "border-amber-500/20 bg-amber-500/5";
      case "danger":
        return "border-destructive/20 bg-destructive/5";
      default:
        return "";
    }
  };

  return (
    <Card className={cn(getVariantStyles(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend !== undefined && (
            <span className={cn("flex items-center gap-1 text-xs font-medium", getTrendColor())}>
              {getTrendIcon()}
              {Math.abs(trend)}%
            </span>
          )}
          {(description || trendLabel) && (
            <p className="text-xs text-muted-foreground">
              {trendLabel || description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

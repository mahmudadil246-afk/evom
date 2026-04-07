import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatPrice";

interface ComparisonMetric {
  label: string;
  current: number;
  previous: number;
  format: "currency" | "number" | "percent";
}

interface PeriodComparisonProps {
  metrics: ComparisonMetric[];
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  loading?: boolean;
}

const metricAccents = [
  { bg: "bg-primary/8", border: "border-primary/15", text: "text-primary" },
  { bg: "bg-accent/8", border: "border-accent/15", text: "text-accent" },
  { bg: "bg-success/8", border: "border-success/15", text: "text-success" },
  { bg: "bg-warning/8", border: "border-warning/15", text: "text-warning" },
];

export function PeriodComparison({
  metrics,
  currentPeriodLabel,
  previousPeriodLabel,
  loading = false,
}: PeriodComparisonProps) {
  const formatValue = (value: number, format: "currency" | "number" | "percent") => {
    switch (format) {
      case "currency":
        return `${formatPrice(value)}`;
      case "percent":
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="h-3 w-14 bg-muted rounded" />
              <div className="h-6 w-20 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-primary font-medium">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {currentPeriodLabel}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            {previousPeriodLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((metric, idx) => {
          const change = calculateChange(metric.current, metric.previous);
          const isPositive = change > 0;
          const isNeutral = change === 0;
          const accent = metricAccents[idx % metricAccents.length];

          return (
            <div
              key={metric.label}
              className={cn(
                "rounded-lg border p-3 transition-all duration-200 hover:shadow-sm",
                accent.bg, accent.border
              )}
            >
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{metric.label}</p>
              <p className="text-lg font-bold text-foreground tracking-tight">
                {formatValue(metric.current, metric.format)}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[11px] text-muted-foreground">
                  vs {formatValue(metric.previous, metric.format)}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-1.5 py-0.5",
                  isPositive && "text-success bg-success/10",
                  !isPositive && !isNeutral && "text-destructive bg-destructive/10",
                  isNeutral && "text-muted-foreground bg-muted"
                )}>
                  {isNeutral ? (
                    <Minus className="h-2.5 w-2.5" />
                  ) : isPositive ? (
                    <ArrowUp className="h-2.5 w-2.5" />
                  ) : (
                    <ArrowDown className="h-2.5 w-2.5" />
                  )}
                  {Math.abs(change).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

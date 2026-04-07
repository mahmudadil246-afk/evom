import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  iconBg?: "primary" | "accent" | "success" | "warning";
}

const iconBgClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

const borderAccent = {
  primary: "border-l-primary",
  accent: "border-l-accent",
  success: "border-l-success",
  warning: "border-l-warning",
};

const cardBgClasses = {
  primary: "bg-primary/5 dark:bg-primary/10",
  accent: "bg-accent/5 dark:bg-accent/10",
  success: "bg-success/5 dark:bg-success/10",
  warning: "bg-warning/5 dark:bg-warning/10",
};

export function StatsCard({ title, value, change, icon: Icon, iconBg = "primary" }: StatsCardProps) {
  const isPositive = change >= 0;

  return (
    <div className={cn(
      "group relative rounded-xl border border-border/50 p-4 sm:p-5 transition-all duration-300",
      "hover:shadow-md hover:border-border hover:-translate-y-0.5",
      "border-l-[3px]",
      borderAccent[iconBg],
      cardBgClasses[iconBg],
      "animate-fade-in"
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className={cn("rounded-lg p-2", iconBgClasses[iconBg])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
          isPositive 
            ? "bg-success/10 text-success" 
            : "bg-destructive/10 text-destructive"
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-lg sm:text-xl font-bold text-foreground truncate tracking-tight" title={value}>{value}</h3>
        <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">{title}</p>
      </div>
    </div>
  );
}

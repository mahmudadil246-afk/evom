import { Card, CardContent } from "@/components/ui/card";
import { 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Mail,
  Target,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AbandonedCartStats as StatsType } from "@/hooks/useAbandonedCartsData";
import { formatPrice } from "@/lib/formatPrice";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: "positive" | "negative" | "neutral";
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, trend = "neutral", subtitle }: StatCardProps) {
  const borderColor = trend === "positive" ? "border-l-success" : trend === "negative" ? "border-l-destructive" : "border-l-muted-foreground";
  const bgColor = trend === "positive" ? "bg-success/10" : trend === "negative" ? "bg-destructive/10" : "bg-muted";
  const textColor = trend === "positive" ? "text-success" : trend === "negative" ? "text-destructive" : "text-muted-foreground";
  const cardBg = trend === "positive" ? "bg-success/5 dark:bg-success/10" : trend === "negative" ? "bg-destructive/5 dark:bg-destructive/10" : "bg-muted/30 dark:bg-muted/20";

  return (
    <div className={cn(
      "group relative rounded-xl border border-border/50 p-4 sm:p-5 transition-all duration-300",
      "hover:shadow-md hover:border-border hover:-translate-y-0.5 border-l-[3px]",
      borderColor, cardBg, "animate-fade-in"
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-lg sm:text-xl font-bold tracking-tight mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-2", bgColor)}>
          <Icon className={cn("h-5 w-5", textColor)} />
        </div>
      </div>
    </div>
  );
}

interface AbandonedCartStatsProps {
  stats: StatsType;
}

export function AbandonedCartStats({ stats }: AbandonedCartStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Abandoned"
        value={stats.totalAbandoned}
        icon={ShoppingCart}
        trend="negative"
        subtitle="Carts left behind"
      />
      <StatCard
        title="Recovered"
        value={stats.recovered}
        icon={CheckCircle}
        trend="positive"
        subtitle="Successfully recovered"
      />
      <StatCard
        title="Recovery Rate"
        value={`${stats.recoveryRate}%`}
        icon={Target}
        trend={stats.recoveryRate >= 10 ? "positive" : "negative"}
        subtitle="Conversion success"
      />
      <StatCard
        title="Pending Recovery"
        value={stats.pending}
        icon={Clock}
        trend="neutral"
        subtitle="Awaiting action"
      />
      <StatCard
        title="Lost Revenue"
        value={`${formatPrice(stats.totalLostRevenue)}`}
        icon={AlertTriangle}
        trend="negative"
        subtitle="Potential sales lost"
      />
      <StatCard
        title="Recovered Revenue"
        value={`${formatPrice(stats.totalRecoveredRevenue)}`}
        icon={DollarSign}
        trend="positive"
        subtitle="Sales recovered"
      />
      <StatCard
        title="Avg Cart Value"
        value={`${formatPrice(stats.avgCartValue)}`}
        icon={TrendingUp}
        trend="neutral"
        subtitle="Per abandoned cart"
      />
      <StatCard
        title="Reminders Sent"
        value={stats.remindersSent}
        icon={Mail}
        trend="neutral"
        subtitle="Email reminders"
      />
    </div>
  );
}

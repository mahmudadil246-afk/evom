import { ShoppingBag, Clock, Package, Truck, TrendingUp, LucideIcon } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";
import { cn } from "@/lib/utils";

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  revenue: number;
}

interface OrderStatsCardsProps {
  stats: OrderStats;
}

const iconBgClasses: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

const borderAccent: Record<string, string> = {
  primary: "border-l-primary",
  accent: "border-l-accent",
  warning: "border-l-warning",
  success: "border-l-success",
};

const cardBgClasses: Record<string, string> = {
  primary: "bg-primary/5 dark:bg-primary/10",
  accent: "bg-accent/5 dark:bg-accent/10",
  warning: "bg-warning/5 dark:bg-warning/10",
  success: "bg-success/5 dark:bg-success/10",
};

interface StatItem {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

export function OrderStatsCards({ stats }: OrderStatsCardsProps) {
  const cards: StatItem[] = [
    { label: "Total Orders", value: stats.total.toString(), icon: ShoppingBag, color: "primary" },
    { label: "Pending", value: stats.pending.toString(), icon: Clock, color: "warning" },
    { label: "Processing", value: stats.processing.toString(), icon: Package, color: "accent" },
    { label: "Shipped", value: stats.shipped.toString(), icon: Truck, color: "success" },
    { label: "Revenue", value: formatPrice(stats.revenue), icon: TrendingUp, color: "accent" },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "group relative rounded-xl border border-border/50 p-4 sm:p-5 transition-all duration-300",
            "hover:shadow-md hover:border-border hover:-translate-y-0.5",
            "border-l-[3px]",
            borderAccent[card.color],
            cardBgClasses[card.color],
            "animate-fade-in"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("rounded-lg p-2", iconBgClasses[card.color])}>
              <card.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-bold text-foreground truncate tracking-tight">{card.value}</h3>
            <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

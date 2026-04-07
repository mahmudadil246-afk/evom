import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import type { TopProduct } from "@/hooks/useDashboardData";
import { formatPrice } from "@/lib/formatPrice";
import { cn } from "@/lib/utils";

interface TopProductsProps {
  products?: TopProduct[];
  loading?: boolean;
}

const rankColors = [
  "bg-primary text-primary-foreground",
  "bg-accent text-accent-foreground",
  "bg-warning text-warning-foreground",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
];

export function TopProducts({ products = [], loading = false }: TopProductsProps) {
  const maxStock = products.length > 0 ? Math.max(...products.map(p => p.quantity)) : 100;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-1.5 w-full" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Package className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No products yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="group flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all duration-200"
            >
              <span className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                rankColors[index] || rankColors[4]
              )}>
                {index + 1}
              </span>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-[11px] text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{formatPrice(product.price)}</p>
                    <p className="text-[10px] text-muted-foreground">{product.quantity} in stock</p>
                  </div>
                </div>
                <Progress value={(product.quantity / maxStock) * 100} className="h-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

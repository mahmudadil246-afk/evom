import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";

interface SalesDataPoint {
  name: string;
  sales: number;
  orders: number;
}

interface SalesChartProps {
  data?: SalesDataPoint[];
  loading?: boolean;
}

export function SalesChart({ data = [], loading = false }: SalesChartProps) {
  if (loading) {
    return <Skeleton className="h-60 sm:h-72 w-full rounded-lg" />;
  }

  const hasData = data.some(d => d.sales > 0);
  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);

  return (
    <div>
      {hasData && (
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">{formatPrice(totalSales)}</span>
          <span className="text-[11px] text-muted-foreground">total in period</span>
        </div>
      )}
      <div className="h-56 sm:h-64">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <TrendingUp className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No sales data available yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={(value) => `${formatPrice(value / 1000)}k`}
                width={45}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  padding: "8px 12px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  name === 'sales' ? `${formatPrice(value)}` : value,
                  name === 'sales' ? 'Sales' : 'Orders'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#salesGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

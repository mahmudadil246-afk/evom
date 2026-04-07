import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { AbandonedCart } from "@/hooks/useAbandonedCartsData";
import { format, subDays, startOfDay } from "date-fns";
import { useMemo } from "react";

interface RecoveryRateChartProps {
  carts: AbandonedCart[];
}

export function RecoveryRateChart({ carts }: RecoveryRateChartProps) {
  const chartData = useMemo(() => {
    const days = 14;
    const data: { day: string; abandoned: number; recovered: number; rate: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const nextDate = startOfDay(subDays(new Date(), i - 1));
      const dayLabel = format(date, "dd MMM");

      const abandoned = carts.filter((c) => {
        const d = c.abandoned_at ? new Date(c.abandoned_at) : null;
        return d && d >= date && d < nextDate;
      }).length;

      const recovered = carts.filter((c) => {
        const d = c.recovered_at ? new Date(c.recovered_at) : null;
        return d && d >= date && d < nextDate;
      }).length;

      const rate = abandoned > 0 ? Math.round((recovered / abandoned) * 100) : 0;

      data.push({ day: dayLabel, abandoned, recovered, rate });
    }

    return data;
  }, [carts]);

  const hasData = chartData.some((d) => d.abandoned > 0 || d.recovered > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Trend</CardTitle>
        <CardDescription>Abandoned vs recovered carts — last 14 days</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No cart data in the last 14 days
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAbandoned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="abandoned"
                  name="Abandoned"
                  stroke="hsl(var(--destructive))"
                  fillOpacity={1}
                  fill="url(#colorAbandoned)"
                />
                <Area
                  type="monotone"
                  dataKey="recovered"
                  name="Recovered"
                  stroke="hsl(var(--success, 142 71% 45%))"
                  fillOpacity={1}
                  fill="url(#colorRecovered)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

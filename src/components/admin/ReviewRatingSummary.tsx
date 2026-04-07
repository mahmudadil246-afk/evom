import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ReviewRatingSummaryProps {
  reviews: Array<{ rating: number }>;
}

export function ReviewRatingSummary({ reviews }: ReviewRatingSummaryProps) {
  if (reviews.length === 0) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100),
  }));

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          {/* Average */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{reviews.length} reviews</span>
          </div>

          {/* Distribution */}
          <div className="flex-1 space-y-1.5">
            {distribution.map(d => (
              <div key={d.star} className="flex items-center gap-2 text-sm">
                <span className="w-6 text-right text-muted-foreground">{d.star}★</span>
                <Progress value={d.pct} className="h-2 flex-1" />
                <span className="w-10 text-right text-xs text-muted-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

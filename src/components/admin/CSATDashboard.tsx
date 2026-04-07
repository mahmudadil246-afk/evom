import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, TrendingUp, MessageSquare, ThumbsUp } from "lucide-react";
import { useCSATRatings } from "@/hooks/useCSATRatings";
import { format } from "date-fns";

const starColors = [
  "text-red-500",
  "text-orange-500",
  "text-yellow-500",
  "text-lime-500",
  "text-emerald-500",
];

function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= rating ? `${starColors[rating - 1]} fill-current` : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export function CSATDashboard() {
  const {
    ratings,
    isLoading,
    averageRating,
    ratingDistribution,
    satisfactionRate,
    totalRatings,
  } = useCSATRatings();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Avg Rating", value: averageRating.toFixed(1), icon: Star, iconBg: "bg-warning/10 text-warning", border: "border-l-warning", cardBg: "bg-warning/5 dark:bg-warning/10" },
          { label: "Satisfaction Rate", value: `${satisfactionRate.toFixed(0)}%`, icon: ThumbsUp, iconBg: "bg-success/10 text-success", border: "border-l-success", cardBg: "bg-success/5 dark:bg-success/10" },
          { label: "Total Ratings", value: totalRatings, icon: MessageSquare, iconBg: "bg-primary/10 text-primary", border: "border-l-primary", cardBg: "bg-primary/5 dark:bg-primary/10" },
          { label: "4-5 Stars", value: ratingDistribution[4] + ratingDistribution[5], icon: TrendingUp, iconBg: "bg-accent/10 text-accent-foreground", border: "border-l-accent", cardBg: "bg-accent/5 dark:bg-accent/10" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-border/50 p-4 border-l-[3px] transition-all duration-300 hover:shadow-md hover:border-border hover:-translate-y-0.5 ${stat.border} ${stat.cardBg}`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${stat.iconBg}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star as keyof typeof ratingDistribution];
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{star}</span>
                    <Star className={`h-3 w-3 ${starColors[star - 1]} fill-current`} />
                  </div>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Ratings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Ratings</CardTitle>
            <CardDescription>Latest feedback</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px]">
              {ratings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No ratings found
                </div>
              ) : (
                <div className="divide-y">
                  {ratings.slice(0, 10).map((rating) => (
                    <div key={rating.id} className="p-3 hover:bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {rating.customer_name || rating.customer_email || "Unknown"}
                        </span>
                        <RatingStars rating={rating.rating} />
                      </div>
                      {rating.feedback && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {rating.feedback}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(rating.created_at), "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { RatingStars };

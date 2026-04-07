import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardWidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function DashboardWidget({
  id,
  title,
  children,
  onRemove,
  className,
}: DashboardWidgetProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-xl border-border/50 bg-card transition-all duration-300",
        "hover:shadow-md hover:border-border",
        "animate-fade-in",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4 sm:px-5">
        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">{title}</CardTitle>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={onRemove}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-5 sm:pb-5">{children}</CardContent>
    </Card>
  );
}

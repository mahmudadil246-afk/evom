import { differenceInDays, addDays } from "date-fns";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrashPurgeCountdownProps {
  deletedAt: string;
  purgeAfterDays?: number;
}

export function TrashPurgeCountdown({ deletedAt, purgeAfterDays = 30 }: TrashPurgeCountdownProps) {
  const purgeDate = addDays(new Date(deletedAt), purgeAfterDays);
  const daysLeft = differenceInDays(purgeDate, new Date());
  const isUrgent = daysLeft <= 7;
  const isExpired = daysLeft <= 0;

  if (isExpired) {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <AlertTriangle className="h-3 w-3" />
        Purge pending
      </Badge>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs",
      isUrgent ? "text-destructive font-medium" : "text-muted-foreground"
    )}>
      <Clock className="h-3 w-3" />
      {daysLeft}d left
    </span>
  );
}

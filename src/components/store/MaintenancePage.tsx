import { Construction, Clock } from "lucide-react";
import { format } from "date-fns";

interface MaintenancePageProps {
  message: string;
  estimatedEnd: string | null;
}

export function MaintenancePage({ message, estimatedEnd }: MaintenancePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-lg space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Construction className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Under Maintenance
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {message}
          </p>
        </div>

        {estimatedEnd && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Expected back: {format(new Date(estimatedEnd), "MMM d, yyyy h:mm a")}
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground/60">
          We apologize for the inconvenience. Please check back soon.
        </p>
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SEOScoreIndicatorProps {
  title: string | null;
  subtitle: string | null;
  content: any;
  updatedAt?: string | null;
}

function calculateSEOScore(title: string | null, subtitle: string | null, content: any): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 0;
  const maxScore = 5;

  // Title exists and has decent length
  if (title && title.length > 3) {
    score++;
    if (title.length >= 20 && title.length <= 70) score++;
    else issues.push("Title should be 20–70 characters");
  } else {
    issues.push("Missing page title");
  }

  // Subtitle/description exists
  if (subtitle && subtitle.length > 10) {
    score++;
  } else {
    issues.push("Missing or short subtitle/description");
  }

  // Content exists and is non-empty
  if (content && typeof content === "object") {
    const contentStr = JSON.stringify(content);
    if (contentStr.length > 50) score++;
    else issues.push("Content too sparse");
    if (contentStr.length > 300) score++;
    else issues.push("Add more detailed content");
  } else {
    issues.push("No content configured");
  }

  return { score: Math.round((score / maxScore) * 100), issues };
}

export function SEOScoreIndicator({ title, subtitle, content, updatedAt }: SEOScoreIndicatorProps) {
  const { score, issues } = calculateSEOScore(title, subtitle, content);

  const color = score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
  const bgColor = score >= 80 ? "bg-success/10" : score >= 50 ? "bg-warning/10" : "bg-destructive/10";
  const Icon = score >= 80 ? CheckCircle : score >= 50 ? AlertTriangle : XCircle;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${bgColor}`}>
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              <span className={`text-xs font-semibold ${color}`}>{score}%</span>
            </div>
            {updatedAt && (
              <span className="text-[11px] text-muted-foreground">
                Updated {new Date(updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="font-medium text-xs mb-1">SEO Score: {score}%</p>
          {issues.length > 0 ? (
            <ul className="text-xs space-y-0.5">
              {issues.map((issue, i) => (
                <li key={i} className="text-muted-foreground">• {issue}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-success">All checks passed!</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

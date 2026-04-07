import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface ToolBtnProps {
  icon: React.ElementType;
  command?: string;
  value?: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  execCommand: (command: string, value?: string) => void;
}

export const ToolBtn = ({ icon: Icon, command, value: cmdValue, label, active, disabled, execCommand }: ToolBtnProps) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            if (command) execCommand(command, cmdValue);
          }}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground transition-all duration-150",
            "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
            "disabled:opacity-40 disabled:pointer-events-none",
            active && "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const Divider = () => <div className="mx-0.5 h-5 w-px bg-border/60 self-center" />;

interface ToolGroupProps {
  children: React.ReactNode;
  label?: string;
}

export const ToolGroup = ({ children, label }: ToolGroupProps) => (
  <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-muted/40" title={label}>
    {children}
  </div>
);

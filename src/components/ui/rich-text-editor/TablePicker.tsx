import * as React from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table2 } from "lucide-react";

interface TablePickerProps {
  disabled?: boolean;
  onInsertTable: (rows: number, cols: number) => void;
}

export const TablePicker = ({ disabled, onInsertTable }: TablePickerProps) => {
  const [hoverRow, setHoverRow] = React.useState(0);
  const [hoverCol, setHoverCol] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const maxRows = 6;
  const maxCols = 6;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40"
        >
          <Table2 className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="text-xs text-muted-foreground mb-1 text-center">
          {hoverRow > 0 ? `${hoverRow} × ${hoverCol}` : "Select table size"}
        </div>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}>
          {Array.from({ length: maxRows * maxCols }).map((_, i) => {
            const r = Math.floor(i / maxCols) + 1;
            const c = (i % maxCols) + 1;
            const isHighlighted = r <= hoverRow && c <= hoverCol;
            return (
              <button
                key={i}
                type="button"
                className={cn(
                  "h-4 w-4 border rounded-sm transition-colors",
                  isHighlighted ? "bg-primary border-primary" : "bg-background border-input hover:border-primary/50"
                )}
                onMouseEnter={() => { setHoverRow(r); setHoverCol(c); }}
                onMouseLeave={() => { setHoverRow(0); setHoverCol(0); }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onInsertTable(r, c);
                  setOpen(false);
                }}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

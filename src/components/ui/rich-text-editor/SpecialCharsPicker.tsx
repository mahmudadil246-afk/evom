import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Omega } from "lucide-react";
import { SPECIAL_CHARACTERS } from "./constants";

interface SpecialCharsPickerProps {
  disabled?: boolean;
  onInsertChar: (char: string) => void;
}

export const SpecialCharsPicker = ({ disabled, onInsertChar }: SpecialCharsPickerProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40"
        >
          <Omega className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="text-xs text-muted-foreground mb-1">Special Characters</div>
        <div className="grid grid-cols-8 gap-0.5">
          {SPECIAL_CHARACTERS.map((char) => (
            <button
              key={char}
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                onInsertChar(char);
                setOpen(false);
              }}
            >
              {char}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { EMOJI_LIST } from "./constants";

interface EmojiPickerProps {
  disabled?: boolean;
  onInsertEmoji: (emoji: string) => void;
}

export const EmojiPicker = ({ disabled, onInsertEmoji }: EmojiPickerProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40"
        >
          <Smile className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-base"
              onMouseDown={(e) => {
                e.preventDefault();
                onInsertEmoji(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

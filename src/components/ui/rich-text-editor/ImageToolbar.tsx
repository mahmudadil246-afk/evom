import * as React from "react";
import { cn } from "@/lib/utils";
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react";

interface ImageToolbarProps {
  image: HTMLImageElement;
  editorRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  syncContent: () => void;
}

const SIZES = [
  { label: "25%", value: "25%" },
  { label: "50%", value: "50%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" },
];

export const ImageToolbar = ({ image, editorRef, onClose, syncContent }: ImageToolbarProps) => {
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    const updatePos = () => {
      if (!editorRef.current) return;
      const editorRect = editorRef.current.getBoundingClientRect();
      const imgRect = image.getBoundingClientRect();
      setPos({
        top: imgRect.top - editorRect.top - 40,
        left: imgRect.left - editorRect.left + imgRect.width / 2,
      });
    };
    updatePos();

    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current && !toolbarRef.current.contains(e.target as Node) &&
        e.target !== image
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [image, editorRef, onClose]);

  const setSize = (width: string) => {
    image.style.width = width;
    image.style.height = "auto";
    syncContent();
  };

  const setFloat = (float: string) => {
    if (float === "center") {
      image.style.float = "none";
      image.style.display = "block";
      image.style.marginLeft = "auto";
      image.style.marginRight = "auto";
    } else {
      image.style.float = float;
      image.style.display = "";
      image.style.marginLeft = float === "right" ? "8px" : "0";
      image.style.marginRight = float === "left" ? "8px" : "0";
    }
    image.style.marginTop = "4px";
    image.style.marginBottom = "4px";
    syncContent();
  };

  const removeImage = () => {
    image.remove();
    syncContent();
    onClose();
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute z-10 flex items-center gap-0.5 rounded-md border border-border bg-popover p-1 shadow-md"
      style={{ top: `${pos.top}px`, left: `${pos.left}px`, transform: "translateX(-50%)" }}
    >
      {SIZES.map((s) => (
        <button
          key={s.value}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setSize(s.value); }}
          className={cn(
            "h-6 px-1.5 rounded text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
            image.style.width === s.value && "bg-accent text-accent-foreground"
          )}
        >
          {s.label}
        </button>
      ))}
      <div className="mx-0.5 h-4 w-px bg-border" />
      <button type="button" onMouseDown={(e) => { e.preventDefault(); setFloat("left"); }} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
        <AlignLeft className="h-3 w-3" />
      </button>
      <button type="button" onMouseDown={(e) => { e.preventDefault(); setFloat("center"); }} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
        <AlignCenter className="h-3 w-3" />
      </button>
      <button type="button" onMouseDown={(e) => { e.preventDefault(); setFloat("right"); }} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
        <AlignRight className="h-3 w-3" />
      </button>
      <div className="mx-0.5 h-4 w-px bg-border" />
      <button type="button" onMouseDown={(e) => { e.preventDefault(); removeImage(); }} className="h-6 w-6 flex items-center justify-center rounded text-destructive hover:bg-destructive/10 transition-colors">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
};

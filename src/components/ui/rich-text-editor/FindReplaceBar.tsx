import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FindReplaceBarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  syncContent: () => void;
}

export const FindReplaceBar = ({ editorRef, onClose, syncContent }: FindReplaceBarProps) => {
  const [findText, setFindText] = React.useState("");
  const [replaceText, setReplaceText] = React.useState("");

  const handleFind = () => {
    if (!findText) return;
    (window as any).find(findText, false, false, true, false, false, false);
  };

  const handleReplace = () => {
    if (!findText) return;
    const sel = window.getSelection();
    if (sel && sel.toString().toLowerCase() === findText.toLowerCase()) {
      document.execCommand("insertText", false, replaceText);
      syncContent();
    }
    handleFind();
  };

  const handleReplaceAll = () => {
    if (!findText || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    editorRef.current.innerHTML = html.replace(regex, replaceText);
    syncContent();
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-input px-2 py-1.5 bg-muted/20">
      <Input
        placeholder="Find..."
        value={findText}
        onChange={(e) => setFindText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleFind()}
        className="h-7 w-32 text-xs"
      />
      <Input
        placeholder="Replace..."
        value={replaceText}
        onChange={(e) => setReplaceText(e.target.value)}
        className="h-7 w-32 text-xs"
      />
      <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={handleFind}>
        Find
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={handleReplace}>
        Replace
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={handleReplaceAll}>
        All
      </Button>
      <button
        type="button"
        onClick={onClose}
        className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors ml-auto"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

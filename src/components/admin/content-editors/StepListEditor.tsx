import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface StepItem { title?: string; text?: string; }

interface Props {
  label: string;
  value: StepItem[];
  onChange: (val: StepItem[]) => void;
}

export function StepListEditor({ label, value, onChange }: Props) {
  const items: StepItem[] = Array.isArray(value) ? value : [];

  const update = (i: number, patch: Partial<StepItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { title: "", text: "" }]);
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <Input value={item.title || ""} onChange={(e) => update(i, { title: e.target.value })} placeholder="Title" className="text-sm" />
          <Textarea value={item.text || ""} onChange={(e) => update(i, { text: e.target.value })} placeholder="Description" rows={2} className="text-sm" />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" />Add Step</Button>
    </div>
  );
}

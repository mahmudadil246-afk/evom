import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface CardItem { icon?: string; title?: string; text?: string; }

interface Props {
  label: string;
  value: CardItem[];
  onChange: (val: CardItem[]) => void;
}

export function CardListEditor({ label, value, onChange }: Props) {
  const items: CardItem[] = Array.isArray(value) ? value : [];
  const [expanded, setExpanded] = useState<number | null>(null);

  const update = (i: number, patch: Partial<CardItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => { onChange([...items, { icon: "", title: "", text: "" }]); setExpanded(items.length); };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      {items.map((item, i) => (
        <Card key={i} className="overflow-hidden">
          <button type="button" className="w-full flex items-center gap-2 p-3 text-left text-sm font-medium hover:bg-muted/50" onClick={() => setExpanded(expanded === i ? null : i)}>
            {expanded === i ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            <span className="truncate flex-1">{item.title || `Card #${i + 1}`}</span>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={(e) => { e.stopPropagation(); remove(i); }}><Trash2 className="h-3.5 w-3.5" /></Button>
          </button>
          {expanded === i && (
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="space-y-1"><Label className="text-xs">Icon</Label><Input value={item.icon || ""} onChange={(e) => update(i, { icon: e.target.value })} className="text-sm" placeholder="e.g. map-pin, phone, mail" /></div>
              <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={item.title || ""} onChange={(e) => update(i, { title: e.target.value })} className="text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Text</Label><Textarea value={item.text || ""} onChange={(e) => update(i, { text: e.target.value })} rows={2} className="text-sm" /></div>
            </CardContent>
          )}
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" />Add Card</Button>
    </div>
  );
}

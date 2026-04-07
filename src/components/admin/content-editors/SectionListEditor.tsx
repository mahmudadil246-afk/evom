import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { StringListEditor } from "./StringListEditor";

interface SectionItem {
  heading?: string; body?: string; list?: string[]; icon?: string; extra?: string;
}

interface Props {
  label: string;
  value: SectionItem[];
  onChange: (val: SectionItem[]) => void;
}

export function SectionListEditor({ label, value, onChange }: Props) {
  const items: SectionItem[] = Array.isArray(value) ? value : [];
  const [expanded, setExpanded] = useState<number | null>(null);

  const update = (i: number, patch: Partial<SectionItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => { onChange([...items, { heading: "", body: "", list: [], icon: "" }]); setExpanded(items.length); };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      {items.map((item, i) => (
        <Card key={i} className="overflow-hidden">
          <button type="button" className="w-full flex items-center gap-2 p-3 text-left text-sm font-medium hover:bg-muted/50" onClick={() => setExpanded(expanded === i ? null : i)}>
            {expanded === i ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            <span className="truncate flex-1">{item.heading || `Section #${i + 1}`}</span>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={(e) => { e.stopPropagation(); remove(i); }}><Trash2 className="h-3.5 w-3.5" /></Button>
          </button>
          {expanded === i && (
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="space-y-1"><Label className="text-xs">Heading</Label><Input value={item.heading || ""} onChange={(e) => update(i, { heading: e.target.value })} className="text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Icon</Label><Input value={item.icon || ""} onChange={(e) => update(i, { icon: e.target.value })} className="text-sm" placeholder="e.g. database, eye, shield" /></div>
              <div className="space-y-1"><Label className="text-xs">Body</Label><Textarea value={item.body || ""} onChange={(e) => update(i, { body: e.target.value })} rows={3} className="text-sm" /></div>
              <StringListEditor label="List Items" value={item.list || []} onChange={(list) => update(i, { list })} />
              <div className="space-y-1"><Label className="text-xs">Extra Note</Label><Input value={item.extra || ""} onChange={(e) => update(i, { extra: e.target.value })} className="text-sm" /></div>
            </CardContent>
          )}
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" />Add Section</Button>
    </div>
  );
}

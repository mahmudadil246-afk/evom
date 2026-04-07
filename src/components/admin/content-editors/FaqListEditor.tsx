import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface FaqItem {
  question?: string; q?: string;
  answer?: string; a?: string;
  category?: string;
}

interface Props {
  label: string;
  value: FaqItem[];
  onChange: (val: FaqItem[]) => void;
}

export function FaqListEditor({ label, value, onChange }: Props) {
  const items: FaqItem[] = Array.isArray(value) ? value : [];
  const [expanded, setExpanded] = useState<number | null>(null);

  const normalize = (item: FaqItem): FaqItem => ({
    question: item.question ?? item.q ?? "",
    answer: item.answer ?? item.a ?? "",
    category: item.category ?? "",
  });

  const update = (i: number, patch: Partial<FaqItem>) => {
    const next = [...items];
    next[i] = normalize({ ...next[i], ...patch });
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => {
    onChange([...items, { question: "", answer: "", category: "" }]);
    setExpanded(items.length);
  };

  const getQ = (item: FaqItem) => item.question ?? item.q ?? "";
  const getA = (item: FaqItem) => item.answer ?? item.a ?? "";

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      {items.map((item, i) => (
        <Card key={i} className="overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center gap-2 p-3 text-left text-sm font-medium hover:bg-muted/50"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            {expanded === i ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            <span className="truncate flex-1">{getQ(item) || `FAQ #${i + 1}`}</span>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={(e) => { e.stopPropagation(); remove(i); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </button>
          {expanded === i && (
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Question</Label>
                <Input value={getQ(item)} onChange={(e) => update(i, { question: e.target.value })} className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Answer</Label>
                <Textarea value={getA(item)} onChange={(e) => update(i, { answer: e.target.value })} rows={3} className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Input value={item.category || ""} onChange={(e) => update(i, { category: e.target.value })} className="text-sm" />
              </div>
            </CardContent>
          )}
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" />Add FAQ</Button>
    </div>
  );
}

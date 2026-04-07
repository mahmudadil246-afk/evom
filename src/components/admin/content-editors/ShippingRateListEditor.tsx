import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface RateItem { area?: string; label?: string; cost?: number; days?: string; }

interface Props {
  label: string;
  value: RateItem[];
  onChange: (val: RateItem[]) => void;
}

export function ShippingRateListEditor({ label, value, onChange }: Props) {
  const items: RateItem[] = Array.isArray(value) ? value : [];

  const update = (i: number, patch: Partial<RateItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { area: "", label: "", cost: 0, days: "" }]);

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg p-3 grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label className="text-xs">Area Key</Label><Input value={item.area || ""} onChange={(e) => update(i, { area: e.target.value })} className="text-sm" /></div>
          <div className="space-y-1"><Label className="text-xs">Label</Label><Input value={item.label || ""} onChange={(e) => update(i, { label: e.target.value })} className="text-sm" /></div>
          <div className="space-y-1"><Label className="text-xs">Cost (৳)</Label><Input type="number" value={item.cost ?? 0} onChange={(e) => update(i, { cost: Number(e.target.value) })} className="text-sm" /></div>
          <div className="space-y-1 flex items-end gap-2">
            <div className="flex-1 space-y-1"><Label className="text-xs">Days</Label><Input value={item.days || ""} onChange={(e) => update(i, { days: e.target.value })} className="text-sm" /></div>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" />Add Rate</Button>
    </div>
  );
}

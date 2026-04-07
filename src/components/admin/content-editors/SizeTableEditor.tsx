import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  label: string;
  value: Record<string, string>[];
  onChange: (val: Record<string, string>[]) => void;
}

export function SizeTableEditor({ label, value, onChange }: Props) {
  const rows: Record<string, string>[] = Array.isArray(value) ? value : [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : ["size", "chest", "waist", "hip"];

  const update = (rowIdx: number, col: string, val: string) => {
    const next = [...rows];
    next[rowIdx] = { ...next[rowIdx], [col]: val };
    onChange(next);
  };
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => {
    const empty: Record<string, string> = {};
    columns.forEach((c) => (empty[c] = ""));
    onChange([...rows, empty]);
  };

  const colLabel = (col: string) => col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="text-xs px-2 py-1.5">{colLabel(col)}</TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, ri) => (
              <TableRow key={ri}>
                {columns.map((col) => (
                  <TableCell key={col} className="px-1 py-1">
                    <Input value={row[col] || ""} onChange={(e) => update(ri, col, e.target.value)} className="text-xs h-8" />
                  </TableCell>
                ))}
                <TableCell className="px-1 py-1">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(ri)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" />Add Row</Button>
    </div>
  );
}

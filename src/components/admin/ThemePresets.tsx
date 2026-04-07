import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2 } from "lucide-react";

interface ThemePreset {
  name: string;
  description: string;
  values: Record<string, string>;
  preview: { bg: string; primary: string; text: string; accent: string };
}

const presets: ThemePreset[] = [
  {
    name: "Light Professional",
    description: "Clean, corporate look with neutral tones",
    preview: { bg: "#ffffff", primary: "#1a1a2e", text: "#1a1a2e", accent: "#4361ee" },
    values: {
      primary_color: "231 50% 14%",
      background_color: "0 0% 100%",
      foreground_color: "231 50% 14%",
      accent_color: "228 83% 60%",
      card_color: "0 0% 100%",
      border_color: "220 13% 91%",
      muted_color: "220 8% 46%",
    },
  },
  {
    name: "Dark Modern",
    description: "Sleek dark theme with vibrant accents",
    preview: { bg: "#0f172a", primary: "#6366f1", text: "#f8fafc", accent: "#6366f1" },
    values: {
      dark_primary_color: "239 84% 67%",
      dark_background_color: "222 47% 11%",
      dark_foreground_color: "210 40% 98%",
      dark_card_color: "222 47% 14%",
      primary_color: "239 84% 67%",
      accent_color: "239 84% 67%",
    },
  },
  {
    name: "Warm Boutique",
    description: "Earthy tones for fashion & lifestyle stores",
    preview: { bg: "#faf7f2", primary: "#8b5e3c", text: "#3d2b1f", accent: "#c67b3c" },
    values: {
      primary_color: "26 40% 39%",
      background_color: "36 47% 96%",
      foreground_color: "24 35% 18%",
      accent_color: "28 55% 50%",
      card_color: "36 47% 98%",
      border_color: "30 20% 87%",
    },
  },
  {
    name: "Fresh Minimal",
    description: "Bright, airy with green accents",
    preview: { bg: "#f9fafb", primary: "#059669", text: "#111827", accent: "#059669" },
    values: {
      primary_color: "161 94% 30%",
      background_color: "210 20% 98%",
      foreground_color: "221 39% 11%",
      accent_color: "161 94% 30%",
      card_color: "0 0% 100%",
      border_color: "220 13% 91%",
    },
  },
];

interface ThemePresetsProps {
  onApply: (values: Record<string, string>) => void;
}

export function ThemePresets({ onApply }: ThemePresetsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {presets.map((preset) => (
        <Card key={preset.name} className="overflow-hidden">
          {/* Color preview strip */}
          <div className="flex h-10">
            <div className="flex-1" style={{ backgroundColor: preset.preview.bg }} />
            <div className="flex-1" style={{ backgroundColor: preset.preview.primary }} />
            <div className="flex-1" style={{ backgroundColor: preset.preview.accent }} />
            <div className="flex-1" style={{ backgroundColor: preset.preview.text }} />
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm">{preset.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => onApply(preset.values)}>
                <Wand2 className="h-3.5 w-3.5 mr-1" /> Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

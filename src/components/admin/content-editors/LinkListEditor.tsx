import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ImageIcon, Loader2, Facebook, Twitter, Youtube, Instagram, Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LinkItem { label?: string; href?: string; name?: string; logo?: string; }

const socialIconMap: Record<string, React.ComponentType<any>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  pinterest: Pin,
};

interface Props {
  label: string;
  value: LinkItem[];
  onChange: (val: LinkItem[]) => void;
  type?: "link" | "courier" | "social";
}

export function LinkListEditor({ label, value, onChange, type = "link" }: Props) {
  const items: LinkItem[] = Array.isArray(value) ? value : [];
  const [uploading, setUploading] = useState<number | null>(null);
  const { toast } = useToast();

  const update = (i: number, patch: Partial<LinkItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => {
    if (type === "courier") onChange([...items, { name: "", logo: "" }]);
    else if (type === "social") onChange([...items, { label: "", href: "", logo: "" }]);
    else onChange([...items, { label: "", href: "" }]);
  };

  const handleLogoUpload = async (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be under 5MB", variant: "destructive" });
      return;
    }
    setUploading(index);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `social_logo_${Date.now()}_${index}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("store-assets")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("store-assets").getPublicUrl(fileName);
      update(index, { logo: publicUrl });
      toast({ title: "Uploaded", description: "Logo uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const triggerFileInput = (index: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) handleLogoUpload(index, f);
    };
    input.click();
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {type === "courier" ? (
            <>
              <Input value={item.name || ""} onChange={(e) => update(i, { name: e.target.value })} placeholder="Name" className="text-sm" />
              <Input value={item.logo || ""} onChange={(e) => update(i, { logo: e.target.value })} placeholder="Logo URL" className="text-sm" />
            </>
          ) : type === "social" ? (
            <>
              {item.logo ? (
                <div className="relative shrink-0">
                  <img src={item.logo} alt="" className="h-8 w-8 object-contain rounded border bg-muted p-0.5" />
                  <button
                    type="button"
                    onClick={() => update(i, { logo: "" })}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px]"
                  >
                    ×
                  </button>
                </div>
              ) : (() => {
                const DefaultIcon = socialIconMap[item.label?.toLowerCase() || ""];
                return DefaultIcon ? (
                  <button
                    type="button"
                    className="h-8 w-8 shrink-0 rounded border bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                    title="Click to upload custom logo"
                    disabled={uploading === i}
                    onClick={() => triggerFileInput(i)}
                  >
                    {uploading === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DefaultIcon className="h-4 w-4" />}
                  </button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={uploading === i}
                    onClick={() => triggerFileInput(i)}
                  >
                    {uploading === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  </Button>
                );
              })()}
              <Input value={item.label || ""} onChange={(e) => update(i, { label: e.target.value })} placeholder="Label" className="text-sm" />
              <Input value={item.href || ""} onChange={(e) => update(i, { href: e.target.value })} placeholder="URL" className="text-sm" />
            </>
          ) : (
            <>
              <Input value={item.label || ""} onChange={(e) => update(i, { label: e.target.value })} placeholder="Label" className="text-sm" />
              <Input value={item.href || ""} onChange={(e) => update(i, { href: e.target.value })} placeholder="URL" className="text-sm" />
            </>
          )}
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add {type === "courier" ? "Partner" : type === "social" ? "Social Link" : "Link"}
      </Button>
    </div>
  );
}

import { useState, useRef } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UploadSettings } from "@/components/settings/UploadSettings";
import { MaintenanceModeSettings } from "@/components/settings/MaintenanceModeSettings";
import { useSiteContent, type MergedSection } from "@/hooks/useSiteContent";
import { siteSettingsRegistry, type PageDef } from "@/config/siteContentRegistry";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Upload, Construction, X, ImageIcon, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkListEditor } from "@/components/admin/content-editors";
import { useToast } from "@/hooks/use-toast";

type SidebarItem =
  | { type: "page"; pageDef: PageDef }
  | { type: "upload" }
  | { type: "maintenance" };

const sidebarItems: SidebarItem[] = [
  ...siteSettingsRegistry.map((p) => ({ type: "page" as const, pageDef: p })),
  { type: "upload" },
  { type: "maintenance" },
];

export default function StorePage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const { getSectionConfig, updateSection, toggleSection, loading } = useSiteContent();
  const { toast } = useToast();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = sidebarItems[selectedIdx];

  const startEdit = (section: MergedSection) => {
    setEditingKey(section.def.key);
    setEditForm({ ...section.content });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditForm({});
  };

  const handleSave = async (pageSlug: string, section: MergedSection) => {
    const def = section.def;
    if (def.editableFields.includes("content") && def.contentSchema) {
      const contentObj: Record<string, any> = {};
      for (const key of Object.keys(def.contentSchema)) {
        if (editForm[key] !== undefined) {
          contentObj[key] = editForm[key];
        }
      }
      const success = await updateSection(pageSlug, section.def.key, { content: contentObj });
      if (success) cancelEdit();
    }
  };

  const handleImageUpload = async (fieldKey: string, file: File) => {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "Error", description: "File size must be under 5MB", variant: "destructive" });
      return;
    }
    setUploading(fieldKey);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${fieldKey}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("store-assets")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("store-assets").getPublicUrl(fileName);
      setEditForm((f) => ({ ...f, [fieldKey]: publicUrl }));
      toast({ title: "Uploaded", description: "Image uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const renderFieldEditor = (fieldKey: string, schemaType: string) => {
    const value = editForm[fieldKey] ?? "";
    const label = fieldKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const updateField = (v: any) => setEditForm((f) => ({ ...f, [fieldKey]: v }));

    if (schemaType === "image_upload") {
      return (
        <div key={fieldKey} className="space-y-2">
          <Label className="text-xs font-medium">{label}</Label>
          {value ? (
            <div className="flex items-center gap-3">
              <img src={value} alt={label} className="h-16 w-16 object-contain rounded-lg border bg-muted p-1" />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateField("")}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading === fieldKey}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) handleImageUpload(fieldKey, f);
                  };
                  input.click();
                }}
              >
                {uploading === fieldKey ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Uploading...</>
                ) : (
                  <><ImageIcon className="h-3.5 w-3.5 mr-1" />Upload Image</>
                )}
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (schemaType === "textarea") {
      return (
        <div key={fieldKey} className="space-y-1.5">
          <Label className="text-xs font-medium">{label}</Label>
          <Textarea value={value} onChange={(e) => updateField(e.target.value)} rows={4} className="text-sm" />
        </div>
      );
    }

    if (schemaType === "link_list") {
      return <LinkListEditor key={fieldKey} label={label} value={Array.isArray(value) ? value : []} onChange={updateField} type="link" />;
    }

    if (schemaType === "social_link_list") {
      return <LinkListEditor key={fieldKey} label={label} value={Array.isArray(value) ? value : []} onChange={updateField} type="social" />;
    }

    return (
      <div key={fieldKey} className="space-y-1.5">
        <Label className="text-xs font-medium">{label}</Label>
        <Input value={value} onChange={(e) => updateField(e.target.value)} className="text-sm" />
      </div>
    );
  };

  const renderPageSections = (pageDef: PageDef) => {
    return pageDef.sections.map((sectionDef) => {
      const section = getSectionConfig(pageDef.slug, sectionDef.key);
      if (!section) return null;

      const SectionIcon = section.def.icon;
      const isEditing = editingKey === section.def.key;

      return (
        <Card key={section.def.key} className={cn("transition-all", !section.isEnabled && "opacity-60")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <SectionIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{section.def.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={section.isEnabled ? "default" : "secondary"} className="text-[10px]">
                  {section.isEnabled ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={section.isEnabled}
                  onCheckedChange={(v) => toggleSection(pageDef.slug, section.def.key, v)}
                />
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => startEdit(section)}>Edit</Button>
                )}
                {isEditing && (
                  <Button variant="ghost" size="icon" onClick={cancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {isEditing && section.def.contentSchema && (
              <div className="mt-4 pt-4 border-t space-y-4">
                {Object.entries(section.def.contentSchema).map(([fk, st]) => renderFieldEditor(fk, st))}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleSave(pageDef.slug, section)}>
                    <Save className="h-4 w-4 mr-1.5" />Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    });
  };

  const getItemIcon = (item: SidebarItem) => {
    if (item.type === "page") return item.pageDef.icon;
    if (item.type === "upload") return Upload;
    return Construction;
  };

  const getItemLabel = (item: SidebarItem) => {
    if (item.type === "page") return item.pageDef.label;
    if (item.type === "upload") return "Upload Settings";
    return "Maintenance Mode";
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Store Settings"
        description="Store header, footer, uploads, and maintenance"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-0.5">
                  {sidebarItems.map((item, idx) => {
                    const Icon = getItemIcon(item);
                    const label = getItemLabel(item);

                    return (
                      <button
                        key={idx}
                        onClick={() => { setSelectedIdx(idx); cancelEdit(); }}
                        className={cn(
                          "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                          selectedIdx === idx
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-3">
          {selected.type === "page" ? (
            <>
              <h2 className="text-lg font-semibold">{selected.pageDef.label}</h2>
              {renderPageSections(selected.pageDef)}
            </>
          ) : selected.type === "upload" ? (
            <>
              <h2 className="text-lg font-semibold">Upload Settings</h2>
              <UploadSettings />
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Maintenance Mode</h2>
              <MaintenanceModeSettings />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

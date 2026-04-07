import { useState } from "react";
import { useSiteContent, type MergedSection } from "@/hooks/useSiteContent";
import { siteContentRegistry, type PageDef, type SectionDef } from "@/config/siteContentRegistry";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Save, ExternalLink, Eye, EyeOff, ChevronDown, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  StringListEditor, FaqListEditor, CardListEditor, SectionListEditor,
  StepListEditor, SizeTableEditor, ShippingRateListEditor, LinkListEditor,
} from "@/components/admin/content-editors";

export default function ContentManager() {
  const [selectedPage, setSelectedPage] = useState(siteContentRegistry[0].slug);
  const { getPageSections, updateSection, toggleSection, loading } = useSiteContent();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const pageDef = siteContentRegistry.find((p) => p.slug === selectedPage)!;
  const sections = getPageSections(selectedPage);

  const startEdit = (section: MergedSection) => {
    setEditingKey(section.def.key);
    setEditForm({
      title: section.title || "",
      subtitle: section.subtitle || "",
      badge_text: section.badgeText || "",
      image_url: section.imageUrl || "",
      ...section.content,
    });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditForm({});
  };

  const handleSave = async (section: MergedSection) => {
    const def = section.def;
    const updates: any = {};

    if (def.editableFields.includes("title")) updates.title = editForm.title || null;
    if (def.editableFields.includes("subtitle")) updates.subtitle = editForm.subtitle || null;
    if (def.editableFields.includes("badge")) updates.badge_text = editForm.badge_text || null;
    if (def.editableFields.includes("image")) updates.image_url = editForm.image_url || null;

    if (def.editableFields.includes("content") && def.contentSchema) {
      const contentObj: Record<string, any> = {};
      const structuredTypes = ["faq_list", "card_list", "section_list", "step_list", "string_list", "size_table", "shipping_rate_list", "courier_list", "link_list"];
      for (const key of Object.keys(def.contentSchema)) {
        if (editForm[key] !== undefined) {
          const schemaType = def.contentSchema[key];
          if (structuredTypes.includes(schemaType)) {
            contentObj[key] = editForm[key];
          } else if (schemaType === "number") {
            contentObj[key] = Number(editForm[key]) || 0;
          } else if (schemaType === "boolean") {
            contentObj[key] = editForm[key] === true || editForm[key] === "true";
          } else {
            contentObj[key] = editForm[key];
          }
        }
      }
      updates.content = contentObj;
    }

    const success = await updateSection(selectedPage, section.def.key, updates);
    if (success) {
      setEditingKey(null);
      setEditForm({});
    }
  };

  const renderFieldEditor = (fieldKey: string, schemaType: string) => {
    const value = editForm[fieldKey] ?? "";
    const label = fieldKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const updateField = (v: any) => setEditForm((f) => ({ ...f, [fieldKey]: v }));

    if (schemaType === "boolean") {
      return (
        <div key={fieldKey} className="flex items-center gap-3">
          <Switch checked={value === true || value === "true"} onCheckedChange={updateField} />
          <Label className="text-sm">{label}</Label>
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

    if (schemaType === "string_list") return <StringListEditor key={fieldKey} label={label} value={Array.isArray(value) ? value : []} onChange={updateField} />;
    if (schemaType === "faq_list") return <FaqListEditor key={fieldKey} label={label} value={Array.isArray(value) ? value : []} onChange={updateField} />;
    if (schemaType === "card_list") return <CardListEditor key={fieldKey} label={label} value={Array.isArray(value) ? value : []} onChange={updateField} />;
    if (schemaType === "section_list") return <SectionListEditor key={fieldKey} label={label} value={Array.isArray(value) ? value : []} onChange={updateField} />;
    if (schemaType === "step_list") return <StepListEditor key={fieldKey} label={label} value={Array.isArray(value) ? value : []} onChange={updateField} />;
    if (schemaType === "size_table") return <SizeTableEditor key={fieldKey} label={label} value={Array.isArray(value) ? value : []} onChange={updateField} />;
    if (schemaType === "shipping_rate_list") return <ShippingRateListEditor key={fieldKey} label={label} value={Array.isArray(value) ? value : []} onChange={updateField} />;
    if (schemaType === "courier_list") return <LinkListEditor key={fieldKey} label={label} value={Array.isArray(value) ? value : []} onChange={updateField} type="courier" />;
    if (schemaType === "link_list") return <LinkListEditor key={fieldKey} label={label} value={Array.isArray(value) ? value : []} onChange={updateField} type="link" />;

    return (
      <div key={fieldKey} className="space-y-1.5">
        <Label className="text-xs font-medium">{label}</Label>
        <Input
          type={schemaType === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => updateField(e.target.value)}
          className="text-sm"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <AdminPageHeader
        title="Content Manager"
        description="Manage all storefront pages and sections from one place"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Page Sidebar */}
        <div className="lg:w-64 shrink-0">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold">Pages</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-0.5">
                  {siteContentRegistry.map((page) => {
                    const PageIcon = page.icon;
                    return (
                      <button
                        key={page.slug}
                        onClick={() => { setSelectedPage(page.slug); cancelEdit(); }}
                        className={cn(
                          "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                          selectedPage === page.slug
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <PageIcon className="h-4 w-4 shrink-0" />
                        <span>{page.label}</span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sections Area */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{pageDef.label}</h2>
              <p className="text-sm text-muted-foreground">
                {sections.length} section{sections.length !== 1 ? "s" : ""}
              </p>
            </div>
            {pageDef.storePath && (
              <Button variant="outline" size="sm" asChild>
                <a href={pageDef.storePath} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Preview
                </a>
              </Button>
            )}
          </div>

          {sections.map((section) => {
            const SectionIcon = section.def.icon;
            const isEditing = editingKey === section.def.key;
            const hasEditableFields = section.def.editableFields.length > 0;

            return (
              <Card key={section.def.key} className={cn(
                "transition-all",
                !section.isEnabled && "opacity-60"
              )}>
                <CardContent className="p-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <SectionIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{section.def.label}</p>
                        {section.title && (
                          <p className="text-xs text-muted-foreground truncate">{section.title}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={section.isEnabled ? "default" : "secondary"} className="text-[10px]">
                        {section.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Switch
                        checked={section.isEnabled}
                        onCheckedChange={(v) => toggleSection(selectedPage, section.def.key, v)}
                      />
                      {hasEditableFields && !isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => startEdit(section)}>
                          Edit
                        </Button>
                      )}
                      {isEditing && (
                        <Button variant="ghost" size="icon" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Edit Form */}
                  {isEditing && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {section.def.editableFields.includes("title") && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Title</Label>
                          <Input
                            value={editForm.title || ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder={section.def.defaultTitle || "Section title"}
                            className="text-sm"
                          />
                        </div>
                      )}
                      {section.def.editableFields.includes("subtitle") && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Subtitle</Label>
                          <Input
                            value={editForm.subtitle || ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, subtitle: e.target.value }))}
                            placeholder="Section subtitle"
                            className="text-sm"
                          />
                        </div>
                      )}
                      {section.def.editableFields.includes("badge") && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Badge Text</Label>
                          <Input
                            value={editForm.badge_text || ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, badge_text: e.target.value }))}
                            placeholder={section.def.defaultBadge || "Badge text"}
                            className="text-sm"
                          />
                        </div>
                      )}
                      {section.def.editableFields.includes("image") && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Image URL</Label>
                          <Input
                            value={editForm.image_url || ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, image_url: e.target.value }))}
                            placeholder="https://..."
                            className="text-sm"
                          />
                        </div>
                      )}
                      {section.def.editableFields.includes("content") && section.def.contentSchema && (
                        <>
                          <Separator />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Settings</p>
                          {Object.entries(section.def.contentSchema).map(([fieldKey, schemaType]) =>
                            renderFieldEditor(fieldKey, schemaType)
                          )}
                        </>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={() => handleSave(section)}>
                          <Save className="h-4 w-4 mr-1.5" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

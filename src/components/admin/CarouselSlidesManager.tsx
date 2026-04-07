import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Eye, EyeOff, Image, Video, Youtube, ChevronUp, ChevronDown, Upload, Loader2 } from "lucide-react";

interface Slide {
  id: string;
  title: string | null;
  subtitle: string | null;
  badge_text: string | null;
  image_url: string | null;
  video_url: string | null;
  youtube_url: string | null;
  media_type: string;
  cta_text: string | null;
  cta_link: string | null;
  secondary_cta_text: string | null;
  secondary_cta_link: string | null;
  overlay_color: string | null;
  is_enabled: boolean;
  sort_order: number;
}

export function CarouselSlidesManager() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Slide>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchSlides = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("homepage_carousel_slides")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });
    if (!error && data) setSlides(data as unknown as Slide[]);
    setLoading(false);
  };

  useEffect(() => { fetchSlides(); }, []);

  const addSlide = async () => {
    const maxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.sort_order)) + 1 : 0;
    const { error } = await supabase
      .from("homepage_carousel_slides")
      .insert({ title: "New Slide", media_type: "image", sort_order: maxOrder } as any);
    if (error) {
      toast({ title: "Error", description: "Failed to add slide", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Slide added" });
      fetchSlides();
    }
  };

  const deleteSlide = async (id: string) => {
    const { error } = await supabase
      .from("homepage_carousel_slides")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to move to trash", variant: "destructive" });
    } else {
      toast({ title: "Moved to Trash", description: "Slide moved to trash" });
      if (editingId === id) setEditingId(null);
      fetchSlides();
    }
  };

  const toggleSlide = async (id: string, enabled: boolean) => {
    await supabase.from("homepage_carousel_slides").update({ is_enabled: enabled } as any).eq("id", id);
    fetchSlides();
  };

  const startEdit = (slide: Slide) => {
    setEditingId(slide.id);
    setEditForm({ ...slide });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const { id, ...updates } = editForm as Slide;
    const { error } = await supabase
      .from("homepage_carousel_slides")
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("id", editingId);
    if (error) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Slide updated" });
      setEditingId(null);
      fetchSlides();
    }
    setSaving(false);
  };

  const moveSlide = async (id: string, direction: "up" | "down") => {
    const idx = slides.findIndex(s => s.id === id);
    if ((direction === "up" && idx <= 0) || (direction === "down" && idx >= slides.length - 1)) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const a = slides[idx];
    const b = slides[swapIdx];
    await Promise.all([
      supabase.from("homepage_carousel_slides").update({ sort_order: b.sort_order } as any).eq("id", a.id),
      supabase.from("homepage_carousel_slides").update({ sort_order: a.sort_order } as any).eq("id", b.id),
    ]);
    fetchSlides();
  };

  const handleFileUpload = async (file: File, type: "image" | "video") => {
    if (!editingId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${editingId}-${Date.now()}.${ext}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("carousel-media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("carousel-media")
        .getPublicUrl(filePath);

      const url = urlData.publicUrl;

      if (type === "image") {
        setEditForm(p => ({ ...p, image_url: url }));
      } else {
        setEditForm(p => ({ ...p, video_url: url }));
      }

      toast({ title: "আপলোড সফল", description: `${type === "image" ? "ইমেজ" : "ভিডিও"} আপলোড হয়েছে` });
    } catch (err: any) {
      toast({ title: "আপলোড ব্যর্থ", description: err.message || "File upload failed", variant: "destructive" });
    }
    setUploading(false);
  };

  const mediaIcon = (type: string) => {
    if (type === "video") return <Video className="h-4 w-4" />;
    if (type === "youtube") return <Youtube className="h-4 w-4" />;
    return <Image className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Carousel Slides</h3>
          <p className="text-sm text-muted-foreground">{slides.length} slide(s)</p>
        </div>
        <Button onClick={addSlide} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Slide
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : slides.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No slides yet. Add one to get started.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <Card key={slide.id} className={!slide.is_enabled ? "opacity-60" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveSlide(slide.id, "up")} disabled={idx === 0} className="p-0.5 hover:bg-muted rounded disabled:opacity-30">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => moveSlide(slide.id, "down")} disabled={idx === slides.length - 1} className="p-0.5 hover:bg-muted rounded disabled:opacity-30">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {mediaIcon(slide.media_type)}
                    <span className="font-medium text-sm">{slide.title || "Untitled"}</span>
                    <Badge variant="outline" className="text-xs capitalize">{slide.media_type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={slide.is_enabled ? "default" : "secondary"} className="text-xs">
                    {slide.is_enabled ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                    {slide.is_enabled ? "On" : "Off"}
                  </Badge>
                  <Switch checked={slide.is_enabled} onCheckedChange={(c) => toggleSlide(slide.id, c)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSlide(slide.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editingId === slide.id ? (
                  <SlideEditForm
                    editForm={editForm}
                    setEditForm={setEditForm}
                    saving={saving}
                    uploading={uploading}
                    imageInputRef={imageInputRef}
                    videoInputRef={videoInputRef}
                    onSave={saveEdit}
                    onCancel={() => setEditingId(null)}
                    onFileUpload={handleFileUpload}
                  />
                ) : (
                  <div className="flex items-center gap-4">
                    {slide.media_type === "image" && slide.image_url && (
                      <img src={slide.image_url} alt="" className="h-16 w-28 rounded object-cover" />
                    )}
                    {slide.media_type === "video" && <span className="text-xs text-muted-foreground">🎬 {slide.video_url?.slice(0, 50)}...</span>}
                    {slide.media_type === "youtube" && <span className="text-xs text-muted-foreground">▶️ {slide.youtube_url?.slice(0, 50)}...</span>}
                    <div className="flex-1">
                      {slide.subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{slide.subtitle}</p>}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => startEdit(slide)}>Edit</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Extracted Edit Form =====
function SlideEditForm({
  editForm, setEditForm, saving, uploading, imageInputRef, videoInputRef, onSave, onCancel, onFileUpload,
}: {
  editForm: Partial<Slide>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<Slide>>>;
  saving: boolean;
  uploading: boolean;
  imageInputRef: React.RefObject<HTMLInputElement>;
  videoInputRef: React.RefObject<HTMLInputElement>;
  onSave: () => void;
  onCancel: () => void;
  onFileUpload: (file: File, type: "image" | "video") => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={editForm.title || ""} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Badge Text</Label>
          <Input value={editForm.badge_text || ""} onChange={(e) => setEditForm(p => ({ ...p, badge_text: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Subtitle</Label>
        <Textarea value={editForm.subtitle || ""} onChange={(e) => setEditForm(p => ({ ...p, subtitle: e.target.value }))} rows={2} />
      </div>

      <div className="space-y-2">
        <Label>Media Type</Label>
        <Select value={editForm.media_type || "image"} onValueChange={(v) => setEditForm(p => ({ ...p, media_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="image"><div className="flex items-center gap-2"><Image className="h-4 w-4" /> Image</div></SelectItem>
            <SelectItem value="video"><div className="flex items-center gap-2"><Video className="h-4 w-4" /> Video Upload</div></SelectItem>
            <SelectItem value="youtube"><div className="flex items-center gap-2"><Youtube className="h-4 w-4" /> YouTube Video</div></SelectItem>
          </SelectContent>
        </Select>
      </div>

      {editForm.media_type === "image" && (
        <div className="space-y-3">
          <Label>Image</Label>
          <div className="flex gap-2">
            <Input value={editForm.image_url || ""} onChange={(e) => setEditForm(p => ({ ...p, image_url: e.target.value }))} placeholder="Image URL অথবা নিচে আপলোড করুন" className="flex-1" />
            <input
              ref={imageInputRef as any}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file, "image");
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => imageInputRef.current?.click()}
              className="shrink-0"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              আপলোড
            </Button>
          </div>
          {editForm.image_url && (
            <img src={editForm.image_url} alt="Preview" className="h-24 w-auto rounded object-cover" />
          )}
        </div>
      )}

      {editForm.media_type === "video" && (
        <div className="space-y-3">
          <Label>Video</Label>
          <div className="flex gap-2">
            <Input value={editForm.video_url || ""} onChange={(e) => setEditForm(p => ({ ...p, video_url: e.target.value }))} placeholder="Video URL অথবা নিচে আপলোড করুন" className="flex-1" />
            <input
              ref={videoInputRef as any}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file, "video");
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => videoInputRef.current?.click()}
              className="shrink-0"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              আপলোড
            </Button>
          </div>
          {editForm.video_url && (
            <p className="text-xs text-muted-foreground">🎬 {editForm.video_url}</p>
          )}
        </div>
      )}

      {editForm.media_type === "youtube" && (
        <div className="space-y-2">
          <Label>YouTube URL</Label>
          <Input value={editForm.youtube_url || ""} onChange={(e) => setEditForm(p => ({ ...p, youtube_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
        <div className="space-y-2">
          <Label>CTA Button Text</Label>
          <Input value={editForm.cta_text || ""} onChange={(e) => setEditForm(p => ({ ...p, cta_text: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>CTA Link</Label>
          <Input value={editForm.cta_link || ""} onChange={(e) => setEditForm(p => ({ ...p, cta_link: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Secondary Button Text</Label>
          <Input value={editForm.secondary_cta_text || ""} onChange={(e) => setEditForm(p => ({ ...p, secondary_cta_text: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Secondary Button Link</Label>
          <Input value={editForm.secondary_cta_link || ""} onChange={(e) => setEditForm(p => ({ ...p, secondary_cta_link: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Overlay Color</Label>
        <Input value={editForm.overlay_color || "rgba(0,0,0,0.45)"} onChange={(e) => setEditForm(p => ({ ...p, overlay_color: e.target.value }))} placeholder="rgba(0,0,0,0.45)" />
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={onSave} disabled={saving || uploading} size="sm">
          <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

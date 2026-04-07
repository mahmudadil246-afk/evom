import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Upload, ImageIcon, Video, FileText, X, Plus, Loader2 } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { toast } from "sonner";

const DEFAULT_SETTINGS = {
  IMAGE_MAX_SIZE_MB: "1",
  VIDEO_MAX_SIZE_MB: "5",
  OTHER_MAX_SIZE_MB: "2",
  ALLOWED_IMAGE_EXTENSIONS: "jpg,jpeg,png,webp,gif,svg",
  ALLOWED_VIDEO_EXTENSIONS: "mp4,webm,mov",
  ALLOWED_OTHER_EXTENSIONS: "pdf,doc,docx,xls,xlsx",
};

export function UploadSettings() {
  const { getSettingValue, updateMultipleSettings, saving } = useStoreSettings();
  
  const [imageMaxSize, setImageMaxSize] = useState(DEFAULT_SETTINGS.IMAGE_MAX_SIZE_MB);
  const [videoMaxSize, setVideoMaxSize] = useState(DEFAULT_SETTINGS.VIDEO_MAX_SIZE_MB);
  const [otherMaxSize, setOtherMaxSize] = useState(DEFAULT_SETTINGS.OTHER_MAX_SIZE_MB);
  const [imageExts, setImageExts] = useState<string[]>(DEFAULT_SETTINGS.ALLOWED_IMAGE_EXTENSIONS.split(","));
  const [videoExts, setVideoExts] = useState<string[]>(DEFAULT_SETTINGS.ALLOWED_VIDEO_EXTENSIONS.split(","));
  const [otherExts, setOtherExts] = useState<string[]>(DEFAULT_SETTINGS.ALLOWED_OTHER_EXTENSIONS.split(","));
  const [newExt, setNewExt] = useState({ image: "", video: "", other: "" });

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    const img = getSettingValue("UPLOAD_IMAGE_MAX_SIZE_MB");
    const vid = getSettingValue("UPLOAD_VIDEO_MAX_SIZE_MB");
    const oth = getSettingValue("UPLOAD_OTHER_MAX_SIZE_MB");
    const imgExts = getSettingValue("UPLOAD_ALLOWED_IMAGE_EXTENSIONS");
    const vidExts = getSettingValue("UPLOAD_ALLOWED_VIDEO_EXTENSIONS");
    const othExts = getSettingValue("UPLOAD_ALLOWED_OTHER_EXTENSIONS");
    
    // Only init once we have at least one value loaded
    if (!img && !vid && !oth) return;
    
    if (img) setImageMaxSize(img);
    if (vid) setVideoMaxSize(vid);
    if (oth) setOtherMaxSize(oth);
    if (imgExts) setImageExts(imgExts.split(",").map(e => e.trim()).filter(Boolean));
    if (vidExts) setVideoExts(vidExts.split(",").map(e => e.trim()).filter(Boolean));
    if (othExts) setOtherExts(othExts.split(",").map(e => e.trim()).filter(Boolean));
    setInitialized(true);
  }, [getSettingValue, initialized]);

  const addExtension = (type: "image" | "video" | "other") => {
    const ext = newExt[type].trim().toLowerCase().replace(/^\./, "");
    if (!ext) return;
    
    if (type === "image" && !imageExts.includes(ext)) {
      setImageExts(prev => [...prev, ext]);
    } else if (type === "video" && !videoExts.includes(ext)) {
      setVideoExts(prev => [...prev, ext]);
    } else if (type === "other" && !otherExts.includes(ext)) {
      setOtherExts(prev => [...prev, ext]);
    }
    setNewExt(prev => ({ ...prev, [type]: "" }));
  };

  const removeExtension = (type: "image" | "video" | "other", ext: string) => {
    if (type === "image") setImageExts(prev => prev.filter(e => e !== ext));
    else if (type === "video") setVideoExts(prev => prev.filter(e => e !== ext));
    else setOtherExts(prev => prev.filter(e => e !== ext));
  };

  const handleSave = async () => {
    const success = await updateMultipleSettings([
      { key: "UPLOAD_IMAGE_MAX_SIZE_MB", value: imageMaxSize },
      { key: "UPLOAD_VIDEO_MAX_SIZE_MB", value: videoMaxSize },
      { key: "UPLOAD_OTHER_MAX_SIZE_MB", value: otherMaxSize },
      { key: "UPLOAD_ALLOWED_IMAGE_EXTENSIONS", value: imageExts.join(",") },
      { key: "UPLOAD_ALLOWED_VIDEO_EXTENSIONS", value: videoExts.join(",") },
      { key: "UPLOAD_ALLOWED_OTHER_EXTENSIONS", value: otherExts.join(",") },
    ]);
    if (success) toast.success("Upload settings saved!");
  };

  const ExtensionList = ({ 
    exts, type, label 
  }: { 
    exts: string[]; type: "image" | "video" | "other"; label: string 
  }) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {exts.map(ext => (
          <Badge key={ext} variant="secondary" className="gap-1 text-xs">
            .{ext}
            <button onClick={() => removeExtension(type, ext)} className="ml-0.5 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <div className="flex items-center gap-1">
          <Input
            value={newExt[type]}
            onChange={(e) => setNewExt(prev => ({ ...prev, [type]: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExtension(type))}
            placeholder=".ext"
            className="h-6 w-16 text-xs px-1.5"
          />
          <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => addExtension(type)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-accent" />
          Upload Settings
        </CardTitle>
        <CardDescription>
          Control maximum file sizes and allowed file types for uploads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-500" />
            <Label className="font-medium">Image Files</Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Max Size (MB)</Label>
              <Input
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={imageMaxSize}
                onChange={(e) => setImageMaxSize(e.target.value)}
              />
            </div>
            <ExtensionList exts={imageExts} type="image" label="Allowed Extensions" />
          </div>
        </div>

        <Separator />

        {/* Video Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-red-500" />
            <Label className="font-medium">Video Files</Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Max Size (MB)</Label>
              <Input
                type="number"
                min="1"
                max="500"
                step="1"
                value={videoMaxSize}
                onChange={(e) => setVideoMaxSize(e.target.value)}
              />
            </div>
            <ExtensionList exts={videoExts} type="video" label="Allowed Extensions" />
          </div>
        </div>

        <Separator />

        {/* Other Files */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-500" />
            <Label className="font-medium">Other Files</Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Max Size (MB)</Label>
              <Input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={otherMaxSize}
                onChange={(e) => setOtherMaxSize(e.target.value)}
              />
            </div>
            <ExtensionList exts={otherExts} type="other" label="Allowed Extensions" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Upload Settings
        </Button>
      </CardContent>
    </Card>
  );
}


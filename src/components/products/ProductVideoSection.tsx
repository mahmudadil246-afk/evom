import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Upload, X, Video, Youtube, Link, Play, FileVideo, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStoreSettings } from "@/hooks/useStoreSettings";

interface ProductVideoSectionProps {
  videoFile: string | null;
  youtubeUrl: string;
  videoThumbnail: string | null;
  onVideoFileChange: (file: string | null) => void;
  onYoutubeUrlChange: (url: string) => void;
  onVideoThumbnailChange: (thumbnail: string | null) => void;
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function generateVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 4);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve(dataUrl);
        } else {
          reject(new Error("Canvas context failed"));
        }
        video.remove();
      } catch (e) {
        reject(e);
      }
    };

    video.onerror = () => reject(new Error("Video load failed"));
    video.src = videoUrl;
  });
}

export function ProductVideoSection({
  videoFile,
  youtubeUrl,
  videoThumbnail,
  onVideoFileChange,
  onYoutubeUrlChange,
  onVideoThumbnailChange,
}: ProductVideoSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [videoFileName, setVideoFileName] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const { getSettingValue } = useStoreSettings();

  const youtubeId = extractYoutubeId(youtubeUrl);

  const getMaxVideoSize = () => {
    const val = getSettingValue("UPLOAD_VIDEO_MAX_SIZE_MB");
    return (val ? parseFloat(val) : 5) * 1024 * 1024;
  };

  const getAllowedVideoExts = () => {
    const val = getSettingValue("UPLOAD_ALLOWED_VIDEO_EXTENSIONS");
    return val ? val.split(",").map(e => e.trim()) : ["mp4", "webm", "mov"];
  };

  const uploadToStorage = useCallback(
    async (file: File) => {
      const maxSize = getMaxVideoSize();
      const allowedExts = getAllowedVideoExts();
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (!allowedExts.includes(ext)) {
        toast.error(`File type .${ext} not allowed. Allowed: ${allowedExts.map(e => `.${e}`).join(", ")}`);
        return;
      }

      if (file.size > maxSize) {
        toast.error(`Video must be less than ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setVideoFileName(file.name);

      try {
        const fileName = `video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // Use XMLHttpRequest for progress tracking
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          toast.error("Please login to upload videos");
          setIsUploading(false);
          return;
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const url = `${supabaseUrl}/storage/v1/object/product-videos/${fileName}`;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploadProgress(pct);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

          xhr.open("POST", url);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
          xhr.setRequestHeader("x-upsert", "true");
          xhr.send(file);
        });

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("product-videos")
          .getPublicUrl(fileName);

        onVideoFileChange(publicUrl);

        // Auto-generate thumbnail
        setIsGeneratingThumb(true);
        try {
          const thumbDataUrl = await generateVideoThumbnail(publicUrl);
          // Upload thumbnail to storage
          const thumbBlob = await (await fetch(thumbDataUrl)).blob();
          const thumbFileName = `thumb-${Date.now()}.jpg`;
          const { error: thumbErr } = await supabase.storage
            .from("product-videos")
            .upload(thumbFileName, thumbBlob, { contentType: "image/jpeg", upsert: true });

          if (!thumbErr) {
            const { data: { publicUrl: thumbUrl } } = supabase.storage
              .from("product-videos")
              .getPublicUrl(thumbFileName);
            onVideoThumbnailChange(thumbUrl);
          }
        } catch {
          // Thumbnail generation can fail for cross-origin, that's ok
          console.warn("Auto thumbnail generation failed");
        } finally {
          setIsGeneratingThumb(false);
        }

        toast.success("Video uploaded successfully!");
      } catch (error: any) {
        console.error("Video upload error:", error);
        toast.error(error.message || "Failed to upload video");
      } finally {
        setIsUploading(false);
      }
    },
    [onVideoFileChange, onVideoThumbnailChange, getSettingValue]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToStorage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadToStorage(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleCustomThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file for thumbnail");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Thumbnail must be less than 2MB");
      return;
    }

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const thumbFileName = `custom-thumb-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-videos")
        .upload(thumbFileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("product-videos")
        .getPublicUrl(thumbFileName);

      onVideoThumbnailChange(publicUrl);
      toast.success("Custom thumbnail uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload thumbnail");
    }
  };

  const handleRemoveVideo = async () => {
    if (videoFile && videoFile.includes("product-videos")) {
      try {
        const parts = videoFile.split("/");
        const fileName = parts[parts.length - 1];
        await supabase.storage.from("product-videos").remove([fileName]);
      } catch (e) {
        console.error("Error removing video:", e);
      }
    }
    if (videoThumbnail && videoThumbnail.includes("product-videos")) {
      try {
        const parts = videoThumbnail.split("/");
        const fileName = parts[parts.length - 1];
        await supabase.storage.from("product-videos").remove([fileName]);
      } catch (e) {
        console.error("Error removing thumbnail:", e);
      }
    }
    onVideoFileChange(null);
    onVideoThumbnailChange(null);
    setVideoFileName("");
    setUploadProgress(0);
  };

  const allowedExts = getAllowedVideoExts();
  const maxSizeMB = (getMaxVideoSize() / (1024 * 1024)).toFixed(0);

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-1.5">
        <Video className="h-4 w-4" />
        Product Videos
      </Label>

      {/* Video Upload */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Upload Video</p>
        {isUploading ? (
          <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span className="text-sm font-medium">Uploading {videoFileName}...</span>
              <span className="ml-auto text-sm font-bold text-accent">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {uploadProgress < 100 ? "Uploading to storage..." : "Processing..."}
            </p>
          </div>
        ) : videoFile ? (
          <div className="space-y-2">
            <div className="relative rounded-lg border border-border overflow-hidden bg-muted">
              <video
                src={videoFile}
                controls
                poster={videoThumbnail || undefined}
                className="w-full max-h-48 object-contain bg-black"
              />
              <div className="flex items-center justify-between p-2 bg-card">
                <div className="flex items-center gap-2 min-w-0">
                  <FileVideo className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {videoFileName || "Uploaded video"}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={handleRemoveVideo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Thumbnail Section */}
            <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Video Thumbnail
                  {isGeneratingThumb && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating...
                    </Badge>
                  )}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => thumbInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3" />
                  Custom
                </Button>
              </div>
              {videoThumbnail ? (
                <div className="relative w-32 h-20 rounded overflow-hidden border border-border">
                  <img
                    src={videoThumbnail}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onVideoThumbnailChange(null)}
                    className="absolute top-0.5 right-0.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Auto-generated thumbnail will appear here, or upload a custom one
                </p>
              )}
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomThumbnail}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => videoInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
              isDragging
                ? "border-accent bg-accent/10"
                : "border-border bg-muted/30 hover:border-muted-foreground hover:bg-muted/50"
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drag & drop video here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse • {allowedExts.map(e => e.toUpperCase()).join(", ")} • Max {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept={allowedExts.map(e => `video/${e === "mov" ? "quicktime" : e}`).join(",")}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* YouTube Link */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <Youtube className="h-3.5 w-3.5 text-red-500" />
          YouTube Video Link
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={youtubeUrl}
              onChange={(e) => onYoutubeUrlChange(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or youtu.be/..."
              className="pl-9"
            />
          </div>
          {youtubeUrl && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-destructive hover:text-destructive"
              onClick={() => onYoutubeUrlChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* YouTube Preview */}
        {youtubeId && (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="YouTube video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <div className="flex items-center gap-2 p-2 bg-card">
              <Youtube className="h-4 w-4 text-red-500 shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                YouTube Video
              </span>
              <Badge variant="outline" className="text-xs ml-auto">
                <Play className="h-3 w-3 mr-1" />
                Preview
              </Badge>
            </div>
          </div>
        )}
        {youtubeUrl && !youtubeId && (
          <p className="text-xs text-destructive">Invalid YouTube URL</p>
        )}
      </div>
    </div>
  );
}

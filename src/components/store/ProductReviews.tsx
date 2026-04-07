import { useState, useEffect, useRef } from "react";
import { Star, User, CheckCircle, ImagePlus, X, Play, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  customer_name: string;
  rating: number;
  title: string | null;
  content: string | null;
  review_text: string | null;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  images: string[] | null;
  video_url: string | null;
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewVideo, setReviewVideo] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    if (user) checkPurchaseStatus();
  }, [user, productId]);

  const checkPurchaseStatus = async () => {
    if (!user) return;
    setCheckingPurchase(true);
    try {
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["delivered", "completed"]);

      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_id")
          .in("order_id", orderIds)
          .eq("product_id", productId);

        setIsVerifiedBuyer((orderItems?.length ?? 0) > 0);
      }
    } catch (err) {
      console.error("Error checking purchase:", err);
    }
    setCheckingPurchase(false);
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setReviews(data as unknown as Review[]);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
    setLoading(false);
  };

  const uploadMediaFiles = async (): Promise<{ images: string[]; videoUrl: string | null }> => {
    const uploadedImages: string[] = [];
    let uploadedVideo: string | null = null;

    if (!user) return { images: [], videoUrl: null };

    const totalFiles = reviewImages.length + (reviewVideo ? 1 : 0);
    let completed = 0;

    // Upload images
    for (const file of reviewImages) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("review-media").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("review-media").getPublicUrl(path);
        uploadedImages.push(urlData.publicUrl);
      }
      completed++;
      setUploadProgress(Math.round((completed / totalFiles) * 100));
    }

    // Upload video
    if (reviewVideo) {
      const ext = reviewVideo.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-video.${ext}`;
      const { error } = await supabase.storage.from("review-media").upload(path, reviewVideo);
      if (!error) {
        const { data: urlData } = supabase.storage.from("review-media").getPublicUrl(path);
        uploadedVideo = urlData.publicUrl;
      }
      completed++;
      setUploadProgress(100);
    }

    return { images: uploadedImages, videoUrl: uploadedVideo };
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error(t('store.loginToSubmitReview'));
      return;
    }

    if (!isVerifiedBuyer) {
      toast.error(t('store.onlyVerifiedCanReview'));
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error(t('store.selectRating'));
      return;
    }

    setSubmitting(true);
    setUploading(reviewImages.length > 0 || !!reviewVideo);

    try {
      // Upload media first
      let images: string[] = [];
      let videoUrl: string | null = null;

      if (reviewImages.length > 0 || reviewVideo) {
        const media = await uploadMediaFiles();
        images = media.images;
        videoUrl = media.videoUrl;
      }

      const customerName = user.email?.split("@")[0] || "Anonymous";

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user.id,
        customer_name: customerName,
        rating,
        title: title || null,
        review_text: content || null,
        is_verified: true,
        is_approved: null,
        images: images.length > 0 ? images : [],
        video_url: videoUrl,
      });

      if (error) throw error;

      toast.success(t('store.reviewSubmitted'));
      setShowForm(false);
      setRating(5);
      setTitle("");
      setContent("");
      setReviewImages([]);
      setReviewVideo(null);
      setUploadProgress(0);
      fetchReviews();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(t('store.failedSubmitReview'));
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024 && f.type.startsWith("image/"));
    if (validFiles.length < files.length) {
      toast.error("Some files were skipped (max 5MB, images only)");
    }
    setReviewImages(prev => [...prev, ...validFiles].slice(0, 5));
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Video must be under 20MB");
      return;
    }
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    setReviewVideo(file);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  // Calculate rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (r) => reviews.filter((review) => review.rating === r).length
  );
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const StarRating = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
            star <= (interactive ? hoverRating || rating : value)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          } ${interactive ? "cursor-pointer transition-colors" : ""}`}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        />
      ))}
    </div>
  );

  if (loading) {
    return <div className="animate-pulse h-40 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-4 justify-center md:justify-start mb-4">
            <span className="text-5xl font-bold">{averageRating.toFixed(1)}</span>
            <div>
              <StarRating value={Math.round(averageRating)} />
              <p className="text-sm text-muted-foreground mt-1">
                {totalReviews} {totalReviews === 1 ? t('store.review') : t('store.reviewsPlural')}
              </p>
            </div>
          </div>
          {user && isVerifiedBuyer && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-store-primary hover:bg-store-primary/90"
            >
              {t('store.writeReview')}
            </Button>
          )}
          {user && !isVerifiedBuyer && !checkingPurchase && (
            <p className="text-sm text-muted-foreground">
              {t('store.onlyVerifiedBuyers')}
            </p>
          )}
          {!user && (
            <p className="text-sm text-muted-foreground">
              {t('store.loginToReview').split(t('store.login'))[0]}<a href="/login" className="text-store-primary hover:underline">{t('store.login')}</a>{t('store.loginToReview').split(t('store.login'))[1] || ''}
            </p>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star, idx) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm w-8">{star} {t('store.star')}</span>
              <Progress
                value={totalReviews > 0 ? (ratingCounts[idx] / totalReviews) * 100 : 0}
                className="flex-1 h-2"
              />
              <span className="text-sm text-muted-foreground w-8">
                {ratingCounts[idx]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="p-6 border rounded-lg bg-store-card">
          <h4 className="font-semibold mb-4">{t('store.writeYourReview')}</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('store.rating')}</label>
              <StarRating value={rating} interactive />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('store.titleOptional')}</label>
              <Input
                placeholder={t('store.summarizeExperience')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('store.reviewLabel')}</label>
              <Textarea
                placeholder={t('store.tellOthers')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('store.photosOptional')}</label>
              <div className="flex flex-wrap gap-2">
                {reviewImages.map((file, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border bg-muted">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {reviewImages.length < 5 && (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-store-primary hover:text-store-primary transition-colors"
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[10px] mt-1">{t('common.add')}</span>
                  </button>
                )}
              </div>
              <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
            </div>

            {/* Video Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('store.videoOptional')}</label>
              {reviewVideo ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                  <Play className="h-5 w-5 text-store-primary" />
                  <span className="text-sm flex-1 truncate">{reviewVideo.name}</span>
                  <span className="text-xs text-muted-foreground">{(reviewVideo.size / 1024 / 1024).toFixed(1)}MB</span>
                  <button onClick={() => setReviewVideo(null)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => videoInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" /> {t('store.addVideo')}
                </Button>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideoSelect} />
            </div>

            {uploading && (
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">{t('store.uploadingMedia')} {uploadProgress}%</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="bg-store-primary hover:bg-store-primary/90"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('store.submitting')}</>
                ) : t('store.submitReview')}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {t('store.noReviewsYet')}
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-store-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.customer_name}</span>
                      {review.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />{t('store.verifiedPurchase')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <StarRating value={review.rating} />
              </div>
              {review.title && (
                <h5 className="font-medium mb-2">{review.title}</h5>
              )}
              {(review.content || review.review_text) && (
                <p className="text-muted-foreground mb-3">{review.content || review.review_text}</p>
              )}

              {/* Review Media */}
              {((review.images && review.images.length > 0) || review.video_url) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {review.images?.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightboxImage(img)}
                      className="w-16 h-16 rounded-lg overflow-hidden border hover:ring-2 ring-store-primary transition-all"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {review.video_url && (
                    <a href={review.video_url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center hover:ring-2 ring-store-primary transition-all">
                      <Play className="h-6 w-6 text-store-primary" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          {lightboxImage && (
            <img src={lightboxImage} alt="Review" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

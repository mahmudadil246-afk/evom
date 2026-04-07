import { useState, useMemo } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Star, Search, MoreVertical, Check, X, Trash2, MessageSquare, ChevronDown, Clock, Eye, Image as ImageIcon, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "sonner";
import { format } from "date-fns";
import { ReviewRatingSummary } from "@/components/admin/ReviewRatingSummary";

type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string;
  customer_name: string | null;
  title: string | null;
  content: string | null;
  review_text: string | null;
  rating: number;
  is_approved: boolean | null;
  is_verified: boolean | null;
  images: string[] | null;
  video_url: string | null;
  created_at: string;
  products?: { name: string } | null;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function ReviewsManager() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [viewReview, setViewReview] = useState<ReviewRow | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("product_reviews")
        .select("*, products(name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (statusFilter === "pending") query = query.is("is_approved", null);
      else if (statusFilter === "approved") query = query.eq("is_approved", true);
      else if (statusFilter === "rejected") query = query.eq("is_approved", false);

      const { data, error } = await query;
      if (error) throw error;
      return data as ReviewRow[];
    },
  });

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews;
    const q = searchQuery.toLowerCase();
    return reviews.filter(r =>
      (r.customer_name || "").toLowerCase().includes(q) ||
      (r.title || "").toLowerCase().includes(q) ||
      (r.content || r.review_text || "").toLowerCase().includes(q) ||
      ((r.products as any)?.name || "").toLowerCase().includes(q)
    );
  }, [reviews, searchQuery]);

  const {
    paginatedData, currentPage, pageSize, totalPages, totalItems, goToPage, changePageSize,
  } = usePagination(filteredReviews, { initialPageSize: 10 });

  const updateMutation = useMutation({
    mutationFn: async ({ ids, approved }: { ids: string[]; approved: boolean | null }) => {
      const { error } = await supabase
        .from("product_reviews")
        .update({ is_approved: approved })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      setSelectedReviews([]);
      toast.success("Reviews updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("product_reviews")
        .update({ deleted_at: new Date().toISOString() } as any)
        .in("id", ids);
      if (error) throw error;
      return ids;
    },
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      setSelectedReviews([]);
      setDeleteId(null);
      setBulkDeleteOpen(false);
      toast.success("Review(s) moved to trash", {
        action: {
          label: "Undo",
          onClick: async () => {
            await supabase.from("product_reviews").update({ deleted_at: null } as any).in("id", ids);
            queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
          },
        },
        duration: 5000,
      });
    },
  });

  const handleSelectReview = (id: string) => {
    setSelectedReviews(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === paginatedData.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(paginatedData.map(r => r.id));
    }
  };

  const allSelected = paginatedData.length > 0 && selectedReviews.length === paginatedData.length;
  const someSelected = selectedReviews.length > 0 && selectedReviews.length < paginatedData.length;

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-4 w-4", i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
      ))}
    </div>
  );

  const getStatusLabel = (r: ReviewRow) =>
    r.is_approved === true ? "approved" : r.is_approved === false ? "rejected" : "pending";

  const getStatusBadge = (r: ReviewRow) => (
    <Badge variant="outline" className={cn(
      r.is_approved === true
        ? "bg-success/10 text-success border-success/20"
        : r.is_approved === false
          ? "bg-destructive/10 text-destructive border-destructive/20"
          : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    )}>
      {getStatusLabel(r)}
    </Badge>
  );

  const totalReviews = reviews.length;
  const pendingCount = reviews.filter(r => r.is_approved === null).length;
  const approvedCount = reviews.filter(r => r.is_approved === true).length;

  const hasMedia = (r: ReviewRow) => (r.images && r.images.length > 0) || !!r.video_url;

  if (isLoading) {
    return (
      <>
        <div className="space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <AdminPageHeader
          title="Product Reviews"
          description={`Manage customer reviews and ratings (${reviews.length} total)`}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              {selectedReviews.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      Bulk Actions ({selectedReviews.length})
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => updateMutation.mutate({ ids: selectedReviews, approved: null })}>
                      <Clock className="mr-2 h-4 w-4" /> Set Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateMutation.mutate({ ids: selectedReviews, approved: true })}>
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateMutation.mutate({ ids: selectedReviews, approved: false })}>
                      <X className="mr-2 h-4 w-4" /> Reject
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setBulkDeleteOpen(true)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        {/* Average Rating Summary */}
        <ReviewRatingSummary reviews={reviews} />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Reviews", value: totalReviews, icon: MessageSquare, color: "primary" },
            { label: "Pending", value: pendingCount, icon: Clock, color: "yellow" },
            { label: "Approved", value: approvedCount, icon: Check, color: "success" },
          ].map((card) => {
            const borderMap: Record<string, string> = { primary: "border-l-primary", yellow: "border-l-yellow-500", success: "border-l-success" };
            const bgMap: Record<string, string> = { primary: "bg-primary/10", yellow: "bg-yellow-500/10", success: "bg-success/10" };
            const textMap: Record<string, string> = { primary: "text-primary", yellow: "text-yellow-500", success: "text-success" };
            const cardBgMap: Record<string, string> = { primary: "bg-primary/5 dark:bg-primary/10", yellow: "bg-yellow-500/5 dark:bg-yellow-500/10", success: "bg-success/5 dark:bg-success/10" };
            const IconComp = card.icon;
            return (
              <div
                key={card.label}
                className={cn(
                  "group relative rounded-xl border border-border/50 p-4 sm:p-5 transition-all duration-300",
                  "hover:shadow-md hover:border-border hover:-translate-y-0.5 border-l-[3px]",
                  borderMap[card.color], cardBgMap[card.color], "animate-fade-in"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{card.label}</p>
                    <p className="text-lg sm:text-xl font-bold tracking-tight mt-1">{card.value}</p>
                  </div>
                  <div className={cn("rounded-lg p-2", bgMap[card.color])}>
                    <IconComp className={cn("h-5 w-5", textMap[card.color])} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    // @ts-ignore
                    indeterminate={someSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[180px]">Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="min-w-[200px]">Review</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No reviews found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((review) => (
                  <TableRow key={review.id} data-state={selectedReviews.includes(review.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedReviews.includes(review.id)}
                        onCheckedChange={() => handleSelectReview(review.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground truncate max-w-[180px]">
                        {(review.products as any)?.name || "Unknown"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground">{review.customer_name || "Anonymous"}</p>
                    </TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell className="max-w-[200px]">
                      {review.title && <p className="font-medium text-sm truncate text-foreground">{review.title}</p>}
                      <p className="text-sm text-muted-foreground truncate">{review.content || review.review_text || "—"}</p>
                    </TableCell>
                    <TableCell>
                      {hasMedia(review) ? (
                        <div className="flex items-center gap-1">
                          {review.images && review.images.length > 0 && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <ImageIcon className="h-3 w-3" /> {review.images.length}
                            </Badge>
                          )}
                          {review.video_url && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Play className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(review)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => setViewReview(review)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {review.is_approved !== null && (
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ ids: [review.id], approved: null })}>
                              <Clock className="mr-2 h-4 w-4" /> Pending
                            </DropdownMenuItem>
                          )}
                          {review.is_approved !== true && (
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ ids: [review.id], approved: true })}>
                              <Check className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                          )}
                          {review.is_approved !== false && (
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ ids: [review.id], approved: false })}>
                              <X className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(review.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Trash
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalItems > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={goToPage}
              onPageSizeChange={changePageSize}
            />
          )}
        </div>
      </div>

      {/* View Review Modal */}
      <Dialog open={!!viewReview} onOpenChange={(open) => !open && setViewReview(null)}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {viewReview && (
            <div className="space-y-5">
              {/* Product & Status */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-semibold text-foreground">{(viewReview.products as any)?.name || "Unknown"}</p>
                </div>
                {getStatusBadge(viewReview)}
              </div>

              {/* Customer & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium text-foreground">{viewReview.customer_name || "Anonymous"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-sm text-foreground">{format(new Date(viewReview.created_at), "MMM dd, yyyy hh:mm a")}</p>
                </div>
              </div>

              {/* Rating */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={cn("h-5 w-5", i <= viewReview.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                  ))}
                  <span className="ml-2 text-sm font-medium text-foreground">{viewReview.rating}/5</span>
                </div>
              </div>

              {/* Title */}
              {viewReview.title && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Title</p>
                  <p className="font-medium text-foreground">{viewReview.title}</p>
                </div>
              )}

              {/* Review Text */}
              {(viewReview.content || viewReview.review_text) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Review</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{viewReview.content || viewReview.review_text}</p>
                </div>
              )}

              {/* Images */}
              {viewReview.images && viewReview.images.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Photos ({viewReview.images.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {viewReview.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setLightboxImage(img)}
                        className="w-20 h-20 rounded-lg overflow-hidden border hover:ring-2 ring-primary transition-all"
                      >
                        <img src={img} alt={`Review image ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Video */}
              {viewReview.video_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Video</p>
                  <video
                    src={viewReview.video_url}
                    controls
                    className="w-full rounded-lg border max-h-64"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {viewReview.is_approved !== null && (
                  <Button variant="outline" size="sm" onClick={() => { updateMutation.mutate({ ids: [viewReview.id], approved: null }); setViewReview(null); }}>
                    <Clock className="h-4 w-4 mr-1.5" /> Pending
                  </Button>
                )}
                {viewReview.is_approved !== true && (
                  <Button variant="outline" size="sm" className="text-success border-success/30 hover:bg-success/10" onClick={() => { updateMutation.mutate({ ids: [viewReview.id], approved: true }); setViewReview(null); }}>
                    <Check className="h-4 w-4 mr-1.5" /> Approve
                  </Button>
                )}
                {viewReview.is_approved !== false && (
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { updateMutation.mutate({ ids: [viewReview.id], approved: false }); setViewReview(null); }}>
                    <X className="h-4 w-4 mr-1.5" /> Reject
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => { setDeleteId(viewReview.id); setViewReview(null); }}>
                  <Trash2 className="h-4 w-4 mr-1.5" /> Trash
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-2">
          {lightboxImage && (
            <img src={lightboxImage} alt="Review image" className="w-full h-full object-contain max-h-[85vh] rounded" />
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate([deleteId])}
        title="Delete Review"
        description="Are you sure you want to delete this review? This cannot be undone."
        isLoading={deleteMutation.isPending}
      />

      <DeleteConfirmModal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={() => deleteMutation.mutate(selectedReviews)}
        title="Delete Reviews"
        description={`Delete ${selectedReviews.length} selected reviews? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}

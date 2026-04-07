import { useState, useRef, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Package, Play, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryItem {
  type: 'image' | 'video' | 'youtube';
  src: string;
}

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  videoUrl?: string | null;
  youtubeId?: string | null;
  discount: number;
  isBundle?: boolean;
  isMobile?: boolean;
  selectedImageIndex: number;
  onSelectImage: (index: number) => void;
  currentImage: string;
}

export function ProductImageGallery({
  images, productName, videoUrl, youtubeId, discount, isBundle, isMobile,
  selectedImageIndex, onSelectImage, currentImage,
}: ProductImageGalleryProps) {
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const galleryItems = useMemo(() => {
    const items: GalleryItem[] = images.map(img => ({ type: 'image' as const, src: img }));
    if (videoUrl) items.push({ type: 'video', src: videoUrl });
    if (youtubeId) items.push({ type: 'youtube', src: youtubeId });
    return items;
  }, [images, videoUrl, youtubeId]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  return (
    <div className="space-y-3">
      <div
        ref={imageContainerRef}
        className="relative aspect-square rounded-2xl overflow-hidden bg-muted cursor-crosshair group"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
      >
        {galleryItems[selectedImageIndex]?.type === 'video' ? (
          <video src={galleryItems[selectedImageIndex].src} controls className="w-full h-full object-cover" />
        ) : galleryItems[selectedImageIndex]?.type === 'youtube' ? (
          <iframe
            src={`https://www.youtube.com/embed/${galleryItems[selectedImageIndex].src}?autoplay=0`}
            title="Product Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen className="w-full h-full"
          />
        ) : (
          <img
            src={currentImage}
            alt={productName}
            className="w-full h-full object-cover transition-transform duration-200"
            style={isZooming && !isMobile ? { transform: 'scale(2)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
          />
        )}
        {isZooming && !isMobile && galleryItems[selectedImageIndex]?.type === 'image' && (
          <div className="absolute top-3 right-3 bg-background/80 rounded-full p-1.5 pointer-events-none">
            <ZoomIn className="h-4 w-4 text-foreground" />
          </div>
        )}
        {discount > 0 && (
          <Badge className="absolute top-4 left-4 bg-store-secondary text-store-primary-foreground text-lg px-3 py-1">{discount}% OFF</Badge>
        )}
        {isBundle && (
          <Badge className="absolute top-4 right-4 bg-store-primary text-store-primary-foreground"><Package className="h-3 w-3 mr-1" /> Bundle</Badge>
        )}
      </div>
      {galleryItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {galleryItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelectImage(idx)}
              className={cn(
                "w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all relative",
                selectedImageIndex === idx ? "border-store-primary" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              {item.type === 'image' ? (
                <img src={item.src} alt={`${productName} ${idx + 1}`} className="w-full h-full object-cover" />
              ) : item.type === 'video' ? (
                <div className="w-full h-full bg-muted flex items-center justify-center"><Play className="h-5 w-5 text-store-primary" /></div>
              ) : (
                <div className="w-full h-full bg-destructive/10 flex items-center justify-center"><Play className="h-5 w-5 text-red-500" /></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

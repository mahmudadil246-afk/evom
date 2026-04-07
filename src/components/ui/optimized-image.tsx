import { useState, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export function OptimizedImage({
  src,
  alt = "",
  className,
  fallback = "/placeholder.svg",
  loading = "lazy",
  decoding = "async",
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  return (
    <img
      src={error ? fallback : (src || fallback)}
      alt={alt}
      className={cn(className)}
      loading={loading}
      decoding={decoding as any}
      onError={() => setError(true)}
      {...props}
    />
  );
}

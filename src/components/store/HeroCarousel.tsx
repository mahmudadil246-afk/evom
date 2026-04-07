import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface CarouselSlide {
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
  sort_order: number;
}

const defaultSlides: CarouselSlide[] = [
  {
    id: "default-1",
    title: "Elevate Your Style",
    subtitle: "Discover premium fashion that speaks to your unique personality. New collection just arrived.",
    badge_text: "New Collection 2024",
    image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop",
    video_url: null,
    youtube_url: null,
    media_type: "image",
    cta_text: "Shop Now",
    cta_link: "/products",
    secondary_cta_text: "New Arrivals",
    secondary_cta_link: "/products?filter=new",
    overlay_color: "rgba(0,0,0,0.45)",
    sort_order: 0,
  },
];

interface HeroCarouselProps {
  autoplay?: boolean;
  autoplayDelay?: number;
  showArrows?: boolean;
}

function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&mute=1&loop=1&playlist=${v}&controls=0&showinfo=0&rel=0&modestbranding=1`;
    }
    if (u.hostname === "youtu.be") {
      const v = u.pathname.slice(1);
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&mute=1&loop=1&playlist=${v}&controls=0&showinfo=0&rel=0&modestbranding=1`;
    }
  } catch {}
  return null;
}

export function HeroCarousel({ autoplay = true, autoplayDelay = 5000, showArrows = true }: HeroCarouselProps) {
  const [slides, setSlides] = useState<CarouselSlide[]>(defaultSlides);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchSlides = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("homepage_carousel_slides")
        .select("*")
        .eq("is_enabled", true)
        .order("sort_order", { ascending: true });
      if (!error && data && data.length > 0) {
        setSlides(data as unknown as CarouselSlide[]);
      }
      setIsLoading(false);
    };
    fetchSlides();
  }, []);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, slides.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, slides.length, goTo]);

  useEffect(() => {
    if (!autoplay || slides.length <= 1) return;
    timerRef.current = setInterval(next, autoplayDelay);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplay, autoplayDelay, next, slides.length]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoplay && slides.length > 1) {
      timerRef.current = setInterval(next, autoplayDelay);
    }
  }, [autoplay, autoplayDelay, next, slides.length]);

  if (isLoading) {
    const fallbackSlide = defaultSlides[0];
    return (
      <section className="relative w-full overflow-hidden" style={{ height: "80vh", minHeight: "500px" }}>
        <div className="absolute inset-0">
          <img
            src={fallbackSlide.image_url!}
            alt={fallbackSlide.title || ""}
            className="w-full h-full object-cover"
            fetchPriority="high"
            loading="eager"
            decoding="sync"
          />
          <div className="absolute inset-0" style={{ background: fallbackSlide.overlay_color || "rgba(0,0,0,0.45)" }} />
        </div>
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-6 md:px-8">
            <div className="max-w-2xl text-white">
              {fallbackSlide.badge_text && (
                <Badge className="mb-5 bg-store-accent text-store-accent-foreground px-4 py-1.5 text-sm font-semibold">
                  {fallbackSlide.badge_text}
                </Badge>
              )}
              {fallbackSlide.title && (
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-5 leading-tight">
                  {fallbackSlide.title}
                </h1>
              )}
              {fallbackSlide.subtitle && (
                <p className="text-lg md:text-xl mb-8 text-white/85 max-w-lg leading-relaxed">
                  {fallbackSlide.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[current];
  const youtubeEmbed = slide.media_type === "youtube" && slide.youtube_url ? getYoutubeEmbedUrl(slide.youtube_url) : null;

  return (
    <section className="relative w-full overflow-hidden" style={{ height: "80vh", minHeight: "500px" }}>
      {/* Media background */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
        {slide.media_type === "youtube" && youtubeEmbed ? (
          <iframe
            key={slide.id}
            src={youtubeEmbed}
            className="w-full h-full object-cover pointer-events-none"
            style={{ position: "absolute", top: "-60px", left: 0, width: "100%", height: "calc(100% + 120px)", border: 0 }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={slide.title || "Video"}
          />
        ) : slide.media_type === "video" && slide.video_url ? (
          <video
            key={slide.id}
            src={slide.video_url}
            className="w-full h-full object-cover"
            autoPlay muted loop playsInline
          />
        ) : (
          <img
            key={slide.id}
            src={slide.image_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop"}
            alt={slide.title || ""}
            className="w-full h-full object-cover"
            fetchPriority={current === 0 ? "high" : undefined}
            loading={current === 0 ? "eager" : "lazy"}
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0" style={{ background: slide.overlay_color || "rgba(0,0,0,0.45)" }} />
      </div>

      {/* Content */}
      <div className={`relative z-10 h-full flex items-center transition-all duration-500 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-2xl text-white">
            {slide.badge_text && (
              <Badge className="mb-5 bg-store-accent text-store-accent-foreground px-4 py-1.5 text-sm font-semibold">
                {slide.badge_text}
              </Badge>
            )}
            {slide.title && (
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-5 leading-tight">
                {slide.title}
              </h1>
            )}
            {slide.subtitle && (
              <p className="text-lg md:text-xl mb-8 text-white/85 max-w-lg leading-relaxed">
                {slide.subtitle}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              {slide.cta_text && slide.cta_link && (
                <Button size="lg" className="bg-store-accent text-store-accent-foreground hover:bg-store-accent/90 font-semibold px-8 text-base h-12" asChild>
                  <Link to={slide.cta_link}>{slide.cta_text} <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              )}
              {slide.secondary_cta_text && slide.secondary_cta_link && (
                <Button size="lg" variant="outline" className="border-white/80 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm font-semibold px-8 text-base h-12" asChild>
                  <Link to={slide.secondary_cta_link}>{slide.secondary_cta_text}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Arrow navigation */}
      {slides.length > 1 && showArrows && (
        <>
          <button
            onClick={() => { prev(); resetTimer(); }}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm text-white flex items-center justify-center transition-all border border-white/30"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            onClick={() => { next(); resetTimer(); }}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm text-white flex items-center justify-center transition-all border border-white/30"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { goTo(i); resetTimer(); }}
              className={`transition-all rounded-full p-1 ${i === current ? "w-10 h-6 bg-store-accent" : "w-6 h-6 bg-white/50 hover:bg-white/80"}`}
              aria-label={`Go to slide ${i + 1}`}
            >
              <span className={`block rounded-full ${i === current ? "w-full h-full bg-store-accent" : "w-2.5 h-2.5 bg-white/80 mx-auto"}`} />
            </button>
          ))}
        </div>
      )}

      {/* Slide counter */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 right-6 z-20 text-white/70 text-sm font-medium">
          {current + 1} / {slides.length}
        </div>
      )}
    </section>
  );
}

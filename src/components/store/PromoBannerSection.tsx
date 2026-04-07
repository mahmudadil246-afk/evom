import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PromoBanner {
  badge?: string;
  title: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  image: string;
  overlay?: string;
}

interface PromoBannerSectionProps {
  banners?: PromoBanner[];
}

const defaultBanners: PromoBanner[] = [
  {
    badge: "Summer 2024", title: "Summer Collection", subtitle: "Light & breezy styles for the season",
    cta_text: "Shop Now", cta_link: "/products?filter=new",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop", overlay: "rgba(200,100,0,0.3)",
  },
  {
    badge: "Hot Deals", title: "Up to 50% Off", subtitle: "Limited time offer on selected items",
    cta_text: "Grab Deal", cta_link: "/products?filter=sale",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop", overlay: "rgba(100,0,150,0.4)",
  },
];

export function PromoBannerSection({ banners: propBanners }: PromoBannerSectionProps) {
  const items = propBanners && propBanners.length > 0 ? propBanners : defaultBanners;

  return (
    <section className="py-10 bg-store-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-5">
          {items.slice(0, 2).map((banner: PromoBanner, i: number) => (
            <Link key={i} to={banner.cta_link || "/products"} className="group relative overflow-hidden rounded-2xl block" style={{ aspectRatio: "16/9" }}>
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90" style={{ background: banner.overlay || "rgba(0,0,0,0.4)" }} />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white">
                {banner.badge && (
                  <Badge className="self-start mb-3 bg-store-accent text-store-accent-foreground text-xs px-3">{banner.badge}</Badge>
                )}
                <h3 className="font-display text-2xl md:text-3xl font-bold mb-2 leading-tight">{banner.title}</h3>
                {banner.subtitle && <p className="text-white/85 text-sm md:text-base mb-4">{banner.subtitle}</p>}
                {banner.cta_text && (
                  <div className="inline-flex items-center gap-2 text-store-accent font-semibold text-sm group-hover:gap-3 transition-all">
                    {banner.cta_text} <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

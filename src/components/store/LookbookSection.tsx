import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

interface LookbookImage {
  url: string;
  alt?: string;
  link?: string;
}

interface LookbookSectionProps {
  title?: string;
  subtitle?: string;
  images?: LookbookImage[];
}

const defaultImages: LookbookImage[] = [
  { url: "/placeholder.svg", alt: "Look 1", link: "/products" },
  { url: "/placeholder.svg", alt: "Look 2", link: "/products" },
  { url: "/placeholder.svg", alt: "Look 3", link: "/products" },
  { url: "/placeholder.svg", alt: "Look 4", link: "/products" },
  { url: "/placeholder.svg", alt: "Look 5", link: "/products" },
  { url: "/placeholder.svg", alt: "Look 6", link: "/products" },
];

export function LookbookSection({ title, subtitle, images }: LookbookSectionProps) {
  const sectionTitle = title || "Style Inspiration";
  const items = images && images.length > 0 ? images : defaultImages;

  // Hide section entirely if no real images (only defaults with placeholder.svg)
  if (!images?.length && items.every(img => img.url === "/placeholder.svg")) return null;

  return (
    <section className="py-16 bg-store-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 relative inline-block">
            {sectionTitle}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-store-primary" />
          </h2>
          {subtitle && <p className="text-muted-foreground mt-4">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[240px]">
          {items.slice(0, 6).map((img, i) => {
            const isLarge = i === 0 || i === 3;
            return (
              <Link
                key={i}
                to={img.link || "/products"}
                className={`group relative overflow-hidden rounded-2xl ${isLarge ? "row-span-2" : "row-span-1"}`}
              >
                <img
                  src={img.url}
                  alt={img.alt || `Look ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-store-primary/0 group-hover:bg-store-primary/40 transition-all duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="bg-white text-foreground px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <ShoppingBag className="h-4 w-4" />
                    Shop the Look
                  </div>
                </div>
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {i + 1}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

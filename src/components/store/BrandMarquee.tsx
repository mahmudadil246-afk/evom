import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function BrandMarquee() {
  const { data: brands = [] } = useQuery({
    queryKey: ["brands-marquee"],
    queryFn: async () => {
      const { data } = await supabase
        .from("brands")
        .select("id, name, logo_url")
        .eq("is_active", true)
        .not("logo_url", "is", null)
        .order("name");
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  if (brands.length === 0) return null;

  // Double items for seamless loop
  const items = [...brands, ...brands];

  return (
    <section className="py-5 bg-store-card border-b border-store-muted overflow-hidden">
      <div className="container mx-auto px-4 mb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground text-center font-medium">
          Trusted Brands
        </p>
      </div>
      <div className="relative">
        <div className="marquee-track flex items-center gap-16 w-max">
          {items.map((brand, i) => (
            <div
              key={`${brand.id}-${i}`}
              className="flex-shrink-0 h-10 w-28 flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={brand.logo_url!}
                alt={brand.name}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

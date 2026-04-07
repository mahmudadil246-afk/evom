import { useState, useEffect, useRef } from "react";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role?: string;
  avatar?: string;
  rating: number;
  review: string;
}

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  testimonials?: Testimonial[];
}

const defaultTestimonials: Testimonial[] = [
  { name: "Fatima Rahman", role: "Regular Customer", avatar: "F", rating: 5, review: "Amazing quality clothes!" },
  { name: "Karim Ahmed", role: "Verified Buyer", avatar: "K", rating: 5, review: "The panjabi I ordered was stunning." },
  { name: "Nadia Islam", role: "Fashion Blogger", avatar: "N", rating: 4, review: "Great selection of women's clothing." },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? "text-store-accent fill-current" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

export function TestimonialsSection({ title: propTitle, subtitle: propSubtitle, testimonials: propTestimonials }: TestimonialsSectionProps) {
  const title = propTitle || "What Our Customers Say";
  const subtitle = propSubtitle || "Real reviews from real customers";
  const items = propTestimonials && propTestimonials.length > 0 ? propTestimonials : defaultTestimonials;

  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrent((prev) => (prev + 1) % items.length), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items.length]);

  const avatarColors = [
    "from-store-primary to-store-secondary",
    "from-store-secondary to-store-accent",
    "from-store-accent to-store-highlight",
    "from-store-highlight to-store-primary",
    "from-store-primary to-store-accent",
  ];

  return (
    <section className="py-10 bg-store-muted overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 relative inline-block">
            {title}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-store-primary" />
          </h2>
          {subtitle && <p className="text-muted-foreground mt-4">{subtitle}</p>}
        </div>

        <div className="relative">
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {items.slice(0, 3).map((item: Testimonial, i: number) => (
              <TestimonialCard key={i} item={item} color={avatarColors[i % avatarColors.length]} />
            ))}
          </div>
          <div className="md:hidden">
            <TestimonialCard item={items[current]} color={avatarColors[current % avatarColors.length]} />
            <div className="flex justify-center gap-2 mt-6">
              {items.map((_: any, i: number) => (
                <button key={i} onClick={() => { setCurrent(i); if (timerRef.current) clearInterval(timerRef.current); }}
                  className={`transition-all rounded-full min-w-[24px] min-h-[24px] flex items-center justify-center ${i === current ? "w-6 h-6 bg-store-primary" : "w-6 h-6 bg-store-muted-foreground/30"}`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
          {items.length > 3 && (
            <div className="hidden md:grid md:grid-cols-2 gap-6 mt-6 max-w-2xl mx-auto">
              {items.slice(3, 5).map((item: Testimonial, i: number) => (
                <TestimonialCard key={i + 3} item={item} color={avatarColors[(i + 3) % avatarColors.length]} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ item, color }: { item: Testimonial; color: string }) {
  return (
    <div className="bg-store-card rounded-2xl p-6 shadow-sm border border-store-muted relative">
      <Quote className="absolute top-4 right-4 h-8 w-8 text-store-primary/10 fill-current" />
      <StarRating rating={item.rating} />
      <p className="text-foreground text-sm leading-relaxed mt-3 mb-5">"{item.review}"</p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white font-bold text-sm">{item.avatar || item.name.charAt(0)}</span>
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{item.name}</p>
          {item.role && <p className="text-xs text-muted-foreground">{item.role}</p>}
        </div>
      </div>
    </div>
  );
}

import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const pathLabels: Record<string, string> = {
  products: "Products",
  product: "Product",
  cart: "Cart",
  checkout: "Checkout",
  "order-confirmation": "Order Confirmed",
  "track-order": "Track Order",
  track: "Tracking",
  wishlist: "Wishlist",
  contact: "Contact",
  faq: "FAQ",
  "shipping-info": "Shipping Info",
  returns: "Returns",
  "size-guide": "Size Guide",
  privacy: "Privacy Policy",
  terms: "Terms",
  myaccount: "My Account",
  login: "Login",
};

export function StoreBreadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  // Hide breadcrumb on home and unknown/404 routes
  if (segments.length === 0) return null;
  const knownPaths = Object.keys(pathLabels);
  const firstSegment = segments[0];
  if (!knownPaths.includes(firstSegment) && firstSegment !== "product" && firstSegment !== "order-tracking" && firstSegment !== "payment") return null;

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = pathLabels[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  const baseUrl = window.location.origin;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.label,
        ...(c.isLast ? {} : { item: `${baseUrl}${c.path}` }),
      })),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <nav aria-label="Breadcrumb" className="container mx-auto px-4 py-3">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
          <li>
            <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {crumbs.map(({ path, label, isLast }) => (
            <li key={path} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 flex-shrink-0" />
              {isLast ? (
                <span className="text-foreground font-medium truncate max-w-[200px]">{label}</span>
              ) : (
                <Link to={path} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                  {label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

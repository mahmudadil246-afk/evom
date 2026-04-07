import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCategoriesCache, CategoryRow } from "@/hooks/useCategoriesCache";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavCategory {
  label: string;
  href: string;
  slug: string;
  subGroups: { group: string; slug: string; items: { name: string; href: string }[] }[];
}

function buildNavCategories(categories: CategoryRow[]): NavCategory[] {
  const topLevel = categories.filter((c) => !c.parent_id);
  return topLevel.map((parent) => {
    const children = categories.filter((c) => c.parent_id === parent.id);
    const grandchildren = children.filter((child) =>
      categories.some((c) => c.parent_id === child.id)
    );
    const leafChildren = children.filter(
      (child) => !categories.some((c) => c.parent_id === child.id)
    );

    const subGroups: NavCategory["subGroups"] = [];

    if (grandchildren.length > 0) {
      for (const group of grandchildren) {
        const items = categories
          .filter((c) => c.parent_id === group.id)
          .map((c) => ({ name: c.name, href: `/products?category=${parent.slug}&sub=${c.slug}` }));
        if (items.length > 0) {
          subGroups.push({ group: group.name, slug: group.slug, items });
        }
      }
    }

    if (leafChildren.length > 0) {
      subGroups.push({
        group: leafChildren.length > 0 && grandchildren.length > 0 ? "Other" : parent.name,
        slug: parent.slug,
        items: leafChildren.map((c) => ({
          name: c.name,
          href: `/products?category=${parent.slug}&sub=${c.slug}`,
        })),
      });
    }

    return {
      label: parent.name,
      href: `/products?category=${parent.slug}`,
      slug: parent.slug,
      subGroups,
    };
  });
}

export function useDynamicCategories() {
  const { data: categories = [], isLoading } = useCategoriesCache();
  const navCategories = useMemo(() => buildNavCategories(categories), [categories]);
  return { navCategories, loading: isLoading };
}

export function MegaMenuNav() {
  const { t } = useLanguage();

  const menuLinks = [
    { label: "New Arrivals", href: "/products?sort=newest" },
    { label: "Flash Sale", href: "/products?flash_sale=true" },
    { label: t('store.contactUs'), href: "/contact" },
    { label: t('store.trackOrder'), href: "/track-order" },
    { label: t('store.shippingInfo'), href: "/shipping-info" },
  ];

  return (
    <nav className="flex items-center justify-center gap-1 py-1">
      {menuLinks.map((page) => (
        <Link
          key={page.label}
          to={page.href}
          className="px-3 py-2 text-sm font-medium rounded-lg transition-colors text-foreground hover:text-store-primary hover:bg-store-muted"
        >
          {page.label}
        </Link>
      ))}
    </nav>
  );
}

// Mobile accordion version
interface MobileMegaMenuProps {
  onClose: () => void;
}

export function MobileMegaMenu({ onClose }: MobileMegaMenuProps) {
  const { t } = useLanguage();

  const menuLinks = [
    { label: "New Arrivals", href: "/products?sort=newest" },
    { label: "Flash Sale", href: "/products?flash_sale=true" },
    { label: t('store.contactUs'), href: "/contact" },
    { label: t('store.trackOrder'), href: "/track-order" },
    { label: t('store.shippingInfo'), href: "/shipping-info" },
  ];

  return (
    <div className="flex flex-col gap-1">
      {menuLinks.map((page) => (
        <Link
          key={page.label}
          to={page.href}
          className="block py-3 text-base font-medium text-foreground hover:text-store-primary transition-colors border-b border-store-muted last:border-0"
          onClick={onClose}
        >
          {page.label}
        </Link>
      ))}
    </div>
  );
}

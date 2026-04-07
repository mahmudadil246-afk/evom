import { ReactNode, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { LiveChatWidget } from "@/components/store/LiveChatWidget";
import { MaintenancePage } from "@/components/store/MaintenancePage";
import { BackToTop } from "@/components/store/BackToTop";
import { MobileBottomNav } from "@/components/store/MobileBottomNav";
import { StoreBreadcrumb } from "@/components/store/StoreBreadcrumb";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";
import { useMaintenanceCheck } from "@/hooks/useMaintenanceMode";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Suspense } from "react";

interface StoreLayoutProps {
  children?: ReactNode;
}

const StoreContentLoader = () => <div className="min-h-[200px]" />;

export function StoreLayout({ children }: StoreLayoutProps) {
  usePageViewTracking();
  const { isMaintenanceMode, message, estimatedEnd, loading: maintenanceLoading } = useMaintenanceCheck();
  const { user, isStaff } = useAuth();
  const { section: headerSection } = useSiteContent("header");
  const headerContent = headerSection("main_content")?.content;

  // Favicon: read from header content (Header Settings)
  useEffect(() => {
    const faviconUrl = headerContent?.store_favicon;
    if (faviconUrl) {
      applyFavicon(faviconUrl);
    }
  }, [headerContent?.store_favicon]);

  function applyFavicon(url: string) {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  // Show maintenance page for non-admin visitors (allow login page access)
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  if (!maintenanceLoading && isMaintenanceMode && !isStaff && !isLoginPage) {
    return <MaintenancePage message={message} estimatedEnd={estimatedEnd} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-store-background">
      <StoreHeader />
      <StoreBreadcrumb />
      <main className="flex-1 pb-16 md:pb-0">
        {children || (
          <Suspense fallback={<StoreContentLoader />}>
            <Outlet />
          </Suspense>
        )}
      </main>
      <StoreFooter />
      <LiveChatWidget />
      <BackToTop />
      <MobileBottomNav />
    </div>
  );
}

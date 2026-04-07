import { useState, lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const CommandPalette = lazy(() => import("@/components/admin/CommandPalette").then(m => ({ default: m.CommandPalette })));

const ContentLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useSidebarCollapse();

  return (
    <div className="min-h-screen bg-background">
      {/* Command Palette (⌘K) - lazy loaded */}
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-transform lg:translate-x-0",
        collapsed ? "w-[68px]" : "w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AdminSidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} onCloseMobile={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:ml-[68px]" : "lg:ml-64"
      )}>
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} collapsed={collapsed} />
        <main className="p-3 sm:p-4 md:p-6">
          <AdminBreadcrumb />
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

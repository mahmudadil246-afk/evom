import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { GA4Provider } from "@/components/GA4Provider";
import { DynamicTitleProvider } from "@/components/DynamicTitleProvider";
import { SiteThemeProvider } from "@/components/SiteThemeProvider";

import { AppInitializer } from "@/components/AppInitializer";
import { OfflineIndicator } from "@/components/OfflineIndicator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: { retry: 1 },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppInitializer>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <SiteThemeProvider>
            <ThemeProvider>
              <LanguageProvider>
                <AuthProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <GA4Provider>
                        <DynamicTitleProvider>
                          <TooltipProvider>
                            <Toaster />
                            <Sonner />
                            <OfflineIndicator />
                            {children}
                          </TooltipProvider>
                        </DynamicTitleProvider>
                      </GA4Provider>
                    </WishlistProvider>
                  </CartProvider>
                </AuthProvider>
              </LanguageProvider>
            </ThemeProvider>
          </SiteThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </AppInitializer>
  );
}

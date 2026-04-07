import { useStoreSettingsCache } from "@/hooks/useStoreSettingsCache";

interface TrackingConfig {
  measurementId: string | null;
  isEnabled: boolean;
  isLoading: boolean;
  gtmContainerId: string | null;
  gtmEnabled: boolean;
  metaPixelId: string | null;
  metaPixelEnabled: boolean;
  googleSiteVerification: string | null;
}

export function useGA4Config(): TrackingConfig {
  const { data: settings, isLoading } = useStoreSettingsCache();

  if (!settings) {
    return {
      measurementId: null,
      isEnabled: false,
      isLoading,
      gtmContainerId: null,
      gtmEnabled: false,
      metaPixelId: null,
      metaPixelEnabled: false,
      googleSiteVerification: null,
    };
  }

  return {
    measurementId: settings.GA4_MEASUREMENT_ID || null,
    isEnabled: settings.GA4_ENABLED === "true",
    isLoading: false,
    gtmContainerId: settings.GTM_CONTAINER_ID || null,
    gtmEnabled: settings.GTM_ENABLED === "true",
    metaPixelId: settings.META_PIXEL_ID || null,
    metaPixelEnabled: settings.META_PIXEL_ENABLED === "true",
    googleSiteVerification: settings.GOOGLE_SITE_VERIFICATION || null,
  };
}

import { useEffect } from "react";
import { useGA4Config } from "@/hooks/useGA4Config";

// Declare gtag and fbq for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

export function GA4Provider({ children }: { children: React.ReactNode }) {
  const { measurementId, isEnabled, isLoading, gtmContainerId, gtmEnabled, metaPixelId, metaPixelEnabled, googleSiteVerification } = useGA4Config();

  useEffect(() => {
    if (isLoading) return;

    // --- GA4 ---
    const existingScript = document.getElementById('ga4-dynamic-script');
    const existingInline = document.getElementById('ga4-dynamic-inline');
    if (existingScript) existingScript.remove();
    if (existingInline) existingInline.remove();

    if (isEnabled && measurementId) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.id = 'ga4-dynamic-script';
      document.head.appendChild(script);

      const inlineScript = document.createElement('script');
      inlineScript.id = 'ga4-dynamic-inline';
      inlineScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}');
      `;
      document.head.appendChild(inlineScript);
    }

    // --- GTM ---
    const existingGtm = document.getElementById('gtm-dynamic-script');
    const existingGtmNoscript = document.getElementById('gtm-dynamic-noscript');
    if (existingGtm) existingGtm.remove();
    if (existingGtmNoscript) existingGtmNoscript.remove();

    if (gtmEnabled && gtmContainerId) {
      const gtmScript = document.createElement('script');
      gtmScript.id = 'gtm-dynamic-script';
      gtmScript.textContent = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmContainerId}');
      `;
      document.head.appendChild(gtmScript);

      // noscript iframe
      const noscript = document.createElement('noscript');
      noscript.id = 'gtm-dynamic-noscript';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`;
      iframe.height = '0';
      iframe.width = '0';
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);
    }

    // --- Meta Pixel ---
    const existingFbq = document.getElementById('meta-pixel-script');
    if (existingFbq) existingFbq.remove();

    if (metaPixelEnabled && metaPixelId) {
      const fbScript = document.createElement('script');
      fbScript.id = 'meta-pixel-script';
      fbScript.textContent = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${metaPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);
    }

    // --- Google Search Console Verification ---
    const existingGsc = document.getElementById('gsc-verification-meta');
    if (existingGsc) existingGsc.remove();

    if (googleSiteVerification) {
      const meta = document.createElement('meta');
      meta.id = 'gsc-verification-meta';
      meta.name = 'google-site-verification';
      meta.content = googleSiteVerification;
      document.head.appendChild(meta);
    }
  }, [measurementId, isEnabled, isLoading, gtmContainerId, gtmEnabled, metaPixelId, metaPixelEnabled, googleSiteVerification]);

  return <>{children}</>;
}

export function getGA4MeasurementId(): string | null {
  const script = document.getElementById('ga4-dynamic-script') as HTMLScriptElement;
  if (script?.src) {
    const match = script.src.match(/id=(G-[A-Z0-9]+)/);
    return match ? match[1] : null;
  }
  return null;
}

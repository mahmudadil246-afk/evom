import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// This component loads theme settings from DB and injects them as CSS custom properties
// ONLY for light mode. Dark mode uses the CSS .dark {} tokens from index.css.
// Non-blocking: children render immediately, theme applies async.
export function SiteThemeProvider({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data, error } = await supabase
          .from("site_theme_settings" as any)
          .select("setting_key, setting_value, category");

        if (error) throw error;

        const settings = (data as any[]) || [];

        const cssVarMap: Record<string, string> = {
          primary_color: '--primary',
          secondary_color: '--secondary',
          accent_color: '--accent',
          background_color: '--background',
          foreground_color: '--foreground',
          muted_color: '--muted-foreground',
          success_color: '--success',
          warning_color: '--warning',
          destructive_color: '--destructive',
          border_color: '--border',
          card_color: '--card',
          sidebar_bg: '--sidebar-background',
          sidebar_text: '--sidebar-foreground',
          sidebar_active: '--sidebar-primary',
          sidebar_icon_color: '--sidebar-muted',
          store_primary: '--store-primary',
          store_secondary: '--store-secondary',
          store_accent: '--store-accent',
          store_bg: '--store-background',
          chart_color_1: '--chart-1',
          chart_color_2: '--chart-2',
          chart_color_3: '--chart-3',
          chart_color_4: '--chart-4',
          chart_color_5: '--chart-5',
          input_border_color: '--input',
          input_focus_color: '--ring',
        };

        let lightCssRules = '';
        for (const setting of settings) {
          const cssVar = cssVarMap[setting.setting_key];
          if (cssVar && setting.setting_value) {
            lightCssRules += `  ${cssVar}: ${setting.setting_value};\n`;
          }
        }

        let styleEl = document.getElementById('site-theme-light') as HTMLStyleElement;
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'site-theme-light';
          document.head.appendChild(styleEl);
        }
        if (lightCssRules) {
          styleEl.textContent = `:root:not(.dark) {\n${lightCssRules}}`;
        }

        const root = document.documentElement;
        const headingFont = settings.find(s => s.setting_key === 'heading_font')?.setting_value;
        const bodyFont = settings.find(s => s.setting_key === 'body_font')?.setting_value;
        
        if (headingFont || bodyFont) {
          const fonts = [headingFont, bodyFont].filter(Boolean).map(f => f!.replace(/ /g, '+')).join('&family=');
          const link = document.getElementById('dynamic-fonts') as HTMLLinkElement;
          if (link) {
            link.href = `https://fonts.googleapis.com/css2?family=${fonts}:wght@300;400;500;600;700&display=swap`;
          } else {
            const newLink = document.createElement('link');
            newLink.id = 'dynamic-fonts';
            newLink.rel = 'stylesheet';
            newLink.href = `https://fonts.googleapis.com/css2?family=${fonts}:wght@300;400;500;600;700&display=swap`;
            document.head.appendChild(newLink);
          }

          if (bodyFont) {
            root.style.setProperty('--font-body', `'${bodyFont}', sans-serif`);
            document.body.style.fontFamily = `'${bodyFont}', sans-serif`;
          }
          if (headingFont) {
            root.style.setProperty('--font-heading', `'${headingFont}', sans-serif`);
          }
        }

        const globalRadius = settings.find(s => s.setting_key === 'global_radius')?.setting_value;
        if (globalRadius) {
          root.style.setProperty('--radius', globalRadius);
        }

        const customCss = settings.find(s => s.setting_key === 'custom_css')?.setting_value;
        if (customCss) {
          let customStyleEl = document.getElementById('custom-theme-css') as HTMLStyleElement;
          if (!customStyleEl) {
            customStyleEl = document.createElement('style');
            customStyleEl.id = 'custom-theme-css';
            document.head.appendChild(customStyleEl);
          }
          customStyleEl.textContent = customCss;
        }

        const brandName = settings.find(s => s.setting_key === 'brand_name')?.setting_value;
        if (brandName) {
          root.style.setProperty('--brand-name', `'${brandName}'`);
        }

      } catch (error) {
        console.error("Failed to load theme settings:", error);
      }
    };

    loadTheme();
  }, []);

  // Non-blocking: render children immediately
  return <>{children}</>;
}

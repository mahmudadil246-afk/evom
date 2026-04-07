import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { usePageContent } from "@/hooks/useSiteContent";

const STORE_NAME_CACHE_KEY = "_store_name";

interface TitleContextType {
  storeName: string;
  setPageTitle: (title?: string) => void;
}

const TitleContext = createContext<TitleContextType>({
  storeName: "",
  setPageTitle: () => {},
});

export function useSiteTitle() {
  return useContext(TitleContext);
}

export function DynamicTitleProvider({ children }: { children: ReactNode }) {
  const cachedName = localStorage.getItem(STORE_NAME_CACHE_KEY) || "";
  const [storeName, setStoreName] = useState(cachedName);
  const { data: headerContent } = usePageContent("header");

  useEffect(() => {
    if (cachedName) {
      document.title = cachedName;
    }
  }, []);

  // Update from header content when available
  useEffect(() => {
    const headerCont = (headerContent?.content as any) || {};
    const name = headerCont.store_name;
    if (name && name !== storeName) {
      setStoreName(name);
      document.title = name;
      localStorage.setItem(STORE_NAME_CACHE_KEY, name);
      updateMetaTags(name);
    }

    // Dynamic favicon from Header Settings
    const favicon = headerCont.store_favicon;
    if (favicon) {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = favicon;
    }
  }, [headerContent]);

  const updateMetaTags = (name: string) => {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', name);
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', name);
  };

  const setPageTitle = (title?: string) => {
    if (title) {
      document.title = `${title} | ${storeName}`;
    } else {
      document.title = storeName;
    }
  };

  return (
    <TitleContext.Provider value={{ storeName, setPageTitle }}>
      {children}
    </TitleContext.Provider>
  );
}

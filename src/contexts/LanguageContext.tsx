import { createContext, useContext, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Convert translation key to readable text
// e.g. "bankTransfer.accountName" → "Account Name"
// e.g. "cart.addToCart" → "Add To Cart"
function keyToText(key: string): string {
  // Take the last segment after the last dot
  const segment = key.includes('.') ? key.split('.').pop()! : key;
  // Convert camelCase/snake_case to spaced words, capitalize each
  return segment
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  return (
    <LanguageContext.Provider value={{ language: 'en', setLanguage: () => {}, t: keyToText }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

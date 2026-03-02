"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { translations, type Locale, type TranslationKey, defaultLocale, localeNames } from "./translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  locales: Locale[];
  localeName: (locale: Locale) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "pmcc-locale";

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);
  const [mounted, setMounted] = useState(false);

  // Load locale from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === "en" || stored === "fil")) {
      setLocaleState(stored);
    } else {
      // Try to detect from browser
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("fil") || browserLang.startsWith("tl")) {
        setLocaleState("fil");
      }
    }
  }, []);

  // Update localStorage and document lang when locale changes
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale === "fil" ? "fil" : "en";
  }, []);

  // Translation function with parameter support
  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = translations[locale][key] || translations.en[key] || key;

    // Replace parameters like {name} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(value));
      });
    }

    return text;
  }, [locale]);

  const localeName = useCallback((loc: Locale): string => {
    return localeNames[loc];
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <I18nContext.Provider value={{
        locale: defaultLocale,
        setLocale: () => {},
        t: (key) => translations[defaultLocale][key] || key,
        locales: ["en", "fil"],
        localeName: (loc) => localeNames[loc],
      }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{
      locale,
      setLocale,
      t,
      locales: ["en", "fil"],
      localeName,
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}

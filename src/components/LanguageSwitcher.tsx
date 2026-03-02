"use client";

import { useI18n } from "@/lib/i18n/context";
import { Globe } from "lucide-react";
import { useState } from "react";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "toggle" | "buttons";
  className?: string;
}

export function LanguageSwitcher({ variant = "dropdown", className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, locales, localeName } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "toggle") {
    return (
      <button
        type="button"
        onClick={() => setLocale(locale === "en" ? "fil" : "en")}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}
        aria-label="Toggle language"
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase">{locale}</span>
      </button>
    );
  }

  if (variant === "buttons") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              locale === loc
                ? "bg-amber-500 text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {localeName(loc)}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4" />
        <span>{localeName(locale)}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
            <div role="listbox">
              {locales.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  role="option"
                  aria-selected={locale === loc}
                  onClick={() => {
                    setLocale(loc);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    locale === loc
                      ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {loc === "en" && "🇺🇸"}
                    {loc === "fil" && "🇵🇭"}
                    {localeName(loc)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LanguageSwitcher;

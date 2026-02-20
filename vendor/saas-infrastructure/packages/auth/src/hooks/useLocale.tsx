import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useSupabase } from "../provider";
import { useAuth } from "./useAuth";
import {
  createFormatters,
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  SUPPORTED_LOCALES,
  COMMON_TIMEZONES,
} from "@saas-infra/utils";

export interface LocaleSettings {
  locale: string;
  timezone: string;
}

export interface LocaleFormatters {
  locale: string;
  timezone: string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date | string) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (cents: number, currency?: string) => string;
  formatPercent: (value: number, decimals?: number) => string;
  formatCompact: (value: number) => string;
  updateLocale: (locale: string) => Promise<void>;
  updateTimezone: (timezone: string) => Promise<void>;
  isLoading: boolean;
}

// Re-export constants for convenience
export { SUPPORTED_LOCALES, COMMON_TIMEZONES };

const LocaleContext = createContext<LocaleFormatters | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [isLoading, setIsLoading] = useState(true);

  // Load user preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      if (!user) {
        // Use browser locale for guests
        const browserLocale = typeof navigator !== "undefined" ? navigator.language || DEFAULT_LOCALE : DEFAULT_LOCALE;
        setLocale(browserLocale);
        setTimezone(DEFAULT_TIMEZONE);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("locale, timezone")
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          setLocale(data.locale || DEFAULT_LOCALE);
          setTimezone(data.timezone || DEFAULT_TIMEZONE);
        }
      } catch (err) {
        console.error("Failed to load locale preferences:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, [user, supabase]);

  const updateLocale = useCallback(async (newLocale: string) => {
    if (!user) return;

    setLocale(newLocale);
    await supabase
      .from("profiles")
      .update({ locale: newLocale })
      .eq("user_id", user.id);
  }, [user, supabase]);

  const updateTimezone = useCallback(async (newTimezone: string) => {
    if (!user) return;

    setTimezone(newTimezone);
    await supabase
      .from("profiles")
      .update({ timezone: newTimezone })
      .eq("user_id", user.id);
  }, [user, supabase]);

  // Create formatters using the utility function
  const formatters = createFormatters(locale, timezone);

  const value: LocaleFormatters = {
    locale,
    timezone,
    ...formatters,
    updateLocale,
    updateTimezone,
    isLoading,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleFormatters {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

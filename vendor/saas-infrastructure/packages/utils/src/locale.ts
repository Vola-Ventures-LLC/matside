// Common locale options for dropdowns
export const SUPPORTED_LOCALES = [
  { code: "en-US", label: "English (US)", region: "Americas" },
  { code: "en-GB", label: "English (UK)", region: "Europe" },
  { code: "es-ES", label: "Español (España)", region: "Europe" },
  { code: "es-MX", label: "Español (México)", region: "Americas" },
  { code: "fr-FR", label: "Français", region: "Europe" },
  { code: "de-DE", label: "Deutsch", region: "Europe" },
  { code: "it-IT", label: "Italiano", region: "Europe" },
  { code: "pt-BR", label: "Português (Brasil)", region: "Americas" },
  { code: "pt-PT", label: "Português (Portugal)", region: "Europe" },
  { code: "nl-NL", label: "Nederlands", region: "Europe" },
  { code: "pl-PL", label: "Polski", region: "Europe" },
  { code: "ja-JP", label: "日本語", region: "Asia" },
  { code: "ko-KR", label: "한국어", region: "Asia" },
  { code: "zh-CN", label: "中文 (简体)", region: "Asia" },
  { code: "zh-TW", label: "中文 (繁體)", region: "Asia" },
  { code: "ar-SA", label: "العربية", region: "Middle East" },
  { code: "he-IL", label: "עברית", region: "Middle East" },
  { code: "hi-IN", label: "हिन्दी", region: "Asia" },
  { code: "ru-RU", label: "Русский", region: "Europe" },
  { code: "tr-TR", label: "Türkçe", region: "Europe" },
] as const;

// Common timezones grouped by region
export const COMMON_TIMEZONES = [
  { zone: "America/New_York", label: "Eastern Time (US)", region: "Americas" },
  { zone: "America/Chicago", label: "Central Time (US)", region: "Americas" },
  { zone: "America/Denver", label: "Mountain Time (US)", region: "Americas" },
  { zone: "America/Los_Angeles", label: "Pacific Time (US)", region: "Americas" },
  { zone: "America/Sao_Paulo", label: "São Paulo", region: "Americas" },
  { zone: "America/Mexico_City", label: "Mexico City", region: "Americas" },
  { zone: "Europe/London", label: "London", region: "Europe" },
  { zone: "Europe/Paris", label: "Paris / Berlin", region: "Europe" },
  { zone: "Europe/Moscow", label: "Moscow", region: "Europe" },
  { zone: "Asia/Dubai", label: "Dubai", region: "Middle East" },
  { zone: "Asia/Kolkata", label: "India (IST)", region: "Asia" },
  { zone: "Asia/Singapore", label: "Singapore", region: "Asia" },
  { zone: "Asia/Shanghai", label: "China (CST)", region: "Asia" },
  { zone: "Asia/Tokyo", label: "Tokyo", region: "Asia" },
  { zone: "Australia/Sydney", label: "Sydney", region: "Oceania" },
  { zone: "Pacific/Auckland", label: "Auckland", region: "Oceania" },
  { zone: "UTC", label: "UTC", region: "Universal" },
] as const;

export const DEFAULT_LOCALE = "en-US";
export const DEFAULT_TIMEZONE = typeof Intl !== "undefined"
  ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  : "UTC";

// Standalone formatters for use outside React (e.g., in utilities)
export function createFormatters(locale: string, timezone: string) {
  const toDate = (date: Date | string): Date => {
    return typeof date === "string" ? new Date(date) : date;
  };

  return {
    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      const d = toDate(date);
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: timezone,
        ...options,
      }).format(d);
    },
    formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      const d = toDate(date);
      return new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
        ...options,
      }).format(d);
    },
    formatDateTime: (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      const d = toDate(date);
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
        ...options,
      }).format(d);
    },
    formatRelativeTime: (date: Date | string): string => {
      const d = toDate(date);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

      if (diffSecs < 60) return rtf.format(-diffSecs, "second");
      if (diffMins < 60) return rtf.format(-diffMins, "minute");
      if (diffHours < 24) return rtf.format(-diffHours, "hour");
      if (diffDays < 7) return rtf.format(-diffDays, "day");
      if (diffWeeks < 4) return rtf.format(-diffWeeks, "week");
      if (diffMonths < 12) return rtf.format(-diffMonths, "month");
      return rtf.format(-diffYears, "year");
    },
    formatCurrency: (cents: number, currency = "USD"): string => {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }).format(cents / 100);
    },
    formatNumber: (value: number, options?: Intl.NumberFormatOptions): string => {
      return new Intl.NumberFormat(locale, options).format(value);
    },
    formatPercent: (value: number, decimals = 0): string => {
      return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    },
    formatCompact: (value: number): string => {
      return new Intl.NumberFormat(locale, {
        notation: "compact",
        compactDisplay: "short",
      }).format(value);
    },
  };
}

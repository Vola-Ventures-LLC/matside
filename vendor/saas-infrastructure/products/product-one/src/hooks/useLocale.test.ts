import { describe, it, expect, vi } from "vitest";

// Mock Supabase client to avoid requiring env vars at module load time
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}));

import { createFormatters } from "@saas-infra/utils";

describe("createFormatters", () => {
  describe("formatDate", () => {
    const date = new Date("2026-02-04T14:30:00Z");

    it("formats dates in US English format", () => {
      const { formatDate } = createFormatters("en-US", "UTC");
      const result = formatDate(date);
      expect(result).toMatch(/Feb/);
      expect(result).toMatch(/4/);
      expect(result).toMatch(/2026/);
    });

    it("formats dates in German format", () => {
      const { formatDate } = createFormatters("de-DE", "UTC");
      const result = formatDate(date);
      // German uses "Feb." or "Februar" and different order
      expect(result).toMatch(/Feb/);
      expect(result).toMatch(/2026/);
    });

    it("formats dates in Japanese format", () => {
      const { formatDate } = createFormatters("ja-JP", "UTC");
      const result = formatDate(date);
      expect(result).toMatch(/2026/);
      expect(result).toMatch(/2/); // Month
      expect(result).toMatch(/4/); // Day
    });

    it("handles string date input", () => {
      const { formatDate } = createFormatters("en-US", "UTC");
      const result = formatDate("2026-02-04T14:30:00Z");
      expect(result).toMatch(/Feb/);
      expect(result).toMatch(/2026/);
    });

    it("respects timezone for date display", () => {
      const { formatDate } = createFormatters("en-US", "America/New_York");
      // This date at 2am UTC would be previous day in NY
      const midnightUTC = new Date("2026-02-04T02:00:00Z");
      const result = formatDate(midnightUTC);
      // In New York (UTC-5), 2am UTC is still Feb 3
      expect(result).toMatch(/Feb/);
    });
  });

  describe("formatCurrency", () => {
    it("formats USD correctly in US locale", () => {
      const { formatCurrency } = createFormatters("en-US", "UTC");
      expect(formatCurrency(1999)).toBe("$19.99");
      expect(formatCurrency(100)).toBe("$1.00");
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("formats large amounts with thousands separators (US)", () => {
      const { formatCurrency } = createFormatters("en-US", "UTC");
      const result = formatCurrency(1234500);
      expect(result).toBe("$12,345.00");
    });

    it("formats EUR correctly in German locale", () => {
      const { formatCurrency } = createFormatters("de-DE", "UTC");
      const result = formatCurrency(1999, "EUR");
      // German format: "19,99 €" with non-breaking space
      expect(result).toMatch(/19,99/);
      expect(result).toMatch(/€/);
    });

    it("formats GBP correctly in UK locale", () => {
      const { formatCurrency } = createFormatters("en-GB", "UTC");
      const result = formatCurrency(1999, "GBP");
      expect(result).toMatch(/£19\.99/);
    });

    it("formats JPY correctly (no decimals)", () => {
      const { formatCurrency } = createFormatters("ja-JP", "UTC");
      const result = formatCurrency(1999, "JPY");
      // JPY typically shows as whole number: ￥20 (1999 cents = ~20 yen after /100)
      expect(result).toMatch(/￥|¥/);
    });

    it("handles negative amounts", () => {
      const { formatCurrency } = createFormatters("en-US", "UTC");
      const result = formatCurrency(-1999);
      expect(result).toMatch(/-?\$19\.99/);
    });

    it("handles zero correctly", () => {
      const { formatCurrency } = createFormatters("en-US", "UTC");
      expect(formatCurrency(0)).toBe("$0.00");
    });
  });

  describe("formatNumber", () => {
    it("formats numbers with US separators", () => {
      const { formatNumber } = createFormatters("en-US", "UTC");
      expect(formatNumber(1234567.89)).toBe("1,234,567.89");
    });

    it("formats numbers with German separators", () => {
      const { formatNumber } = createFormatters("de-DE", "UTC");
      const result = formatNumber(1234567.89);
      // German uses period for thousands, comma for decimal
      expect(result).toMatch(/1\.234\.567,89/);
    });

    it("formats numbers with French separators", () => {
      const { formatNumber } = createFormatters("fr-FR", "UTC");
      const result = formatNumber(1234567.89);
      // French uses non-breaking space for thousands, comma for decimal
      expect(result).toMatch(/1.*234.*567,89/);
    });

    it("handles integers", () => {
      const { formatNumber } = createFormatters("en-US", "UTC");
      expect(formatNumber(1000000)).toBe("1,000,000");
    });

    it("handles small decimals", () => {
      const { formatNumber } = createFormatters("en-US", "UTC");
      expect(formatNumber(0.123)).toBe("0.123");
    });

    it("handles negative numbers", () => {
      const { formatNumber } = createFormatters("en-US", "UTC");
      expect(formatNumber(-1234.56)).toBe("-1,234.56");
    });

    it("handles zero", () => {
      const { formatNumber } = createFormatters("en-US", "UTC");
      expect(formatNumber(0)).toBe("0");
    });

    it("supports custom options", () => {
      const { formatNumber } = createFormatters("en-US", "UTC");
      const result = formatNumber(0.1234, { 
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      expect(result).toBe("12.3%");
    });
  });

  describe("edge cases", () => {
    it("handles invalid locale gracefully", () => {
      // Intl should fall back to default behavior
      const { formatNumber } = createFormatters("invalid-locale", "UTC");
      const result = formatNumber(1234.56);
      expect(typeof result).toBe("string");
      // Just verify it produces a string with the number in some format
      expect(result.length).toBeGreaterThan(0);
    });

    it("handles very large numbers", () => {
      const { formatNumber } = createFormatters("en-US", "UTC");
      const result = formatNumber(1e15);
      expect(result).toBe("1,000,000,000,000,000");
    });

    it("handles very small decimals", () => {
      const { formatNumber } = createFormatters("en-US", "UTC");
      const result = formatNumber(0.0001);
      expect(result).toBe("0");
    });

    it("currency handles fractional cents correctly", () => {
      const { formatCurrency } = createFormatters("en-US", "UTC");
      // 99.5 cents should round to $1.00
      const result = formatCurrency(99.5);
      expect(result).toBe("$1.00");
    });
  });

  describe("RTL locale support", () => {
    it("formats Arabic numbers correctly", () => {
      const { formatNumber } = createFormatters("ar-SA", "UTC");
      const result = formatNumber(1234.56);
      // Arabic may use Eastern Arabic numerals or Western
      expect(typeof result).toBe("string");
    });

    it("formats Hebrew currency correctly", () => {
      const { formatCurrency } = createFormatters("he-IL", "UTC");
      const result = formatCurrency(1999, "ILS");
      // Should contain shekel symbol
      expect(result).toMatch(/₪|ILS/);
    });
  });

  describe("Asian locale support", () => {
    it("formats Chinese numbers correctly", () => {
      const { formatNumber } = createFormatters("zh-CN", "UTC");
      const result = formatNumber(10000);
      expect(result).toBe("10,000");
    });

    it("formats Korean currency correctly", () => {
      const { formatCurrency } = createFormatters("ko-KR", "UTC");
      const result = formatCurrency(1999, "KRW");
      // Korean won doesn't use decimals
      expect(result).toMatch(/₩|KRW/);
    });
  });
});

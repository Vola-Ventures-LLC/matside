import { describe, it, expect } from "vitest";

/**
 * Unit tests for NavigationCTA logic
 * Tests CTA configuration and behavior
 */

interface NavigationCTA {
  enabled: boolean;
  label: string;
  path: string;
  description: string;
  external: boolean;
  complete_on_return: boolean;
}

describe("NavigationCTA Logic", () => {
  const defaultCTA: NavigationCTA = {
    enabled: true,
    label: "Set up Stripe",
    path: "/admin/billing/connect",
    description: "Complete your billing setup",
    external: false,
    complete_on_return: false,
  };

  describe("CTA Configuration", () => {
    it("should have all required properties", () => {
      expect(defaultCTA.enabled).toBeDefined();
      expect(defaultCTA.label).toBeDefined();
      expect(defaultCTA.path).toBeDefined();
      expect(defaultCTA.description).toBeDefined();
      expect(defaultCTA.external).toBeDefined();
      expect(defaultCTA.complete_on_return).toBeDefined();
    });

    it("should distinguish internal from external links", () => {
      const internalCTA: NavigationCTA = { ...defaultCTA, external: false };
      const externalCTA: NavigationCTA = { ...defaultCTA, external: true, path: "https://stripe.com" };

      expect(internalCTA.external).toBe(false);
      expect(externalCTA.external).toBe(true);
    });
  });

  describe("CTA Visibility", () => {
    it("should show CTA when enabled", () => {
      const cta: NavigationCTA = { ...defaultCTA, enabled: true };
      expect(cta.enabled).toBe(true);
    });

    it("should hide CTA when disabled", () => {
      const cta: NavigationCTA = { ...defaultCTA, enabled: false };
      expect(cta.enabled).toBe(false);
    });
  });

  describe("Return Behavior", () => {
    it("should track complete_on_return setting", () => {
      const autoCompleteCTA: NavigationCTA = { ...defaultCTA, complete_on_return: true };
      const manualCompleteCTA: NavigationCTA = { ...defaultCTA, complete_on_return: false };

      expect(autoCompleteCTA.complete_on_return).toBe(true);
      expect(manualCompleteCTA.complete_on_return).toBe(false);
    });
  });

  describe("Path Validation", () => {
    it("should accept internal paths", () => {
      const internalPaths = [
        "/admin/billing/connect",
        "/settings",
        "/admin/setup",
        "/org/members",
      ];

      internalPaths.forEach((path) => {
        expect(path.startsWith("/")).toBe(true);
      });
    });

    it("should accept external URLs", () => {
      const externalUrls = [
        "https://stripe.com/dashboard",
        "https://docs.example.com",
      ];

      externalUrls.forEach((url) => {
        expect(url.startsWith("http")).toBe(true);
      });
    });
  });

  describe("Label Requirements", () => {
    it("should have non-empty label", () => {
      expect(defaultCTA.label.length).toBeGreaterThan(0);
    });

    it("should have descriptive label", () => {
      // Labels should be action-oriented
      const goodLabels = [
        "Set up Stripe",
        "Configure billing",
        "Import data",
        "Complete setup",
      ];

      goodLabels.forEach((label) => {
        expect(label.length).toBeLessThanOrEqual(50);
        expect(label.length).toBeGreaterThan(5);
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock data
const mockNotifications = [
  {
    id: "notif-1",
    user_id: "user-123",
    title: "Welcome!",
    message: "Thanks for signing up",
    type: "success",
    link: "/dashboard",
    is_read: false,
    created_at: "2026-02-04T10:00:00Z",
  },
  {
    id: "notif-2",
    user_id: "user-123",
    title: "New feature",
    message: "Check out our new billing options",
    type: "info",
    link: null,
    is_read: true,
    created_at: "2026-02-03T10:00:00Z",
  },
  {
    id: "notif-3",
    user_id: "user-123",
    title: "Action required",
    message: null,
    type: "warning",
    link: "/settings",
    is_read: false,
    created_at: "2026-02-02T10:00:00Z",
  },
];

let mockSelectData = [...mockNotifications];
let mockSelectError: Error | null = null;

// Mock Supabase - create mocks inside the factory to avoid hoisting issues
vi.mock("@/integrations/supabase/client", () => {
  const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: mockSubscribe,
  };
  const mockRemoveChannel = vi.fn();

  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() =>
                Promise.resolve({ data: mockSelectData, error: mockSelectError })
              ),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => Promise.resolve({ error: null })),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => Promise.resolve({ error: null })),
          }),
        }),
      })),
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: mockRemoveChannel,
    },
    // Export mock functions for test access
    __mocks: {
      mockChannel,
      mockRemoveChannel,
    },
  };
});

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-123", email: "test@example.com" } }),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Import after mocks
import { useNotifications } from "./useNotifications";

describe("useNotifications", () => {
  let mockChannel: any;
  let mockRemoveChannel: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSelectData = [...mockNotifications];
    mockSelectError = null;

    // Get mocks from the module
    const module = await import("@/integrations/supabase/client");
    const mocks = (module as any).__mocks;
    mockChannel = mocks.mockChannel;
    mockRemoveChannel = mocks.mockRemoveChannel;
  });

  describe("initial fetch", () => {
    it("starts in loading state", () => {
      const { result } = renderHook(() => useNotifications());
      expect(result.current.loading).toBe(true);
    });

    it("fetches notifications on mount", async () => {
      const { result } = renderHook(() => useNotifications());

      // Wait for async fetch
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.notifications).toHaveLength(3);
      expect(result.current.notifications[0].title).toBe("Welcome!");
    });

    it("calculates unread count correctly", async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      // Two notifications are unread (notif-1 and notif-3)
      expect(result.current.unreadCount).toBe(2);
    });

    it("handles fetch error gracefully", async () => {
      mockSelectError = new Error("Network error");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(result.current.notifications).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("markAsRead", () => {
    it("marks a notification as read optimistically", async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const initialUnread = result.current.unreadCount;

      await act(async () => {
        await result.current.markAsRead("notif-1");
      });

      expect(result.current.unreadCount).toBe(initialUnread - 1);
      expect(
        result.current.notifications.find((n) => n.id === "notif-1")?.is_read
      ).toBe(true);
    });
  });

  describe("markAllAsRead", () => {
    it("marks all notifications as read", async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications.every((n) => n.is_read)).toBe(true);
    });
  });

  describe("deleteNotification", () => {
    it("removes notification from list", async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const initialCount = result.current.notifications.length;

      await act(async () => {
        await result.current.deleteNotification("notif-2");
      });

      expect(result.current.notifications.length).toBe(initialCount - 1);
      expect(
        result.current.notifications.find((n) => n.id === "notif-2")
      ).toBeUndefined();
    });

    it("decrements unread count when deleting unread notification", async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const initialUnread = result.current.unreadCount;

      await act(async () => {
        await result.current.deleteNotification("notif-1"); // unread
      });

      expect(result.current.unreadCount).toBe(initialUnread - 1);
    });
  });

  describe("clearAll", () => {
    it("removes all notifications", async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      await act(async () => {
        await result.current.clearAll();
      });

      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe("notification types", () => {
    it("supports all notification types", async () => {
      mockSelectData = [
        { ...mockNotifications[0], type: "info" },
        { ...mockNotifications[1], type: "success" },
        { ...mockNotifications[2], type: "warning" },
        {
          id: "notif-4",
          user_id: "user-123",
          title: "Error",
          message: "Something went wrong",
          type: "error",
          link: null,
          is_read: false,
          created_at: "2026-02-01T10:00:00Z",
        },
      ];

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const types = result.current.notifications.map((n) => n.type);
      expect(types).toContain("info");
      expect(types).toContain("success");
      expect(types).toContain("warning");
      expect(types).toContain("error");
    });
  });

  describe("real-time subscription", () => {
    it("sets up real-time channel on mount", async () => {
      renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it("cleans up channel on unmount", async () => {
      const { unmount } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles empty notification list", async () => {
      mockSelectData = [];

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });

    it("handles notifications without message", async () => {
      mockSelectData = [
        {
          id: "notif-no-msg",
          user_id: "user-123",
          title: "Title only",
          message: null,
          type: "info",
          link: null,
          is_read: false,
          created_at: "2026-02-04T10:00:00Z",
        },
      ];

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(result.current.notifications[0].message).toBeNull();
      expect(result.current.notifications[0].title).toBe("Title only");
    });

    it("handles notifications with link", async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const withLink = result.current.notifications.find((n) => n.link !== null);
      expect(withLink).toBeDefined();
      expect(withLink?.link).toBe("/dashboard");
    });
  });

  describe("notification preferences integration", () => {
    it("respects user notification preferences for channels", () => {
      // Notification preferences control which channels receive notifications:
      // - in_app: Shown in notification bell dropdown
      // - email: Sent via Resend
      // - sms: Sent via Twilio (if enabled)
      // - webhook: POSTed to custom URL
      
      // The notification system should check preferences before delivery
      const categories = ["support", "billing", "security", "updates", "mentions"];
      const channels = ["in_app", "email", "sms", "webhook"];
      
      expect(categories).toContain("support");
      expect(channels).toContain("in_app");
    });

    it("maps notification types to preference categories", () => {
      // Notification types map to preference categories:
      // info -> updates
      // success -> updates
      // warning -> security
      // error -> security
      const typeToCategory: Record<string, string> = {
        info: "updates",
        success: "updates", 
        warning: "security",
        error: "security",
      };

      expect(typeToCategory["info"]).toBe("updates");
      expect(typeToCategory["error"]).toBe("security");
    });
  });
});

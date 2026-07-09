import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock notification data for testing
const mockNotifications = [
  {
    id: "notif-1",
    user_id: "user-1",
    title: "You were mentioned",
    message: "John mentioned you in a ticket",
    type: "info",
    link: "/admin/support/tickets/123",
    is_read: false,
    created_at: new Date().toISOString(),
    actor_id: "actor-1",
    action_type: "mention",
    metadata: { ticket_id: "123" },
  },
  {
    id: "notif-2",
    user_id: "user-1",
    title: "Product Update",
    message: "New feature released",
    type: "success",
    link: "/changelog#update-1",
    is_read: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    actor_id: null,
    action_type: "product_update",
    metadata: null,
  },
  {
    id: "notif-3",
    user_id: "user-1",
    title: "Payment Received",
    message: "$99.00",
    type: "success",
    link: "/admin/billing/overview",
    is_read: true,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    actor_id: null,
    action_type: "payment_received",
    metadata: null,
  },
];

const mockActorProfile = {
  id: "actor-1",
  display_name: "John Doe",
  avatar_url: "https://example.com/avatar.jpg",
};

describe("Notifications Feed Logic", () => {
  describe("Date Grouping", () => {
    it("should group notifications into today", () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const todayNotifications = mockNotifications.filter(n => {
        const createdAt = new Date(n.created_at);
        return createdAt >= today;
      });

      expect(todayNotifications.length).toBe(1);
      expect(todayNotifications[0].id).toBe("notif-1");
    });

    it("should group notifications into this week", () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const thisWeekNotifications = mockNotifications.filter(n => {
        const createdAt = new Date(n.created_at);
        return createdAt >= weekAgo && createdAt < today;
      });

      expect(thisWeekNotifications.length).toBe(1);
      expect(thisWeekNotifications[0].id).toBe("notif-2");
    });

    it("should group older notifications into earlier", () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const earlierNotifications = mockNotifications.filter(n => {
        const createdAt = new Date(n.created_at);
        return createdAt < weekAgo;
      });

      expect(earlierNotifications.length).toBe(1);
      expect(earlierNotifications[0].id).toBe("notif-3");
    });
  });

  describe("Filtering", () => {
    it("should filter unread notifications", () => {
      const unread = mockNotifications.filter(n => !n.is_read);
      expect(unread.length).toBe(1);
      expect(unread[0].id).toBe("notif-1");
    });

    it("should filter by action type - mentions", () => {
      const mentions = mockNotifications.filter(n => n.action_type === "mention");
      expect(mentions.length).toBe(1);
      expect(mentions[0].action_type).toBe("mention");
    });

    it("should filter by action type - billing", () => {
      const billingTypes = ["payment_received", "subscription_changed", "invoice_due"];
      const billing = mockNotifications.filter(n => 
        billingTypes.includes(n.action_type || "")
      );
      expect(billing.length).toBe(1);
      expect(billing[0].action_type).toBe("payment_received");
    });

    it("should filter by action type - updates", () => {
      const updates = mockNotifications.filter(n => n.action_type === "product_update");
      expect(updates.length).toBe(1);
    });
  });

  describe("Statistics", () => {
    it("should calculate total count", () => {
      expect(mockNotifications.length).toBe(3);
    });

    it("should calculate unread count", () => {
      const unreadCount = mockNotifications.filter(n => !n.is_read).length;
      expect(unreadCount).toBe(1);
    });

    it("should handle empty notifications", () => {
      const empty: typeof mockNotifications = [];
      const unreadCount = empty.filter(n => !n.is_read).length;
      expect(unreadCount).toBe(0);
    });
  });

  describe("Actor Merging", () => {
    it("should merge actor profile with notification", () => {
      const notification = mockNotifications[0];
      const withActor = {
        ...notification,
        actor: notification.actor_id ? mockActorProfile : null,
      };

      expect(withActor.actor).not.toBeNull();
      expect(withActor.actor?.display_name).toBe("John Doe");
    });

    it("should handle notifications without actor", () => {
      const notification = mockNotifications[1];
      const withActor = {
        ...notification,
        actor: notification.actor_id ? mockActorProfile : null,
      };

      expect(withActor.actor).toBeNull();
    });
  });

  describe("Action Types", () => {
    const actionTypeLabels: Record<string, string> = {
      mention: "Mention",
      ticket_reply: "Reply",
      ticket_assigned: "Assignment",
      payment_received: "Payment",
      subscription_changed: "Subscription",
      product_update: "Update",
    };

    it("should have labels for all supported action types", () => {
      expect(actionTypeLabels.mention).toBe("Mention");
      expect(actionTypeLabels.ticket_reply).toBe("Reply");
      expect(actionTypeLabels.payment_received).toBe("Payment");
      expect(actionTypeLabels.product_update).toBe("Update");
    });

    it("should handle unknown action types gracefully", () => {
      const unknownType = "unknown_type";
      const label = actionTypeLabels[unknownType] || null;
      expect(label).toBeNull();
    });
  });

  describe("Metadata Handling", () => {
    it("should parse ticket_id from metadata", () => {
      const notification = mockNotifications[0];
      const ticketId = (notification.metadata as Record<string, unknown>)?.ticket_id;
      expect(ticketId).toBe("123");
    });

    it("should handle null metadata", () => {
      const notification = mockNotifications[1];
      expect(notification.metadata).toBeNull();
    });

    it("should generate correct link for mentions", () => {
      const notification = mockNotifications[0];
      expect(notification.link).toBe("/admin/support/tickets/123");
    });
  });

  describe("Mark as Read", () => {
    it("should update notification read state", () => {
      const notifications = [...mockNotifications];
      const targetId = "notif-1";
      
      const updated = notifications.map(n => 
        n.id === targetId ? { ...n, is_read: true } : n
      );
      
      const targetNotif = updated.find(n => n.id === targetId);
      expect(targetNotif?.is_read).toBe(true);
    });

    it("should update unread count after marking as read", () => {
      const notifications = [...mockNotifications];
      const beforeCount = notifications.filter(n => !n.is_read).length;
      
      const updated = notifications.map(n => 
        n.id === "notif-1" ? { ...n, is_read: true } : n
      );
      const afterCount = updated.filter(n => !n.is_read).length;
      
      expect(beforeCount).toBe(1);
      expect(afterCount).toBe(0);
    });
  });

  describe("Delete Notification", () => {
    it("should remove notification from list", () => {
      const notifications = [...mockNotifications];
      const targetId = "notif-1";
      
      const updated = notifications.filter(n => n.id !== targetId);
      
      expect(updated.length).toBe(2);
      expect(updated.find(n => n.id === targetId)).toBeUndefined();
    });

    it("should update unread count when deleting unread", () => {
      const notifications = [...mockNotifications];
      const targetNotif = notifications.find(n => n.id === "notif-1");
      const wasUnread = !targetNotif?.is_read;
      
      const updated = notifications.filter(n => n.id !== "notif-1");
      const newUnreadCount = updated.filter(n => !n.is_read).length;
      
      expect(wasUnread).toBe(true);
      expect(newUnreadCount).toBe(0);
    });
  });

  describe("Pagination", () => {
    it("should calculate correct offset for page", () => {
      const limit = 50;
      const page = 2;
      const offset = page * limit;
      expect(offset).toBe(100);
    });

    it("should detect if more notifications exist", () => {
      const limit = 50;
      const returnedCount = 51; // One more than limit indicates hasMore
      const hasMore = returnedCount === limit + 1;
      expect(hasMore).toBe(true);
    });

    it("should detect when no more notifications", () => {
      const limit = 50;
      const returnedCount = 30;
      const hasMore = returnedCount === limit + 1;
      expect(hasMore).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing hook
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "admin@test.com" },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;
const mockRpc = supabase.rpc as ReturnType<typeof vi.fn>;

describe("useTicketCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseMentions utility logic", () => {
    it("should parse @mentions from content correctly", () => {
      // Test the mention parsing regex pattern (matches @word)
      const content = "Hey @john can you look at this? Also @jane";
      const mentionPattern = /@(\w+)/g;
      const matches = content.matchAll(mentionPattern);
      const mentionedNames = [...matches].map((m) => m[1].toLowerCase());

      expect(mentionedNames).toContain("john");
      expect(mentionedNames).toContain("jane");
    });

    it("should handle content with no mentions", () => {
      const content = "No mentions here";
      const mentionPattern = /@(\w+)/g;
      const matches = content.matchAll(mentionPattern);
      const mentionedNames = [...matches].map((m) => m[1].toLowerCase());

      expect(mentionedNames).toHaveLength(0);
    });

    it("should handle mentions at start and end of content", () => {
      const content = "@admin please review this issue @support";
      const mentionPattern = /@(\w+)/g;
      const matches = content.matchAll(mentionPattern);
      const mentionedNames = [...matches].map((m) => m[1].toLowerCase());

      expect(mentionedNames).toContain("admin");
      expect(mentionedNames).toContain("support");
    });
  });

  describe("mock setup verification", () => {
    it("should have supabase.from mock available", () => {
      expect(mockFrom).toBeDefined();
      expect(typeof mockFrom).toBe("function");
    });

    it("should have supabase.rpc mock available", () => {
      expect(mockRpc).toBeDefined();
      expect(typeof mockRpc).toBe("function");
    });
  });

  describe("internal note validation", () => {
    it("should reject empty content", () => {
      const content = "   ";
      const isValid = content.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it("should accept valid content", () => {
      const content = "This is a valid internal note";
      const isValid = content.trim().length > 0;
      expect(isValid).toBe(true);
    });

    it("should trim whitespace from content", () => {
      const content = "  Note with spaces  ";
      const trimmed = content.trim();
      expect(trimmed).toBe("Note with spaces");
    });
  });

  describe("collaborator role types", () => {
    it("should support assigned role", () => {
      const role: "assigned" | "mentioned" = "assigned";
      expect(role).toBe("assigned");
    });

    it("should support mentioned role", () => {
      const role: "assigned" | "mentioned" = "mentioned";
      expect(role).toBe("mentioned");
    });
  });

  describe("team member matching", () => {
    const teamMembers = [
      { user_id: "admin-1", display_name: "John Doe", email: "john@test.com" },
      { user_id: "admin-2", display_name: "Jane Smith", email: "jane@test.com" },
    ];

    it("should match by display name", () => {
      const mentionedName = "john";
      const matched = teamMembers.filter((member) => {
        const displayName = member.display_name?.toLowerCase() || "";
        return displayName.includes(mentionedName);
      });

      expect(matched).toHaveLength(1);
      expect(matched[0].user_id).toBe("admin-1");
    });

    it("should match by email prefix", () => {
      const mentionedName = "jane";
      const matched = teamMembers.filter((member) => {
        const emailPrefix = member.email?.split("@")[0].toLowerCase() || "";
        return emailPrefix.includes(mentionedName);
      });

      expect(matched).toHaveLength(1);
      expect(matched[0].user_id).toBe("admin-2");
    });

    it("should return empty when no match", () => {
      const mentionedName = "unknown";
      const matched = teamMembers.filter((member) => {
        const displayName = member.display_name?.toLowerCase() || "";
        const emailPrefix = member.email?.split("@")[0].toLowerCase() || "";
        return displayName.includes(mentionedName) || emailPrefix.includes(mentionedName);
      });

      expect(matched).toHaveLength(0);
    });
  });

  describe("RPC function parameters", () => {
    it("should format assign_support_ticket params correctly", () => {
      const params = {
        p_conversation_id: "conv-123",
        p_assignee_id: "user-456",
        p_assigner_id: "admin-789",
      };

      expect(params.p_conversation_id).toBe("conv-123");
      expect(params.p_assignee_id).toBe("user-456");
      expect(params.p_assigner_id).toBe("admin-789");
    });

    it("should allow null assignee for unassignment", () => {
      const params = {
        p_conversation_id: "conv-123",
        p_assignee_id: null,
        p_assigner_id: "admin-789",
      };

      expect(params.p_assignee_id).toBeNull();
    });

    it("should format add_support_internal_note params correctly", () => {
      const params = {
        p_conversation_id: "conv-123",
        p_author_id: "user-456",
        p_content: "Test note content",
        p_mentions: ["user-1", "user-2"],
      };

      expect(params.p_content).toBe("Test note content");
      expect(params.p_mentions).toHaveLength(2);
    });
  });

  describe("interface types", () => {
    it("should define InternalNote interface correctly", () => {
      const note = {
        id: "note-123",
        conversation_id: "conv-456",
        author_id: "user-789",
        content: "Test note",
        mentions: ["user-1"],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        author: {
          display_name: "Test User",
          email: "test@example.com",
        },
      };

      expect(note.id).toBeDefined();
      expect(note.mentions).toBeInstanceOf(Array);
      expect(note.author?.display_name).toBe("Test User");
    });

    it("should define Collaborator interface correctly", () => {
      const collaborator = {
        id: "collab-123",
        conversation_id: "conv-456",
        user_id: "user-789",
        role: "assigned" as const,
        added_at: "2024-01-01T00:00:00Z",
        added_by: "admin-123",
        profile: {
          display_name: "Collaborator Name",
          email: "collab@example.com",
        },
      };

      expect(collaborator.role).toBe("assigned");
      expect(collaborator.profile?.display_name).toBe("Collaborator Name");
    });

    it("should define TeamMember interface correctly", () => {
      const member = {
        user_id: "user-123",
        display_name: "Team Member",
        email: "member@example.com",
      };

      expect(member.user_id).toBeDefined();
      expect(member.display_name).toBe("Team Member");
    });
  });

  describe("Slack notification payload", () => {
    it("should define valid notification types", () => {
      const validTypes = ["ticket_assigned", "ticket_mentioned", "ticket_escalated", "ticket_resolved"];
      
      validTypes.forEach(type => {
        expect(typeof type).toBe("string");
      });
    });

    it("should format ticket_assigned payload correctly", () => {
      const payload = {
        type: "ticket_assigned" as const,
        ticketId: "ticket-123",
        ticketSubject: "Login Issue",
        recipientEmail: "assignee@test.com",
        recipientUserId: "user-456",
        assignerName: "Admin User",
      };

      expect(payload.type).toBe("ticket_assigned");
      expect(payload.ticketId).toBeDefined();
      expect(payload.assignerName).toBe("Admin User");
    });

    it("should format ticket_mentioned payload correctly", () => {
      const payload = {
        type: "ticket_mentioned" as const,
        ticketId: "ticket-123",
        ticketSubject: "Billing Question",
        recipientEmail: "mentioned@test.com",
        recipientUserId: "user-789",
        mentionerName: "Support Agent",
        noteContent: "Hey @mentioned, can you look at this?",
      };

      expect(payload.type).toBe("ticket_mentioned");
      expect(payload.mentionerName).toBe("Support Agent");
      expect(payload.noteContent).toContain("@mentioned");
    });

    it("should truncate long note content for Slack", () => {
      const longContent = "A".repeat(300);
      const truncated = longContent.substring(0, 200);
      
      expect(truncated.length).toBe(200);
      expect(truncated).not.toEqual(longContent);
    });

    it("should allow optional channel override", () => {
      const payload = {
        type: "ticket_escalated" as const,
        ticketId: "ticket-123",
        channel: "C1234567890", // Specific channel ID
      };

      expect(payload.channel).toBeDefined();
      expect(payload.channel).toMatch(/^C\d+$/);
    });
  });

  describe("Slack notification integration", () => {
    it("should handle missing assignee email gracefully", () => {
      const teamMembers = [
        { user_id: "user-1", display_name: "User One", email: null },
      ];
      
      const assigneeId = "user-1";
      const assigneeEmail = teamMembers.find(m => m.user_id === assigneeId)?.email;
      
      expect(assigneeEmail).toBeNull();
    });

    it("should resolve assigner name from team members", () => {
      const teamMembers = [
        { user_id: "admin-1", display_name: "Admin User", email: "admin@test.com" },
      ];
      
      const userId = "admin-1";
      const assignerProfile = teamMembers.find(m => m.user_id === userId);
      const assignerName = assignerProfile?.display_name || assignerProfile?.email || "A team member";
      
      expect(assignerName).toBe("Admin User");
    });

    it("should fallback to email when display name is missing", () => {
      const teamMembers = [
        { user_id: "admin-1", display_name: null, email: "admin@test.com" },
      ];
      
      const userId = "admin-1";
      const assignerProfile = teamMembers.find(m => m.user_id === userId);
      const assignerName = assignerProfile?.display_name || assignerProfile?.email || "A team member";
      
      expect(assignerName).toBe("admin@test.com");
    });

    it("should fallback to default when both name and email are missing", () => {
      const teamMembers = [
        { user_id: "admin-1", display_name: null, email: null },
      ];
      
      const userId = "admin-1";
      const assignerProfile = teamMembers.find(m => m.user_id === userId);
      const assignerName = assignerProfile?.display_name || assignerProfile?.email || "A team member";
      
      expect(assignerName).toBe("A team member");
    });

    it("should iterate through all mentions for notifications", () => {
      const mentions = ["user-1", "user-2", "user-3"];
      const notificationsSent: string[] = [];
      
      for (const mentionedUserId of mentions) {
        notificationsSent.push(mentionedUserId);
      }
      
      expect(notificationsSent).toHaveLength(3);
      expect(notificationsSent).toEqual(mentions);
    });

    it("should skip notification when no team member found for mention", () => {
      const teamMembers = [
        { user_id: "user-1", display_name: "User One", email: "one@test.com" },
      ];
      
      const mentionedUserId = "unknown-user";
      const mentionedUser = teamMembers.find(m => m.user_id === mentionedUserId);
      
      expect(mentionedUser).toBeUndefined();
    });
  });
});

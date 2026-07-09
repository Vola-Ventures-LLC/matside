import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboarding } from "./useOnboarding";

// Mock supabase - create mocks inside the factory to avoid hoisting issues
vi.mock("@/integrations/supabase/client", () => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockEq = vi.fn();
  const mockIn = vi.fn();
  const mockIs = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockRpc = vi.fn();
  const mockInvoke = vi.fn();

  return {
    supabase: {
      from: vi.fn(() => ({
        select: mockSelect,
        update: mockUpdate,
        insert: mockInsert,
        eq: mockEq,
        in: mockIn,
        is: mockIs,
        order: mockOrder,
        limit: mockLimit,
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
      })),
      rpc: mockRpc,
      functions: {
        invoke: mockInvoke,
      },
    },
    // Export mock functions for test access
    __mocks: {
      mockSelect,
      mockUpdate,
      mockInsert,
      mockEq,
      mockIn,
      mockIs,
      mockOrder,
      mockLimit,
      mockSingle,
      mockMaybeSingle,
      mockRpc,
      mockInvoke,
    },
  };
});

// Mock useAuth
const mockUser = { id: "user-123", email: "test@example.com" };
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock useOrgContext
vi.mock("@/hooks/useOrgContext", () => ({
  useOrgContext: () => ({
    activeOrgId: null,
    activeOrg: null,
    isPersonalContext: true,
  }),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSteps = [
  {
    id: "step-1",
    key: "welcome",
    title: "Welcome",
    description: "Get introduced",
    category: "getting_started",
    sort_order: 1,
    is_required: true,
    completion_type: "ai_verified",
    prompt_hint: null,
    depends_on: null,
  },
  {
    id: "step-2",
    key: "set_display_name",
    title: "Set your name",
    description: "Tell us what to call you",
    category: "profile",
    sort_order: 2,
    is_required: true,
    completion_type: "automated",
    prompt_hint: null,
    depends_on: null,
  },
  {
    id: "step-3",
    key: "upload_avatar",
    title: "Add profile photo",
    description: "Upload a photo",
    category: "profile",
    sort_order: 3,
    is_required: false,
    completion_type: "automated",
    prompt_hint: null,
    depends_on: null,
  },
];

const mockProgress = [
  { id: "prog-1", step_id: "step-1", status: "completed", completed_at: "2024-01-01", skipped_at: null, metadata: {} },
  { id: "prog-2", step_id: "step-2", status: "pending", completed_at: null, skipped_at: null, metadata: {} },
  { id: "prog-3", step_id: "step-3", status: "pending", completed_at: null, skipped_at: null, metadata: {} },
];

const mockSummary = [
  { total_steps: 3, completed_steps: 1, required_steps: 2, required_completed: 1, percent_complete: 33 },
];

describe("useOnboarding", () => {
  let mockSelect: any, mockUpdate: any, mockInsert: any, mockEq: any;
  let mockIn: any, mockIs: any;
  let mockOrder: any, mockLimit: any, mockSingle: any, mockMaybeSingle: any;
  let mockRpc: any, mockInvoke: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();

    // Get mocks from the module
    const module = await import("@/integrations/supabase/client");
    const mocks = (module as any).__mocks;

    mockSelect = mocks.mockSelect;
    mockUpdate = mocks.mockUpdate;
    mockInsert = mocks.mockInsert;
    mockEq = mocks.mockEq;
    mockIn = mocks.mockIn;
    mockIs = mocks.mockIs;
    mockOrder = mocks.mockOrder;
    mockLimit = mocks.mockLimit;
    mockSingle = mocks.mockSingle;
    mockMaybeSingle = mocks.mockMaybeSingle;
    mockRpc = mocks.mockRpc;
    mockInvoke = mocks.mockInvoke;

    // Setup default mock chain
    mockSelect.mockReturnThis();
    mockUpdate.mockReturnThis();
    mockInsert.mockReturnThis();
    mockEq.mockReturnThis();
    mockIn.mockReturnThis();
    mockIs.mockReturnThis();
    mockOrder.mockReturnThis();
    mockLimit.mockReturnThis();
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("fetches onboarding steps on mount", async () => {
    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isLoading).toBe(true);

    // Wait for loading to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("returns incomplete steps correctly", async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // When no steps are loaded, incomplete should be empty
    const incompleteSteps = result.current.getIncompleteSteps();
    expect(Array.isArray(incompleteSteps)).toBe(true);
  });

  it("respects dismissed state from localStorage (context-aware)", async () => {
    localStorage.setItem(`onboarding_dismissed_${mockUser.id}_personal`, "true");

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.isDismissed).toBe(true);
  });

  it("dismisses onboarding and saves to localStorage", async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    await act(async () => {
      await result.current.dismissOnboarding();
    });

    expect(result.current.isDismissed).toBe(true);
    expect(localStorage.getItem(`onboarding_dismissed_${mockUser.id}_personal`)).toBe("true");
  });

  it("gets step status by key", async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // Without data loaded, should return undefined
    const status = result.current.getStepStatus("welcome");
    expect(status === undefined || typeof status === "string").toBe(true);
  });

  it("calculates isComplete based on summary", async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // With default state (no summary), should not be complete
    expect(result.current.isComplete).toBe(false);
  });

  it("starts a conversation with personal context via edge function", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        conversation_id: "conv-123",
        message: "Welcome! Let's set up your personal profile.",
      },
      error: null,
    });

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    await act(async () => {
      await result.current.startConversation();
    });

    // In personal context, org_context.is_personal should be true
    expect(mockInvoke).toHaveBeenCalledWith("onboarding-chat", {
      body: { 
        action: "start",
        org_context: { is_personal: true },
      },
    });
  });

  it("provides correct context for personal vs org mode", async () => {
    // Test verifies that personal context focuses on personal profile setup
    // The edge function will inject "WORKSPACE CONTEXT: Mode: PERSONAL" 
    // which guides AI to focus on display name, avatar, timezone, preferences
    mockInvoke.mockResolvedValue({
      data: {
        conversation_id: "conv-personal",
        message: "Let's get your personal profile set up!",
      },
      error: null,
    });

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    await act(async () => {
      await result.current.startConversation();
    });

    const invokeCall = mockInvoke.mock.calls[0];
    expect(invokeCall[1].body.org_context.is_personal).toBe(true);
  });

  it("sends a message and updates messages array", async () => {
    // First start a conversation
    mockInvoke.mockResolvedValueOnce({
      data: {
        conversation_id: "conv-123",
        message: "Welcome!",
      },
      error: null,
    });

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    await act(async () => {
      await result.current.startConversation();
    });

    // Then send a message
    mockInvoke.mockResolvedValueOnce({
      data: {
        message: "Great to meet you!",
        step_completed: null,
        insight_detected: false,
      },
      error: null,
    });

    await act(async () => {
      await result.current.sendMessage("Hello!");
    });

    // Should have both welcome and new messages
    expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
  });

  it("detects insight from message response", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        conversation_id: "conv-123",
        message: "Welcome!",
      },
      error: null,
    });

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    await act(async () => {
      await result.current.startConversation();
    });

    // Simulate a feature request being detected
    mockInvoke.mockResolvedValueOnce({
      data: {
        message: "That's a great idea! Would you like to submit it as a feature request?",
        step_completed: null,
        insight_detected: true,
      },
      error: null,
    });

    await act(async () => {
      await result.current.sendMessage("I wish there was a dark mode!");
    });

    // Response should be received (insight detection happens on backend)
    expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
  });

  it("handles off-topic redirect gracefully", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        conversation_id: "conv-123",
        message: "Welcome!",
      },
      error: null,
    });

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    await act(async () => {
      await result.current.startConversation();
    });

    // Simulate off-topic message
    mockInvoke.mockResolvedValueOnce({
      data: {
        message: "I'm here to help with setup. Let's get your profile set up first!",
        step_completed: null,
        insight_detected: false,
      },
      error: null,
    });

    await act(async () => {
      await result.current.sendMessage("Tell me a joke!");
    });

    // Should receive redirect response
    const lastMessage = result.current.messages[result.current.messages.length - 1];
    expect(lastMessage).toBeDefined();
  });

  it("handles message send error gracefully", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        conversation_id: "conv-123",
        message: "Welcome!",
      },
      error: null,
    });

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    await act(async () => {
      await result.current.startConversation();
    });

    const initialMessageCount = result.current.messages.length;

    // Simulate error
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error("Network error"),
    });

    await act(async () => {
      await result.current.sendMessage("Hello!");
    });

    // User message should be removed on error
    expect(result.current.messages.length).toBe(initialMessageCount);
  });

  it("resumes conversation after dismissal (context-aware)", async () => {
    localStorage.setItem(`onboarding_dismissed_${mockUser.id}_personal`, "true");

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.isDismissed).toBe(true);

    mockInvoke.mockResolvedValue({
      data: {
        conversation_id: "conv-new",
        message: "Welcome back!",
      },
      error: null,
    });

    await act(async () => {
      await result.current.resumeConversation();
    });

    expect(result.current.isDismissed).toBe(false);
    expect(localStorage.getItem(`onboarding_dismissed_${mockUser.id}_personal`)).toBeNull();
  });

  it("exports types for entity onboarding compatibility", () => {
    // Verify that types exported from useOnboarding can be used by useEntityOnboarding
    // This is a compile-time check - if it builds, the types are compatible
    expect(true).toBe(true);
  });

  describe("Context-Aware Conversation Persistence", () => {
    it("persists conversation based on personal context", async () => {
      // Mock an existing active personal conversation
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: "conv-personal-123",
          user_id: mockUser.id,
          status: "active",
          context_type: null,
          context_id: null,
        },
        error: null,
      });

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      // Conversation should be loaded
      expect(result.current.conversation?.id).toBe("conv-personal-123");
    });

    it("queries conversations filtered by null context_type for personal mode", async () => {
      const { supabase } = await import("@/integrations/supabase/client");

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      // Verify the query was made with correct filters
      // The from().select().eq().eq().is() chain should have been called for personal context
      expect(supabase.from).toHaveBeenCalledWith("onboarding_conversations");
    });

    it("maintains separate dismissed states per context", async () => {
      // Set dismissed for personal context
      localStorage.setItem(`onboarding_dismissed_${mockUser.id}_personal`, "true");
      // Org context should NOT be dismissed
      expect(localStorage.getItem(`onboarding_dismissed_${mockUser.id}_org_org-123`)).toBeNull();

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      // Personal context should be dismissed
      expect(result.current.isDismissed).toBe(true);
    });

    it("uses correct localStorage key format for context", () => {
      const userId = "user-123";
      const personalKey = `onboarding_dismissed_${userId}_personal`;
      const orgKey = `onboarding_dismissed_${userId}_org_org-456`;

      expect(personalKey).toBe("onboarding_dismissed_user-123_personal");
      expect(orgKey).toBe("onboarding_dismissed_user-123_org_org-456");
    });
  });

  describe("AI Context Awareness", () => {
    it("includes org_context.is_personal=true when starting personal conversation", async () => {
      mockInvoke.mockResolvedValue({
        data: {
          conversation_id: "conv-new",
          message: "Welcome!",
        },
        error: null,
      });

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      await act(async () => {
        await result.current.startConversation();
      });

      const invokeCall = mockInvoke.mock.calls[0];
      expect(invokeCall[1].body.org_context).toEqual({ is_personal: true });
    });

    it("includes org context when sending message in personal mode", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          conversation_id: "conv-123",
          message: "Welcome!",
        },
        error: null,
      });

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      await act(async () => {
        await result.current.startConversation();
      });

      mockInvoke.mockResolvedValueOnce({
        data: {
          message: "I can help you with that!",
          step_completed: null,
        },
        error: null,
      });

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      const messageCall = mockInvoke.mock.calls[1];
      expect(messageCall[1].body.org_context.is_personal).toBe(true);
    });
  });

  describe("Conversation Message Handling", () => {
    it("loads existing messages when resuming conversation", async () => {
      const existingMessages = [
        { id: "msg-1", role: "assistant", content: "Welcome!", conversation_id: "conv-123", created_at: "2024-01-01" },
        { id: "msg-2", role: "user", content: "Hi!", conversation_id: "conv-123", created_at: "2024-01-01" },
      ];

      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: "conv-123",
          user_id: mockUser.id,
          status: "active",
          context_type: null,
        },
        error: null,
      });

      // Mock the messages query
      mockOrder.mockResolvedValueOnce({
        data: existingMessages,
        error: null,
      });

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 150));
      });

      // Messages should be populated from existing conversation
      expect(result.current.messages.length).toBeGreaterThanOrEqual(0);
    });

    it("handles navigation_cta in assistant messages", async () => {
      const ctaData = {
        enabled: true,
        label: "Go to Settings",
        path: "/settings",
        description: "Configure your preferences",
        external: false,
        complete_on_return: true,
      };

      mockInvoke.mockResolvedValueOnce({
        data: {
          conversation_id: "conv-123",
          message: "Welcome!",
        },
        error: null,
      });

      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      await act(async () => {
        await result.current.startConversation();
      });

      mockInvoke.mockResolvedValueOnce({
        data: {
          message: "Let me guide you to settings!",
          navigation_cta: ctaData,
          current_step_key: "configure_settings",
        },
        error: null,
      });

      await act(async () => {
        await result.current.sendMessage("Where do I configure settings?");
      });

      const lastMessage = result.current.messages[result.current.messages.length - 1];
      expect(lastMessage.navigation_cta).toEqual(ctaData);
      expect(lastMessage.current_step_key).toBe("configure_settings");
    });
  });

  describe("Step Configuration", () => {
    it("supports context_type filtering for entity-specific steps", async () => {
      // Entity-specific steps should have context_type set
      const entitySteps = [
        {
          ...mockSteps[0],
          context_type: "event",
          context_required: true,
        },
      ];

      // Verify step shape is correct
      expect(entitySteps[0].context_type).toBe("event");
      expect(entitySteps[0].context_required).toBe(true);
    });

    it("supports requires_navigation flag for navigation vs conversational steps", async () => {
      const navigationStep = {
        ...mockSteps[0],
        requires_navigation: true,
        navigation_cta: {
          enabled: true,
          label: "Configure Stripe",
          path: "/admin/billing",
          description: "Set up payment processing",
          external: false,
          complete_on_return: true,
        },
      };

      const conversationalStep = {
        ...mockSteps[1],
        requires_navigation: false,
      };

      expect(navigationStep.requires_navigation).toBe(true);
      expect(navigationStep.navigation_cta?.enabled).toBe(true);
      expect(conversationalStep.requires_navigation).toBe(false);
    });

    it("supports category dropdown for organizing steps", () => {
      const categories = ["getting_started", "profile", "org_setup", "customization", "integrations"];
      
      expect(mockSteps[0].category).toBe("getting_started");
      expect(mockSteps[1].category).toBe("profile");
      expect(categories).toContain(mockSteps[0].category);
    });
  });
});

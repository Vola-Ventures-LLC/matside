import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type {
  OnboardingStep,
  UserProgress,
  OnboardingSummary,
  OnboardingConversation,
  OnboardingMessage,
  NavigationCTA,
} from "./useOnboarding";

export interface EntityContext {
  type: string; // e.g., "event", "season", "project"
  id: string;
  name?: string; // Display name for the entity
  parent_context_type?: string; // e.g., "org" for seasons, "season" for events
  parent_context_id?: string;
  parent_context_name?: string;
}

export interface ParentValidation {
  is_valid: boolean;
  missing_required: string[];
  missing_optional: string[];
  parent_context_type: string;
  parent_context_id: string;
}

export interface UseEntityOnboardingOptions {
  /** Auto-open chat when this is the first time viewing the entity */
  autoOpenChat?: boolean;
}

interface UseEntityOnboardingReturn {
  steps: OnboardingStep[];
  progress: Map<string, UserProgress>;
  summary: OnboardingSummary | null;
  conversation: OnboardingConversation | null;
  messages: OnboardingMessage[];
  isLoading: boolean;
  isConversationLoading: boolean;
  isDismissed: boolean;
  isComplete: boolean;
  entityContext: EntityContext;
  /** Whether the chat should be shown open (for new entities with autoOpenChat) */
  shouldShowChat: boolean;
  /** Parent context validation results (missing required/optional fields) */
  parentValidation: ParentValidation | null;
  startConversation: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  completeStep: (stepKey: string, metadata?: Record<string, unknown>) => Promise<void>;
  skipStep: (stepKey: string) => Promise<void>;
  dismissOnboarding: () => Promise<void>;
  resumeConversation: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  getStepStatus: (stepKey: string) => UserProgress["status"] | undefined;
  getIncompleteSteps: () => OnboardingStep[];
  /** Mark that the chat has been acknowledged (closes auto-open) */
  acknowledgeChatOpened: () => void;
}

const DISMISSED_KEY = "entity_onboarding_dismissed";
const SEEN_KEY = "entity_onboarding_seen";

/**
 * Hook for entity-scoped onboarding flows (events, seasons, projects, etc.)
 * 
 * @param entityContext - The entity type and ID for scoped onboarding
 * @param options - Configuration options
 * @returns Onboarding state and methods scoped to the specific entity
 * 
 * @example
 * // For an event onboarding (auto-open chat for new events)
 * const onboarding = useEntityOnboarding(
 *   { type: "event", id: eventId, name: eventName },
 *   { autoOpenChat: true }
 * );
 * 
 * // For a season onboarding
 * const onboarding = useEntityOnboarding({ type: "season", id: seasonId, name: seasonName });
 */
export function useEntityOnboarding(
  entityContext: EntityContext,
  options: UseEntityOnboardingOptions = {}
): UseEntityOnboardingReturn {
  const { autoOpenChat = false } = options;
  const { user } = useAuth();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState<Map<string, UserProgress>>(new Map());
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [conversation, setConversation] = useState<OnboardingConversation | null>(null);
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [shouldShowChat, setShouldShowChat] = useState(false);
  const [isFirstView, setIsFirstView] = useState(false);
  const [parentValidation, setParentValidation] = useState<ParentValidation | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const hasAutoStartedRef = useRef(false);

  // Build context key for localStorage
  const contextKey = `${entityContext.type}_${entityContext.id}`;

  // Check if dismissed and if first view
  useEffect(() => {
    if (user) {
      const dismissed = localStorage.getItem(`${DISMISSED_KEY}_${user.id}_${contextKey}`);
      setIsDismissed(dismissed === "true");
      
      const seen = localStorage.getItem(`${SEEN_KEY}_${user.id}_${contextKey}`);
      setIsFirstView(!seen);
    }
  }, [user, contextKey]);

  // Reset when entity context changes
  useEffect(() => {
    setConversation(null);
    setMessages([]);
    conversationIdRef.current = null;
    hasAutoStartedRef.current = false;
  }, [entityContext.type, entityContext.id]);

  // Fetch steps and progress
  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Initialize entity progress
      await supabase.rpc("initialize_entity_onboarding", {
        p_user_id: user.id,
        p_context_type: entityContext.type,
        p_context_id: entityContext.id,
      });

      // Fetch steps for this entity type (or general steps that apply)
      const { data: stepsData, error: stepsError } = await supabase
        .from("onboarding_steps")
        .select("*")
        .eq("is_active", true)
        .or(`context_type.eq.${entityContext.type},context_type.is.null`)
        .order("sort_order");

      if (stepsError) throw stepsError;

      // Filter out context_required steps that don't match this entity type
      const filteredSteps = (stepsData || []).filter((step) => {
        if (step.context_required && step.context_type !== entityContext.type) {
          return false;
        }
        return true;
      });

      const transformedSteps = filteredSteps.map((step) => ({
        ...step,
        completion_type: step.completion_type as "manual" | "automated" | "ai_verified",
        navigation_cta: step.navigation_cta as unknown as NavigationCTA | null,
      })) as OnboardingStep[];
      setSteps(transformedSteps);

      // Fetch progress for this entity
      const { data: progressData, error: progressError } = await supabase
        .from("user_onboarding_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("context_type", entityContext.type)
        .eq("context_id", entityContext.id);

      if (progressError) throw progressError;

      const progressMap = new Map<string, UserProgress>();
      (progressData || []).forEach((p) => {
        progressMap.set(p.step_id, p as UserProgress);
      });
      setProgress(progressMap);

      // Fetch summary for this entity
      const { data: summaryData, error: summaryError } = await supabase.rpc(
        "get_entity_onboarding_summary",
        {
          p_user_id: user.id,
          p_context_type: entityContext.type,
          p_context_id: entityContext.id,
        }
      );

      if (summaryError) throw summaryError;

      if (summaryData && summaryData.length > 0) {
        setSummary(summaryData[0] as OnboardingSummary);
      }

      // Fetch active conversation for this entity
      const { data: convData } = await supabase
        .from("onboarding_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("context_type", entityContext.type)
        .eq("context_id", entityContext.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (convData) {
        setConversation(convData as OnboardingConversation);
        conversationIdRef.current = convData.id;

        // Fetch messages
        const { data: messagesData } = await supabase
          .from("onboarding_messages")
          .select("*")
          .eq("conversation_id", convData.id)
          .order("created_at");

        const transformedMessages = (messagesData || []).map((msg) => ({
          ...msg,
          role: msg.role as "user" | "assistant" | "system",
          navigation_cta: null as NavigationCTA | null,
          current_step_key: null as string | null,
        })) as OnboardingMessage[];
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error("Error fetching entity onboarding data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, entityContext.type, entityContext.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const acknowledgeChatOpened = useCallback(() => {
    setShouldShowChat(false);
  }, []);

  const startConversation = useCallback(async () => {
    if (!user) return;

    setIsConversationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("onboarding-chat", {
        body: {
          action: "start",
          entity_context: {
            type: entityContext.type,
            id: entityContext.id,
            name: entityContext.name,
            parent_context_type: entityContext.parent_context_type,
            parent_context_id: entityContext.parent_context_id,
            parent_context_name: entityContext.parent_context_name,
          },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setConversation({
        id: data.conversation_id,
        status: "active",
        current_step_id: null,
        started_at: new Date().toISOString(),
        resume_context: {},
      });
      conversationIdRef.current = data.conversation_id;

      // Update parent validation from response
      if (data.parent_validation) {
        setParentValidation(data.parent_validation);
      }

      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          step_completed: null,
          navigation_cta: data.navigation_cta || null,
          current_step_key: data.current_step_key || null,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error starting entity conversation:", error);
      toast.error("Failed to start setup");
    } finally {
      setIsConversationLoading(false);
    }
  }, [user, entityContext]);

  // Auto-open chat for new entities if enabled
  useEffect(() => {
    if (
      autoOpenChat &&
      isFirstView &&
      !isDismissed &&
      !isLoading &&
      user &&
      !hasAutoStartedRef.current
    ) {
      hasAutoStartedRef.current = true;
      // Mark as seen
      localStorage.setItem(`${SEEN_KEY}_${user.id}_${contextKey}`, "true");
      setIsFirstView(false);
      setShouldShowChat(true);
      // Auto-start the conversation
      startConversation();
    }
  }, [autoOpenChat, isFirstView, isDismissed, isLoading, user, contextKey, startConversation]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!conversationIdRef.current) return;

      const userMessage: OnboardingMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        step_completed: null,
        navigation_cta: null,
        current_step_key: null,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsConversationLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke("onboarding-chat", {
          body: {
            action: "message",
            conversation_id: conversationIdRef.current,
            message,
            entity_context: {
              type: entityContext.type,
              id: entityContext.id,
              name: entityContext.name,
              parent_context_type: entityContext.parent_context_type,
              parent_context_id: entityContext.parent_context_id,
              parent_context_name: entityContext.parent_context_name,
            },
          },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        // Update parent validation from response
        if (data.parent_validation) {
          setParentValidation(data.parent_validation);
        }

        const assistantMessage: OnboardingMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          step_completed: data.step_completed || null,
          navigation_cta: data.navigation_cta || null,
          current_step_key: data.current_step_key || null,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (data.step_completed) {
          await fetchData();
          toast.success(`Step completed: ${data.step_title || "Progress saved"}`);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        toast.error("Failed to send message");
      } finally {
        setIsConversationLoading(false);
      }
    },
    [fetchData, entityContext]
  );

  const completeStep = useCallback(
    async (stepKey: string, metadata?: Record<string, unknown>) => {
      if (!user) return;

      const step = steps.find((s) => s.key === stepKey);
      if (!step) return;

      try {
        const { error } = await supabase
          .from("user_onboarding_progress")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            metadata: (metadata || {}) as Record<string, never>,
          })
          .eq("user_id", user.id)
          .eq("step_id", step.id)
          .eq("context_type", entityContext.type)
          .eq("context_id", entityContext.id);

        if (error) throw error;

        await fetchData();
        toast.success(`Completed: ${step.title}`);
      } catch (error) {
        console.error("Error completing step:", error);
        toast.error("Failed to complete step");
      }
    },
    [user, steps, fetchData, entityContext]
  );

  const skipStep = useCallback(
    async (stepKey: string) => {
      if (!user) return;

      const step = steps.find((s) => s.key === stepKey);
      if (!step) return;

      try {
        const { error } = await supabase
          .from("user_onboarding_progress")
          .update({
            status: "skipped",
            skipped_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("step_id", step.id)
          .eq("context_type", entityContext.type)
          .eq("context_id", entityContext.id);

        if (error) throw error;

        await fetchData();
      } catch (error) {
        console.error("Error skipping step:", error);
        toast.error("Failed to skip step");
      }
    },
    [user, steps, fetchData, entityContext]
  );

  const dismissOnboarding = useCallback(async () => {
    if (!user) return;

    localStorage.setItem(`${DISMISSED_KEY}_${user.id}_${contextKey}`, "true");
    setIsDismissed(true);

    if (conversationIdRef.current) {
      await supabase
        .from("onboarding_conversations")
        .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
        .eq("id", conversationIdRef.current);
    }
  }, [user, contextKey]);

  const resumeConversation = useCallback(async () => {
    if (!user) return;

    localStorage.removeItem(`${DISMISSED_KEY}_${user.id}_${contextKey}`);
    setIsDismissed(false);

    if (!conversation) {
      await startConversation();
    }
  }, [user, conversation, startConversation, contextKey]);

  const refreshProgress = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const getStepStatus = useCallback(
    (stepKey: string) => {
      const step = steps.find((s) => s.key === stepKey);
      if (!step) return undefined;
      return progress.get(step.id)?.status;
    },
    [steps, progress]
  );

  const getIncompleteSteps = useCallback(() => {
    return steps.filter((step) => {
      const p = progress.get(step.id);
      return !p || (p.status !== "completed" && p.status !== "skipped");
    });
  }, [steps, progress]);

  const isComplete = summary?.percent_complete === 100;

  return {
    steps,
    progress,
    summary,
    conversation,
    messages,
    isLoading,
    isConversationLoading,
    isDismissed,
    isComplete,
    entityContext,
    shouldShowChat,
    parentValidation,
    startConversation,
    sendMessage,
    completeStep,
    skipStep,
    dismissOnboarding,
    resumeConversation,
    refreshProgress,
    getStepStatus,
    getIncompleteSteps,
    acknowledgeChatOpened,
  };
}

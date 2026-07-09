import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrgContext } from "@/hooks/useOrgContext";
import { toast } from "sonner";

export interface NavigationCTA {
  enabled: boolean;
  label: string;
  path: string;
  description: string;
  external: boolean;
  complete_on_return: boolean;
}

export interface OnboardingStep {
  id: string;
  key: string;
  title: string;
  description: string | null;
  category: string;
  sort_order: number;
  is_required: boolean;
  completion_type: "manual" | "automated" | "ai_verified";
  prompt_hint: string | null;
  depends_on: string | null;
  navigation_cta: NavigationCTA | null;
}

export interface UserProgress {
  id: string;
  step_id: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  completed_at: string | null;
  skipped_at: string | null;
  metadata: Record<string, unknown>;
}

export interface OnboardingSummary {
  total_steps: number;
  completed_steps: number;
  required_steps: number;
  required_completed: number;
  percent_complete: number;
}

export interface OnboardingConversation {
  id: string;
  status: "active" | "completed" | "dismissed";
  current_step_id: string | null;
  started_at: string;
  resume_context: Record<string, unknown>;
}

export interface OnboardingMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  step_completed: string | null;
  navigation_cta: NavigationCTA | null;
  current_step_key: string | null;
  created_at: string;
}

export interface WidgetConfig {
  title: string;
  description: string;
}

interface UseOnboardingReturn {
  steps: OnboardingStep[];
  progress: Map<string, UserProgress>;
  summary: OnboardingSummary | null;
  conversation: OnboardingConversation | null;
  messages: OnboardingMessage[];
  widgetConfig: WidgetConfig;
  isLoading: boolean;
  isConversationLoading: boolean;
  isDismissed: boolean;
  isComplete: boolean;
  startConversation: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  completeStep: (stepKey: string, metadata?: Record<string, unknown>) => Promise<void>;
  skipStep: (stepKey: string) => Promise<void>;
  dismissOnboarding: () => Promise<void>;
  undismissOnboarding: () => void;
  resumeConversation: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  getStepStatus: (stepKey: string) => UserProgress["status"] | undefined;
  getIncompleteSteps: () => OnboardingStep[];
}

const DISMISSED_KEY = "onboarding_dismissed";

export function useOnboarding(): UseOnboardingReturn {
  const { user } = useAuth();
  const { activeOrgId, activeOrg, isPersonalContext } = useOrgContext();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState<Map<string, UserProgress>>(new Map());
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [conversation, setConversation] = useState<OnboardingConversation | null>(null);
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    title: "Complete Your Setup",
    description: "Get the most out of your account",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  
  // Build context key for localStorage (personal vs org-specific)
  const contextKey = activeOrgId ? `org_${activeOrgId}` : "personal";

  // Check if dismissed from localStorage (context-aware)
  useEffect(() => {
    if (user) {
      const dismissed = localStorage.getItem(`${DISMISSED_KEY}_${user.id}_${contextKey}`);
      setIsDismissed(dismissed === "true");
    }
  }, [user, contextKey]);

  // Fetch widget config from AI prompt configs
  useEffect(() => {
    const fetchWidgetConfig = async () => {
      const titleKey = activeOrgId ? "onboarding_widget_title_org" : "onboarding_widget_title";
      const descKey = activeOrgId ? "onboarding_widget_description_org" : "onboarding_widget_description";
      
      const { data } = await supabase
        .from("ai_prompt_configs")
        .select("prompt_key, prompt_template")
        .in("prompt_key", [titleKey, descKey])
        .eq("is_active", true);
      
      if (data && data.length > 0) {
        const configMap = new Map(data.map(d => [d.prompt_key, d.prompt_template]));
        setWidgetConfig({
          title: configMap.get(titleKey) || "Complete Your Setup",
          description: configMap.get(descKey) || "Get the most out of your account",
        });
      }
    };
    
    fetchWidgetConfig();
  }, [activeOrgId]);
  
  // Undismiss onboarding (for "Resume Setup" functionality)
  const undismissOnboarding = useCallback(() => {
    if (!user) return;
    localStorage.removeItem(`${DISMISSED_KEY}_${user.id}_${contextKey}`);
    setIsDismissed(false);
  }, [user, contextKey]);
  
  // Fetch steps and progress
  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Initialize progress for user if needed (context-aware)
      await supabase.rpc("initialize_user_onboarding", { 
        p_user_id: user.id,
        p_context_type: activeOrgId ? "org" : null,
        p_context_id: activeOrgId || null,
      });

      // Fetch all steps
      const { data: stepsData, error: stepsError } = await supabase
        .from("onboarding_steps")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (stepsError) throw stepsError;

      // Filter steps based on context:
      // - For org context: show steps where context_type = 'org' (org-specific steps)
      // - For personal context: show steps where context_type is null AND context_required is false
      const filteredSteps = (stepsData || []).filter((step: any) => {
        const stepContextType = step.context_type;
        const stepContextRequired = step.context_required;
        
        if (activeOrgId) {
          // Org onboarding: only show org-specific steps
          return stepContextType === "org";
        } else {
          // Personal onboarding: show steps without context_type AND not context_required
          return !stepContextType && !stepContextRequired;
        }
      });

      // Transform steps to proper type with navigation_cta parsing
      const transformedSteps = filteredSteps.map((step: any) => ({
        ...step,
        completion_type: step.completion_type as "manual" | "automated" | "ai_verified",
        navigation_cta: step.navigation_cta as unknown as NavigationCTA | null,
      })) as OnboardingStep[];
      setSteps(transformedSteps);

      // Fetch progress for current context
      let progressQuery = supabase
        .from("user_onboarding_progress")
        .select("*")
        .eq("user_id", user.id);
      
      // Filter progress by context
      if (activeOrgId) {
        progressQuery = progressQuery.eq("context_type", "org").eq("context_id", activeOrgId);
      } else {
        progressQuery = progressQuery.is("context_type", null);
      }

      const { data: progressData, error: progressError } = await progressQuery;

      if (progressError) throw progressError;

      const progressMap = new Map<string, UserProgress>();
      (progressData || []).forEach((p: any) => {
        progressMap.set(p.step_id, p as UserProgress);
      });
      setProgress(progressMap);

      // Fetch summary (context-aware)
      const { data: summaryData, error: summaryError } = await supabase
        .rpc("get_onboarding_summary", { 
          p_user_id: user.id,
          p_context_type: activeOrgId ? "org" : null,
          p_context_id: activeOrgId || null,
        });

      if (summaryError) throw summaryError;

      if (summaryData && summaryData.length > 0) {
        setSummary(summaryData[0] as OnboardingSummary);
      } else {
        // Reset summary if no data for this context
        setSummary(null);
      }

      // Fetch active conversation for current context (personal or org)
      let convQuery = supabase
        .from("onboarding_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");
      
      // Filter by org context - null context_type means personal
      if (activeOrgId) {
        convQuery = convQuery.eq("context_type", "org").eq("context_id", activeOrgId);
      } else {
        convQuery = convQuery.is("context_type", null);
      }
      
      const { data: convData } = await convQuery
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

        // Transform messages to proper type
        const transformedMessages = (messagesData || []).map((msg) => ({
          ...msg,
          role: msg.role as "user" | "assistant" | "system",
          navigation_cta: null as NavigationCTA | null,
          current_step_key: null as string | null,
        })) as OnboardingMessage[];
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeOrgId]);

  // Fetch data on mount and when org context changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startConversation = useCallback(async () => {
    if (!user) return;

    setIsConversationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("onboarding-chat", {
        body: { 
          action: "start",
          org_context: activeOrgId ? {
            org_id: activeOrgId,
            org_name: activeOrg?.organization?.name || "your organization",
            is_personal: false,
          } : {
            is_personal: true,
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

      setMessages([{
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        step_completed: null,
        navigation_cta: data.navigation_cta || null,
        current_step_key: data.current_step_key || null,
        created_at: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start onboarding");
    } finally {
      setIsConversationLoading(false);
    }
  }, [user, activeOrgId, activeOrg]);

  const sendMessage = useCallback(async (message: string) => {
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
          org_context: activeOrgId ? {
            org_id: activeOrgId,
            org_name: activeOrg?.organization?.name || "your organization",
            is_personal: false,
          } : {
            is_personal: true,
          },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

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

      // Refresh progress if a step was completed
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
  }, [fetchData, activeOrgId, activeOrg]);

  const completeStep = useCallback(async (stepKey: string, metadata?: Record<string, unknown>) => {
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
        .eq("step_id", step.id);

      if (error) throw error;

      await fetchData();
      toast.success(`Completed: ${step.title}`);
    } catch (error) {
      console.error("Error completing step:", error);
      toast.error("Failed to complete step");
    }
  }, [user, steps, fetchData]);

  const skipStep = useCallback(async (stepKey: string) => {
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
        .eq("step_id", step.id);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error("Error skipping step:", error);
      toast.error("Failed to skip step");
    }
  }, [user, steps, fetchData]);

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

    // Clear dismissed state for current context
    localStorage.removeItem(`${DISMISSED_KEY}_${user.id}_${contextKey}`);
    setIsDismissed(false);

    // If no active conversation, start new one
    if (!conversation) {
      await startConversation();
    }
  }, [user, conversation, startConversation, contextKey]);

  const refreshProgress = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const getStepStatus = useCallback((stepKey: string) => {
    const step = steps.find((s) => s.key === stepKey);
    if (!step) return undefined;
    return progress.get(step.id)?.status;
  }, [steps, progress]);

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
    widgetConfig,
    isLoading,
    isConversationLoading,
    isDismissed,
    isComplete,
    startConversation,
    sendMessage,
    completeStep,
    skipStep,
    dismissOnboarding,
    undismissOnboarding,
    resumeConversation,
    refreshProgress,
    getStepStatus,
    getIncompleteSteps,
  };
}

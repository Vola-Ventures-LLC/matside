import { useState, useCallback, useEffect, useRef } from "react";
import { useSupabase } from "@saas-infra/auth/provider";

export type SupportCategory = "how_to" | "bug" | "feature_request" | "positive_feedback" | "billing" | "other";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  guideLinks?: string[];
  asksFeedback?: boolean;
}

export interface ConversationSummary {
  id: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview: string;
  user_rating?: number | null;
  rated_at?: string | null;
}

export interface UseSupportChatOptions {
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}

interface UseSupportChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  conversationStatus: string | null;
  conversationRating: number | null;
  isEscalated: boolean;
  awaitingFeedback: boolean;
  conversationHistory: ConversationSummary[];
  startConversation: (category: SupportCategory, guestEmail?: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  sendFeedback: (feedback: "positive" | "negative", reason?: string) => Promise<void>;
  rateConversation: (rating: number, feedback?: string) => Promise<void>;
  endConversation: () => Promise<void>;
  resetChat: () => void;
  fetchHistory: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
}

export function useSupportChat(options?: UseSupportChatOptions): UseSupportChatReturn {
  const supabase = useSupabase();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] = useState<string | null>(null);
  const [conversationRating, setConversationRating] = useState<number | null>(null);
  const [isEscalated, setIsEscalated] = useState(false);
  const [awaitingFeedback, setAwaitingFeedback] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationSummary[]>([]);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const startConversation = useCallback(async (category: SupportCategory, guestEmail?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("support-chat", {
        body: {
          action: "start",
          category,
          session_id: sessionIdRef.current,
          guest_email: guestEmail,
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setConversationId(data.conversation_id);
      setMessages([{
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const sendMessage = useCallback(async (message: string) => {
    if (!conversationId) return;

    setAwaitingFeedback(false);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("support-chat", {
        body: {
          action: "message",
          conversation_id: conversationId,
          message,
          session_id: sessionIdRef.current,
        },
      });

      if (fnError) throw fnError;
      if (data.error) {
        if (data.retry_after_minutes) {
          throw new Error(`Rate limit exceeded. Please try again in ${data.retry_after_minutes} minutes.`);
        }
        throw new Error(data.error);
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        guideLinks: data.guide_links,
        asksFeedback: data.asks_feedback,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.asks_feedback) {
        setAwaitingFeedback(true);
      }

      if (data.escalated) {
        setIsEscalated(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, supabase]);

  const sendFeedback = useCallback(async (feedback: "positive" | "negative", reason?: string) => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);
    setAwaitingFeedback(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("support-chat", {
        body: {
          action: "feedback",
          conversation_id: conversationId,
          feedback,
          feedback_reason: reason,
          session_id: sessionIdRef.current,
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.escalated) {
        setIsEscalated(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send feedback");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, supabase]);

  const endConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      await supabase.functions.invoke("support-chat", {
        body: {
          action: "end",
          conversation_id: conversationId,
        },
      });
    } catch (err) {
      console.error("Failed to end conversation:", err);
    }
  }, [conversationId, supabase]);

  const resetChat = useCallback(() => {
    if (conversationId) {
      endConversation();
    }
    setMessages([]);
    setConversationId(null);
    setConversationStatus(null);
    setConversationRating(null);
    setIsEscalated(false);
    setAwaitingFeedback(false);
    setError(null);
    sessionIdRef.current = crypto.randomUUID();
  }, [conversationId, endConversation]);

  const fetchHistory = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("support-chat", {
        body: { action: "history" },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setConversationHistory(data.conversations || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }, [supabase]);

  const loadConversation = useCallback(async (convId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("support-chat", {
        body: {
          action: "load",
          conversation_id: convId,
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setConversationId(data.conversation_id);
      setConversationStatus(data.status);
      setMessages(
        (data.messages || []).map((m: { id: string; role: string; content: string; created_at: string; metadata?: { asks_feedback?: boolean } }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.created_at),
          asksFeedback: m.metadata?.asks_feedback,
        }))
      );

      const hasEscalation = data.messages?.some((m: { content: string }) =>
        m.content.includes("created a support ticket")
      );
      setIsEscalated(hasEscalation || false);
      setAwaitingFeedback(false);
      setConversationRating(data.user_rating || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const rateConversation = useCallback(async (rating: number, feedback?: string) => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("support_conversations")
        .update({
          user_rating: rating,
          user_feedback: feedback || null,
          rated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      if (updateError) throw updateError;

      setConversationRating(rating);

      setConversationHistory(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, user_rating: rating, rated_at: new Date().toISOString() }
            : conv
        )
      );

      options?.onSuccess?.("Rating saved", "Thanks for your feedback!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rating");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, supabase, options]);

  // Store conversationId in ref for cleanup
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Cleanup on unmount
  useEffect(() => {
    const client = supabase;
    return () => {
      const id = conversationIdRef.current;
      if (id) {
        client.functions.invoke("support-chat", {
          body: { action: "end", conversation_id: id },
        }).catch(console.error);
      }
    };
  }, [supabase]);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    conversationStatus,
    conversationRating,
    isEscalated,
    awaitingFeedback,
    conversationHistory,
    startConversation,
    sendMessage,
    sendFeedback,
    rateConversation,
    endConversation,
    resetChat,
    fetchHistory,
    loadConversation,
  };
}

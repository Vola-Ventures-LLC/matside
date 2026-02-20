import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@saas-infra/auth/provider";

export type ContentType = "blog_post" | "social_media" | "email_campaign" | "marketing_copy";
export type ContentStatus = "idea" | "draft" | "review" | "scheduled" | "published" | "archived";
export type Platform = "instagram" | "facebook" | "twitter" | "linkedin" | "email" | "website" | null;

export interface ContentItem {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  content_type: ContentType;
  platform: Platform;
  status: ContentStatus;
  scheduled_for: string | null;
  published_at: string | null;
  ai_suggestions: unknown[];
  meta_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContentIdea {
  id: string;
  user_id: string;
  content_item_id: string | null;
  idea_text: string;
  idea_type: "topic" | "headline" | "angle" | "hook" | "cta";
  is_used: boolean;
  created_at: string;
}

export interface UseContentPlannerOptions {
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}

export function useContentItems(
  filters?: { status?: ContentStatus; content_type?: ContentType },
  options?: UseContentPlannerOptions,
) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["content-items", filters],
    queryFn: async () => {
      let query = supabase
        .from("content_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.content_type) {
        query = query.eq("content_type", filters.content_type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContentItem[];
    },
  });
}

export function useContentItem(id: string | undefined) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["content-item", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as ContentItem;
    },
    enabled: !!id,
  });
}

export function useCreateContentItem(options?: UseContentPlannerOptions) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Partial<ContentItem>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const insertData = {
        title: item.title || "Untitled",
        content: item.content || null,
        excerpt: item.excerpt || null,
        content_type: item.content_type || "blog_post",
        platform: item.platform || null,
        status: item.status || "draft",
        scheduled_for: item.scheduled_for || null,
        ai_suggestions: item.ai_suggestions || [],
        meta_data: item.meta_data || {},
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from("content_items")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as ContentItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      options?.onSuccess?.("Content created", "Content item created");
    },
    onError: (error) => {
      options?.onError?.("Failed to create content", error.message);
    },
  });
}

export function useUpdateContentItem(options?: UseContentPlannerOptions) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("content_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ContentItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      queryClient.invalidateQueries({ queryKey: ["content-item", data.id] });
      options?.onSuccess?.("Content updated", "Content updated");
    },
    onError: (error) => {
      options?.onError?.("Failed to update", error.message);
    },
  });
}

export function useDeleteContentItem(options?: UseContentPlannerOptions) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      options?.onSuccess?.("Content deleted", "Content deleted");
    },
    onError: (error) => {
      options?.onError?.("Failed to delete", error.message);
    },
  });
}

export function useContentAI(options?: UseContentPlannerOptions) {
  const supabase = useSupabase();

  return useMutation({
    mutationFn: async (params: {
      action: "brainstorm" | "draft" | "refine" | "schedule_suggest";
      content_type?: string;
      platform?: string;
      topic?: string;
      existing_content?: string;
      tone?: string;
      target_audience?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("content-ai", {
        body: params,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.result as string;
    },
    onError: (error) => {
      options?.onError?.("AI Error", error.message);
    },
  });
}

export function useContentIdeas(contentItemId?: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["content-ideas", contentItemId],
    queryFn: async () => {
      let query = supabase
        .from("content_ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (contentItemId) {
        query = query.eq("content_item_id", contentItemId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContentIdea[];
    },
  });
}

export function useSaveContentIdea(options?: UseContentPlannerOptions) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idea: Partial<ContentIdea>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const insertData = {
        idea_text: idea.idea_text || "",
        idea_type: idea.idea_type || "topic",
        content_item_id: idea.content_item_id || null,
        is_used: idea.is_used || false,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from("content_ideas")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as ContentIdea;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-ideas"] });
      options?.onSuccess?.("Idea saved", "Idea saved");
    },
  });
}

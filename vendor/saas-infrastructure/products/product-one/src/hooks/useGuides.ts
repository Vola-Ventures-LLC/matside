import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GuideSection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string;
  sort_order: number;
  visible_to_roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuideArticle {
  id: string;
  section_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: "draft" | "published";
  visible_to_roles: string[];
  sort_order: number;
  view_count: number;
  attachments: Array<{ name: string; url: string; size: number; type: string }>;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  section?: GuideSection;
}

export interface GuideArticleFeedback {
  id: string;
  article_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
}

export function useGuideSections() {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guide_sections")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ title: "Error loading sections", description: error.message, variant: "destructive" });
    } else {
      setSections(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const createSection = async (section: Partial<GuideSection>) => {
    const { data, error } = await supabase
      .from("guide_sections")
      .insert({
        title: section.title!,
        slug: section.slug!,
        description: section.description,
        icon: section.icon,
        sort_order: section.sort_order,
        visible_to_roles: section.visible_to_roles,
        is_active: section.is_active,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating section", description: error.message, variant: "destructive" });
      return null;
    }
    await fetchSections();
    return data;
  };

  const updateSection = async (id: string, updates: Partial<GuideSection>) => {
    const { error } = await supabase
      .from("guide_sections")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating section", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchSections();
    return true;
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase
      .from("guide_sections")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting section", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchSections();
    return true;
  };

  const reorderSections = async (orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) => ({ id, sort_order: index }));
    
    for (const update of updates) {
      await supabase
        .from("guide_sections")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id);
    }
    await fetchSections();
  };

  return { sections, loading, fetchSections, createSection, updateSection, deleteSection, reorderSections };
}

export function useGuideArticles(sectionId?: string) {
  const [articles, setArticles] = useState<GuideArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("guide_articles")
      .select("*, section:guide_sections(*)")
      .order("sort_order", { ascending: true });

    if (sectionId) {
      query = query.eq("section_id", sectionId);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error loading articles", description: error.message, variant: "destructive" });
    } else {
      setArticles((data || []) as GuideArticle[]);
    }
    setLoading(false);
  }, [sectionId, toast]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const createArticle = async (article: Partial<GuideArticle>) => {
    const { data, error } = await supabase
      .from("guide_articles")
      .insert({
        section_id: article.section_id!,
        title: article.title!,
        slug: article.slug!,
        content: article.content,
        excerpt: article.excerpt,
        status: article.status,
        visible_to_roles: article.visible_to_roles,
        sort_order: article.sort_order,
        attachments: article.attachments,
        author_id: article.author_id!,
        published_at: article.published_at,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating article", description: error.message, variant: "destructive" });
      return null;
    }
    await fetchArticles();
    return data;
  };

  const updateArticle = async (id: string, updates: Partial<GuideArticle>) => {
    const { error } = await supabase
      .from("guide_articles")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating article", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchArticles();
    return true;
  };

  const deleteArticle = async (id: string) => {
    const { error } = await supabase
      .from("guide_articles")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting article", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchArticles();
    return true;
  };

  const reorderArticles = async (orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) => ({ id, sort_order: index }));
    
    for (const update of updates) {
      await supabase
        .from("guide_articles")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id);
    }
    await fetchArticles();
  };

  const publishArticle = async (id: string) => {
    const { error } = await supabase
      .from("guide_articles")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ title: "Error publishing article", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchArticles();
    return true;
  };

  const unpublishArticle = async (id: string) => {
    const { error } = await supabase
      .from("guide_articles")
      .update({ status: "draft", published_at: null })
      .eq("id", id);

    if (error) {
      toast({ title: "Error unpublishing article", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchArticles();
    return true;
  };

  return { 
    articles, 
    loading, 
    fetchArticles, 
    createArticle, 
    updateArticle, 
    deleteArticle, 
    reorderArticles,
    publishArticle,
    unpublishArticle 
  };
}

export function useArticleFeedback(articleId: string) {
  const [feedback, setFeedback] = useState<{ helpful: number; notHelpful: number; userVote: boolean | null }>({
    helpful: 0,
    notHelpful: 0,
    userVote: null,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    
    // Get aggregate counts
    const { data: allFeedback } = await supabase
      .from("guide_article_feedback")
      .select("is_helpful")
      .eq("article_id", articleId);

    const helpful = allFeedback?.filter(f => f.is_helpful).length || 0;
    const notHelpful = allFeedback?.filter(f => !f.is_helpful).length || 0;

    // Get user's vote
    const { data: { user } } = await supabase.auth.getUser();
    let userVote: boolean | null = null;
    
    if (user) {
      const { data: userFeedback } = await supabase
        .from("guide_article_feedback")
        .select("is_helpful")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      userVote = userFeedback?.is_helpful ?? null;
    }

    setFeedback({ helpful, notHelpful, userVote });
    setLoading(false);
  }, [articleId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const submitFeedback = async (isHelpful: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in to submit feedback", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("guide_article_feedback")
      .upsert(
        { article_id: articleId, user_id: user.id, is_helpful: isHelpful },
        { onConflict: "article_id,user_id" }
      );

    if (error) {
      toast({ title: "Error submitting feedback", description: error.message, variant: "destructive" });
    } else {
      await fetchFeedback();
    }
  };

  return { feedback, loading, submitFeedback };
}

export function useIncrementViewCount() {
  return async (articleId: string) => {
    // Manual increment since we don't have an RPC function
    const { data } = await supabase
      .from("guide_articles")
      .select("view_count")
      .eq("id", articleId)
      .single();
    
    if (data) {
      await supabase
        .from("guide_articles")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", articleId);
    }
  };
}

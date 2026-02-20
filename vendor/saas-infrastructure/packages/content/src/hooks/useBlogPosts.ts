import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSupabase } from "@saas-infra/auth/provider";
import { useDebounce } from "../utils/useDebounce";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string;
  reading_time_minutes: number | null;
  category: { name: string; slug: string } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface UseBlogPostsResult {
  posts: BlogPost[];
  categories: Category[];
  tags: Tag[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categorySlug: string | null;
  tagSlug: string | null;
  setCategoryFilter: (slug: string | null) => void;
  setTagFilter: (slug: string | null) => void;
  clearFilters: () => void;
}

export function useBlogPosts(): UseBlogPostsResult {
  const supabase = useSupabase();
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  const tagSlug = searchParams.get("tag");

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);

    try {
      if (tagSlug) {
        const { data: tagData } = await supabase
          .from("blog_tags")
          .select("id")
          .eq("slug", tagSlug)
          .single();

        if (tagData) {
          const { data: postTagData } = await supabase
            .from("blog_post_tags")
            .select("post_id")
            .eq("tag_id", tagData.id);

          const postIds = postTagData?.map((pt) => pt.post_id) || [];

          if (postIds.length > 0) {
            let query = supabase
              .from("blog_posts")
              .select(`
                id,
                title,
                slug,
                excerpt,
                featured_image_url,
                published_at,
                reading_time_minutes,
                category:blog_categories(name, slug)
              `)
              .eq("status", "published")
              .lte("published_at", new Date().toISOString())
              .in("id", postIds)
              .order("published_at", { ascending: false });

            if (categorySlug) {
              const { data: catData } = await supabase
                .from("blog_categories")
                .select("id")
                .eq("slug", categorySlug)
                .single();

              if (catData) {
                query = query.eq("category_id", catData.id);
              }
            }

            if (debouncedSearch) {
              query = query.or(`title.ilike.%${debouncedSearch}%,excerpt.ilike.%${debouncedSearch}%`);
            }

            const { data } = await query;
            setPosts((data || []) as unknown as BlogPost[]);
          } else {
            setPosts([]);
          }
        } else {
          setPosts([]);
        }
      } else {
        let query = supabase
          .from("blog_posts")
          .select(`
            id,
            title,
            slug,
            excerpt,
            featured_image_url,
            published_at,
            reading_time_minutes,
            category:blog_categories(name, slug)
          `)
          .eq("status", "published")
          .lte("published_at", new Date().toISOString())
          .order("published_at", { ascending: false });

        if (categorySlug) {
          const { data: catData } = await supabase
            .from("blog_categories")
            .select("id")
            .eq("slug", categorySlug)
            .single();

          if (catData) {
            query = query.eq("category_id", catData.id);
          }
        }

        if (debouncedSearch) {
          query = query.or(`title.ilike.%${debouncedSearch}%,excerpt.ilike.%${debouncedSearch}%`);
        }

        const { data } = await query;
        setPosts((data || []) as unknown as BlogPost[]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [categorySlug, tagSlug, debouncedSearch, supabase]);

  useEffect(() => {
    const fetchMetadata = async () => {
      const [categoriesRes, tagsRes] = await Promise.all([
        supabase
          .from("blog_categories")
          .select("id, name, slug")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("blog_tags")
          .select("id, name, slug")
          .order("name"),
      ]);

      setCategories(categoriesRes.data || []);
      setTags(tagsRes.data || []);
    };

    fetchMetadata();
  }, [supabase]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const setCategoryFilter = useCallback((slug: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const setTagFilter = useCallback((slug: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set("tag", slug);
    } else {
      params.delete("tag");
    }
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchParams({});
    setSearchQuery("");
  }, [setSearchParams]);

  return {
    posts,
    categories,
    tags,
    isLoading,
    searchQuery,
    setSearchQuery,
    categorySlug,
    tagSlug,
    setCategoryFilter,
    setTagFilter,
    clearFilters,
  };
}

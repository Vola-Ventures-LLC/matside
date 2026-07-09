import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { sanitizeRichContent } from "@/lib/sanitize";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string;
  updated_at: string;
  reading_time_minutes: number | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  view_count: number;
  category: { name: string; slug: string } | null;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchPost = useCallback(async () => {
    setIsLoading(true);

    const { data: postData, error } = await supabase
      .from("blog_posts")
      .select(
        `
        id,
        title,
        slug,
        content,
        excerpt,
        featured_image_url,
        published_at,
        updated_at,
        reading_time_minutes,
        meta_title,
        meta_description,
        og_image_url,
        view_count,
        category:blog_categories(name, slug)
      `
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !postData) {
      setIsLoading(false);
      return;
    }

    setPost(postData as BlogPost);

    // Increment view count
    await supabase
      .from("blog_posts")
      .update({ view_count: (postData.view_count || 0) + 1 })
      .eq("id", postData.id);

    // Fetch tags
    const { data: postTags } = await supabase
      .from("blog_post_tags")
      .select("tag:blog_tags(id, name, slug)")
      .eq("post_id", postData.id);

    if (postTags) {
      setTags(postTags.map((pt: any) => pt.tag).filter(Boolean));
    }

    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug, fetchPost]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post?.title,
        text: post?.excerpt || "",
        url: window.location.href,
      });
    } catch {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  // Add IDs to headings for TOC
  useEffect(() => {
    if (contentRef.current) {
      const headings = contentRef.current.querySelectorAll("h1, h2, h3");
      headings.forEach((heading, index) => {
        heading.id = `heading-${index}`;
      });
    }
  }, [post?.content]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" text="Loading post..." />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link to="/blog">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {post.meta_title || post.title} | SaaS Infrastructure Blog
        </title>
        <meta
          name="description"
          content={post.meta_description || post.excerpt || ""}
        />
        <meta property="og:title" content={post.title} />
        <meta
          property="og:description"
          content={post.meta_description || post.excerpt || ""}
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={typeof window !== "undefined" ? window.location.href : `https://your-domain.com/blog/${post.slug}`} />
        {(post.og_image_url || post.featured_image_url) && (
          <meta property="og:image" content={post.og_image_url || post.featured_image_url || ""} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta
          name="twitter:description"
          content={post.meta_description || post.excerpt || ""}
        />
        {(post.og_image_url || post.featured_image_url) && (
          <meta name="twitter:image" content={post.og_image_url || post.featured_image_url || ""} />
        )}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.meta_description || post.excerpt,
            image: post.og_image_url || post.featured_image_url,
            datePublished: post.published_at,
            dateModified: post.updated_at,
            author: {
              "@type": "Person",
              name: "SaaS Infrastructure Team",
            },
            publisher: {
              "@type": "Organization",
              name: "SaaS Infrastructure",
            },
          })}
        </script>
      </Helmet>

      <ReadingProgress />

      <article className="container py-12">
        {/* Back button */}
        <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Link>

        <div className="grid gap-12 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <header className="mb-8">
              {post.category && (
                <Link to={`/blog?category=${post.category.slug}`}>
                  <Badge variant="secondary" className="mb-4">
                    {post.category.name}
                  </Badge>
                </Link>
              )}

              <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-6">
                  {post.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at), "MMMM d, yyyy")}
                </span>

                {post.reading_time_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.reading_time_minutes} min read
                  </span>
                )}

                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </header>

            {/* Featured Image */}
            {post.featured_image_url && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full object-cover aspect-video"
                />
              </div>
            )}

            {/* Content */}
            <div
              ref={contentRef}
              className="prose prose-lg dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_p]:mb-4 [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: sanitizeRichContent(post.content) }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                        #{tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter CTA */}
            <div className="mt-12">
              <NewsletterSignup />
            </div>
          </div>

          {/* Sidebar - Table of Contents */}
          <aside className="hidden lg:block">
            <TableOfContents content={post.content} />
          </aside>
        </div>
      </article>
    </>
  );
}

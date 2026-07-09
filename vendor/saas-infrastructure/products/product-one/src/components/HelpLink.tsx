import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HelpCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeRichContent } from "@/lib/sanitize";

interface HelpLinkProps {
  /** The slug of the article to link to */
  article: string;
  /** Optional section slug (if not provided, will search all sections) */
  section?: string;
  /** Show as inline link instead of icon button */
  inline?: boolean;
  /** Custom trigger content */
  children?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

interface ArticleData {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  section: {
    slug: string;
    title: string;
  };
}

/**
 * Contextual help component that links to or displays guide articles
 * 
 * Usage:
 * <HelpLink article="getting-started" /> - Icon button that opens article in sheet
 * <HelpLink article="getting-started" inline>Learn more</HelpLink> - Inline link
 */
export function HelpLink({ article, section, inline, children, className }: HelpLinkProps) {
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchArticle = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from("guide_articles")
      .select("id, title, content, excerpt, section:guide_sections(slug, title)")
      .eq("slug", article)
      .eq("status", "published")
      .single();

    const { data, error } = await query;

    if (!error && data) {
      const sectionData = Array.isArray(data.section) ? data.section[0] : data.section;
      setArticleData({
        ...data,
        section: sectionData as ArticleData["section"],
      });
    }
    setLoading(false);
  }, [article]);

  useEffect(() => {
    if (open && !articleData) {
      fetchArticle();
    }
  }, [open, articleData, fetchArticle]);

  const fullUrl = articleData 
    ? `/guides/${articleData.section.slug}/${article}`
    : `/guides`;

  if (inline) {
    return (
      <Link 
        to={fullUrl}
        className={cn("text-primary hover:underline inline-flex items-center gap-1", className)}
      >
        {children || "Learn more"}
        <ExternalLink className="h-3 w-3" />
      </Link>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-6 w-6 rounded-full", className)}
          title="Help"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{loading ? "Loading..." : articleData?.title || "Help"}</SheetTitle>
          {articleData?.excerpt && (
            <SheetDescription>{articleData.excerpt}</SheetDescription>
          )}
        </SheetHeader>
        <div className="mt-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          ) : articleData ? (
            <>
              <div 
                className="prose prose-sm prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeRichContent(articleData.content) }}
              />
              <div className="mt-6 pt-4 border-t">
                <Button variant="outline" asChild className="w-full">
                  <Link to={fullUrl}>
                    Open full article
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">
              Article not found. <Link to="/guides" className="text-primary hover:underline">Browse all guides</Link>
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Simple help tooltip that links to a guide article
 */
export function HelpTooltip({ article, section }: { article: string; section?: string }) {
  return (
    <HelpLink article={article} section={section} />
  );
}

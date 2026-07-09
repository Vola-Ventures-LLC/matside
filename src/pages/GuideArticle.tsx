import { useEffect, useState, useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  sort_order: number;
}

interface Section {
  id: string;
  title: string;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  section_id: string;
  sort_order: number;
  section: Section;
}

export default function GuideArticle() {
  const { sectionSlug, articleSlug } = useParams<{
    sectionSlug: string;
    articleSlug: string;
  }>();

  const [article, setArticle] = useState<Article | null>(null);
  const [sectionArticles, setSectionArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!articleSlug || !sectionSlug) return;

    async function load() {
      setLoading(true);
      setNotFound(false);

      // Fetch article + section via slug join
      const { data: articleData } = await supabase
        .from("guide_articles")
        .select("id, title, slug, excerpt, content, section_id, sort_order")
        .eq("slug", articleSlug)
        .eq("status", "published")
        .single();

      if (!articleData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Fetch the section to verify sectionSlug matches
      const { data: sectionData } = await supabase
        .from("guide_sections")
        .select("id, title, slug")
        .eq("id", articleData.section_id)
        .eq("is_active", true)
        .single();

      if (!sectionData || sectionData.slug !== sectionSlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setArticle({ ...articleData, section: sectionData });

      // Fetch sibling articles for the sidebar
      const { data: siblings } = await supabase
        .from("guide_articles")
        .select("id, title, slug, sort_order")
        .eq("section_id", sectionData.id)
        .eq("status", "published")
        .order("sort_order");

      setSectionArticles(siblings ?? []);
      setLoading(false);
    }

    load();
  }, [articleSlug, sectionSlug]);

  const html = useMemo(() => {
    if (!article?.content) return "";
    const rawHtml = marked.parse(article.content) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [article?.content]);

  if (!loading && notFound) {
    return <Navigate to="/guides" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 sm:pt-28 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {loading ? (
            <div className="animate-pulse max-w-3xl mx-auto">
              <div className="h-4 w-32 bg-muted rounded mb-8" />
              <div className="h-8 w-64 bg-muted rounded mb-4" />
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
                ))}
              </div>
            </div>
          ) : article ? (
            <div className="flex gap-12">
              {/* Sidebar */}
              <aside className="hidden lg:block w-56 flex-shrink-0">
                <div className="sticky top-28">
                  <Link
                    to="/guides"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    All guides
                  </Link>

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {article.section.title}
                  </p>
                  <nav className="space-y-0.5">
                    {sectionArticles.map((a) => (
                      <Link
                        key={a.id}
                        to={`/guides/${sectionSlug}/${a.slug}`}
                        className={`block text-sm py-1.5 px-2 rounded transition-colors ${
                          a.slug === articleSlug
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {a.title}
                      </Link>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Article */}
              <div className="flex-1 min-w-0 max-w-3xl">
                {/* Breadcrumb (mobile) */}
                <Link
                  to="/guides"
                  className="lg:hidden inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  All guides
                </Link>

                <p className="text-sm text-primary font-medium mb-2">
                  {article.section.title}
                </p>

                <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-8">
                  {article.title}
                </h1>

                <div
                  className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-strong:text-foreground"
                  dangerouslySetInnerHTML={{ __html: html }}
                />

                {/* Next article navigation */}
                {sectionArticles.length > 1 && (() => {
                  const idx = sectionArticles.findIndex((a) => a.slug === articleSlug);
                  const next = idx >= 0 && idx < sectionArticles.length - 1 ? sectionArticles[idx + 1] : null;
                  const prev = idx > 0 ? sectionArticles[idx - 1] : null;
                  return (
                    <div className="mt-12 pt-8 border-t border-border flex items-center justify-between gap-4">
                      {prev ? (
                        <Link
                          to={`/guides/${sectionSlug}/${prev.slug}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                          <span>{prev.title}</span>
                        </Link>
                      ) : <div />}
                      {next && (
                        <Link
                          to={`/guides/${sectionSlug}/${next.slug}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
                        >
                          <span>{next.title}</span>
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        </Link>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Users,
  Trophy,
  Calendar,
  Zap,
  Shield,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Users,
  Trophy,
  Calendar,
  Zap,
  Shield,
  HelpCircle,
};

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  sort_order: number;
}

interface Section {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  articles: Article[];
}

export default function Guides() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: sectionsData } = await supabase
        .from("guide_sections")
        .select("id, title, slug, description, icon, sort_order")
        .eq("is_active", true)
        .order("sort_order");

      if (!sectionsData) {
        setLoading(false);
        return;
      }

      const sectionsWithArticles = await Promise.all(
        sectionsData.map(async (section) => {
          const { data: articles } = await supabase
            .from("guide_articles")
            .select("id, title, slug, excerpt, sort_order")
            .eq("section_id", section.id)
            .eq("status", "published")
            .order("sort_order");

          return { ...section, articles: articles ?? [] };
        })
      );

      setSections(sectionsWithArticles);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 sm:pt-28 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
              Help Center
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to know about running youth wrestling meets with MatSide.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-border rounded-xl p-6 animate-pulse">
                  <div className="h-8 w-8 bg-muted rounded mb-3" />
                  <div className="h-5 w-40 bg-muted rounded mb-2" />
                  <div className="h-4 w-56 bg-muted rounded mb-4" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-4 w-48 bg-muted rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>Guides are coming soon. Check back shortly!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {sections.map((section) => {
                const Icon = SECTION_ICONS[section.icon ?? "HelpCircle"] ?? HelpCircle;
                return (
                  <div
                    key={section.id}
                    className="border border-border rounded-xl p-6 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-foreground text-lg leading-tight">
                          {section.title}
                        </h2>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {section.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {section.articles.length > 0 && (
                      <ul className="space-y-1">
                        {section.articles.map((article) => (
                          <li key={article.id}>
                            <Link
                              to={`/guides/${section.slug}/${article.slug}`}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1 group"
                            >
                              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-primary/40 group-hover:text-primary transition-colors" />
                              {article.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

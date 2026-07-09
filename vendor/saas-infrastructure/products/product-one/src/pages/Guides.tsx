import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { supabase } from "@/integrations/supabase/client";
import { useIncrementViewCount, useArticleFeedback } from "@/hooks/useGuides";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Search, 
  BookOpen, 
  ChevronRight, 
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Paperclip,
  Download,
  Menu,
  User,
  Users,
  Building2,
  CreditCard,
  FileEdit,
  Shield,
  Settings,
  Crown,
  Briefcase,
  ArrowLeft,
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";

// Icon mapping for dynamic icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Users,
  Building2,
  CreditCard,
  FileEdit,
  Shield,
  Settings,
  Crown,
  Briefcase,
  BookOpen,
};

// Color mapping for role cards
const COLOR_MAP: Record<string, string> = {
  primary: "bg-primary",
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  pink: "bg-pink-500",
  teal: "bg-teal-500",
};

interface GuideRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  is_active: boolean;
}

interface GuideSection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string;
  visible_to_roles: string[];
  articles: GuideArticle[];
}

interface GuideArticle {
  id: string;
  section_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  visible_to_roles: string[];
  attachments: Array<{ name: string; url: string; size: number; type: string }>;
}

function GuideSidebar({ 
  sections, 
  currentArticle, 
  searchQuery,
  onSearch,
  onNavigate,
  selectedRole,
}: { 
  sections: GuideSection[]; 
  currentArticle?: GuideArticle;
  searchQuery: string;
  onSearch: (query: string) => void;
  onNavigate?: () => void;
  selectedRole?: string;
}) {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    currentArticle ? [currentArticle.section_id] : sections.map(s => s.id)
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-2">
        {selectedRole && (
          <Link 
            to="/guides" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={onNavigate}
          >
            <ArrowLeft className="h-4 w-4" />
            All Roles
          </Link>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guides..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 p-2">
        <nav className="space-y-1">
          {sections.map((section) => (
            <Collapsible
              key={section.id}
              open={expandedSections.includes(section.id)}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted text-left">
                {expandedSections.includes(section.id) ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="font-medium text-sm truncate">{section.title}</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-6 space-y-1">
                {section.articles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/guides/${section.slug}/${article.slug}`}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md text-sm hover:bg-muted transition-colors",
                      currentArticle?.id === article.id && "bg-muted font-medium"
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{article.title}</span>
                  </Link>
                ))}
                {section.articles.length === 0 && (
                  <p className="p-2 text-sm text-muted-foreground">No articles yet</p>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

function ArticleFeedbackSection({ articleId }: { articleId: string }) {
  const { feedback, loading, submitFeedback } = useArticleFeedback(articleId);

  if (loading) return null;

  return (
    <div className="border-t pt-6 mt-8">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-muted-foreground">Was this helpful?</span>
        <div className="flex items-center gap-2">
          <Button
            variant={feedback.userVote === true ? "default" : "outline"}
            size="sm"
            onClick={() => submitFeedback(true)}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Yes ({feedback.helpful})
          </Button>
          <Button
            variant={feedback.userVote === false ? "default" : "outline"}
            size="sm"
            onClick={() => submitFeedback(false)}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            No ({feedback.notHelpful})
          </Button>
        </div>
      </div>
    </div>
  );
}

function ArticleView({ article, section }: { article: GuideArticle; section: GuideSection }) {
  const incrementView = useIncrementViewCount();

  useEffect(() => {
    incrementView(article.id);
  }, [article.id, incrementView]);

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link to="/guides" className="hover:underline">Guides</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/guides/${section.slug}`} className="hover:underline">{section.title}</Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">{article.title}</h1>
        {article.excerpt && (
          <p className="text-base sm:text-lg text-muted-foreground mt-2">{article.excerpt}</p>
        )}
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none prose-sm sm:prose-base [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:mt-6 [&_h3]:mb-3 [&_table]:w-full [&_th]:text-left [&_th]:p-2 [&_th]:border-b [&_td]:p-2 [&_td]:border-b [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto">
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{article.content}</ReactMarkdown>
      </div>

      {article.attachments && article.attachments.length > 0 && (
        <div className="mt-8 p-4 rounded-lg border bg-muted/50">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Paperclip className="h-5 w-5" />
            Attachments
          </h3>
          <div className="space-y-2">
            {article.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment.url}
                download={attachment.name}
                className="flex items-center justify-between p-2 rounded border bg-background hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{attachment.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Download className="h-4 w-4 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      <ArticleFeedbackSection articleId={article.id} />
    </article>
  );
}

function RoleBasedHome({ 
  roles, 
  sections,
  searchQuery, 
  onSearch,
}: { 
  roles: GuideRole[];
  sections: GuideSection[];
  searchQuery: string;
  onSearch: (query: string) => void;
}) {
  // Flatten all articles for search results
  const allArticles = sections.flatMap(section => 
    section.articles.map(article => ({ ...article, sectionTitle: section.title, sectionSlug: section.slug }))
  );

  const searchResults = searchQuery.trim()
    ? allArticles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Count articles per role
  const roleArticleCounts = roles.reduce((acc, role) => {
    acc[role.slug] = allArticles.filter(article => 
      article.visible_to_roles.length === 0 || article.visible_to_roles.includes(role.slug)
    ).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-muted-foreground mb-6">
          Select your role to find relevant guides, or search for specific topics
        </p>
        
        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-12 h-12 text-base"
          />
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </h2>
            {searchResults.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => onSearch("")}>
                Clear search
              </Button>
            )}
          </div>
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((article) => (
                <Link
                  key={article.id}
                  to={`/guides/${article.sectionSlug}/${article.slug}`}
                  className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{article.title}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {article.sectionTitle}
                      </span>
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.excerpt}</p>
                    )}
                    {article.visible_to_roles.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {article.visible_to_roles.slice(0, 3).map(role => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No articles found for "{searchQuery}"</p>
                <p className="text-sm text-muted-foreground mt-1">Try different keywords or browse by role below</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Role Cards */}
      {(!searchQuery.trim() || searchResults.length === 0) && (
        <>
          <h2 className="font-semibold text-lg mb-4">Browse by Role</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {roles.map((role) => {
              const IconComponent = ICON_MAP[role.icon] || User;
              const colorClass = COLOR_MAP[role.color] || "bg-primary";
              const articleCount = roleArticleCounts[role.slug] || 0;
              
              return (
                <Link key={role.id} to={`/guides/role/${role.slug}`}>
                  <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className={`rounded-lg p-3 w-fit ${colorClass}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-lg mb-1">{role.name}</CardTitle>
                      <CardDescription className="mb-2">{role.description}</CardDescription>
                      <Badge variant="secondary">{articleCount} articles</Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* All Sections fallback */}
          <h2 className="font-semibold text-lg mb-4">All Topics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {sections.map((section) => (
              <Card key={section.id} className="hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5" />
                    {section.title}
                  </CardTitle>
                  {section.description && (
                    <CardDescription>{section.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {section.articles.slice(0, 3).map((article) => (
                      <Link
                        key={article.id}
                        to={`/guides/${section.slug}/${article.slug}`}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{article.title}</span>
                      </Link>
                    ))}
                    {section.articles.length > 3 && (
                      <Link
                        to={`/guides/${section.slug}`}
                        className="text-sm text-primary hover:underline pl-6"
                      >
                        View all {section.articles.length} articles →
                      </Link>
                    )}
                    {section.articles.length === 0 && (
                      <p className="text-sm text-muted-foreground p-2">No articles yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RoleGuidesView({ 
  role, 
  sections,
  searchQuery, 
  onSearch,
}: { 
  role: GuideRole;
  sections: GuideSection[];
  searchQuery: string;
  onSearch: (query: string) => void;
}) {
  const IconComponent = ICON_MAP[role.icon] || User;
  const colorClass = COLOR_MAP[role.color] || "bg-primary";

  // Filter sections and articles for this role
  const filteredSections = sections.map(section => ({
    ...section,
    articles: section.articles.filter(article => 
      article.visible_to_roles.length === 0 || article.visible_to_roles.includes(role.slug)
    )
  })).filter(section => section.articles.length > 0);

  // Flatten for search
  const allArticles = filteredSections.flatMap(section => 
    section.articles.map(article => ({ ...article, sectionTitle: section.title, sectionSlug: section.slug }))
  );

  const searchResults = searchQuery.trim()
    ? allArticles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-8">
        <Link 
          to="/guides" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          All Roles
        </Link>
        <div className="flex items-center gap-4">
          <div className={`rounded-lg p-3 ${colorClass}`}>
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{role.name} Guides</h1>
            <p className="text-muted-foreground">{role.description}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-xl relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={`Search ${role.name} guides...`}
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-12 h-12 text-base"
        />
      </div>

      {/* Search Results */}
      {searchQuery.trim() ? (
        <div className="mb-8">
          <h2 className="font-semibold mb-4">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
          </h2>
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((article) => (
                <Link
                  key={article.id}
                  to={`/guides/${article.sectionSlug}/${article.slug}`}
                  className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-medium">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-muted-foreground">No articles found for "{searchQuery}"</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Sections Grid */
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredSections.map((section) => (
            <Card key={section.id} className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" />
                  {section.title}
                </CardTitle>
                {section.description && (
                  <CardDescription>{section.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {section.articles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/guides/${section.slug}/${article.slug}`}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{article.title}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredSections.length === 0 && (
            <Card className="col-span-full text-center py-8">
              <CardContent>
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No guides available for this role yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function Guides() {
  const { sectionSlug, articleSlug, roleSlug } = useParams<{ 
    sectionSlug?: string; 
    articleSlug?: string;
    roleSlug?: string;
  }>();
  const [roles, setRoles] = useState<GuideRole[]>([]);
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    const [rolesResult, sectionsResult, articlesResult] = await Promise.all([
      supabase.from("guide_roles").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("guide_sections").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("guide_articles").select("*").eq("status", "published").order("sort_order"),
    ]);

    setRoles((rolesResult.data || []) as GuideRole[]);

    if (sectionsResult.data) {
      const sectionsWithArticles = sectionsResult.data.map((section) => ({
        ...section,
        articles: (articlesResult.data || [])
          .filter((a) => a.section_id === section.id)
          .map((a) => ({
            ...a,
            visible_to_roles: a.visible_to_roles || [],
            attachments: (Array.isArray(a.attachments) ? a.attachments : []) as GuideArticle["attachments"],
          })),
      }));
      setSections(sectionsWithArticles);
    }
    setLoading(false);
  };

  const selectedRole = roleSlug ? roles.find(r => r.slug === roleSlug) : undefined;

  const currentSection = sectionSlug 
    ? sections.find((s) => s.slug === sectionSlug)
    : undefined;
  const currentArticle = currentSection && articleSlug
    ? currentSection.articles.find((a) => a.slug === articleSlug)
    : undefined;

  const filteredSections = sections.map((section) => ({
    ...section,
    articles: section.articles.filter((article) =>
      searchQuery
        ? article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    ),
  })).filter((section) => 
    searchQuery 
      ? section.articles.length > 0 || section.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
          {/* Mobile menu button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="border-b p-4">
                <Link to="/guides" className="flex items-center gap-2 font-semibold" onClick={() => setMobileOpen(false)}>
                  <BookOpen className="h-5 w-5" />
                  Help Center
                </Link>
              </div>
              <GuideSidebar 
                sections={filteredSections} 
                currentArticle={currentArticle}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                onNavigate={() => setMobileOpen(false)}
                selectedRole={roleSlug}
              />
            </SheetContent>
          </Sheet>

          <Link to="/guides" className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5" />
            <span className="hidden sm:inline">Help Center</span>
          </Link>

          <div className="ml-auto">
            <Link to="/" target="_blank">
              <Button variant="outline" size="sm">
                Go to App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar - only show when viewing an article */}
        {currentArticle && (
          <aside className="hidden lg:block w-72 border-r shrink-0">
            <GuideSidebar 
              sections={filteredSections} 
              currentArticle={currentArticle}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
              selectedRole={roleSlug}
            />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 py-8">
          {currentArticle && currentSection ? (
            <ArticleView article={currentArticle} section={currentSection} />
          ) : selectedRole ? (
            <RoleGuidesView 
              role={selectedRole}
              sections={sections}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
            />
          ) : (
            <RoleBasedHome 
              roles={roles}
              sections={sections}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
            />
          )}
        </main>
      </div>
    </div>
  );
}

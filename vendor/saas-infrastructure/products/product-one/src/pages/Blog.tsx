import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import {
  Calendar,
  Clock,
  Search,
  ArrowRight,
  FileText,
  X,
  Tag,
} from "lucide-react";
import { format } from "date-fns";

export default function Blog() {
  const {
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
  } = useBlogPosts();

  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  const hasActiveFilters = categorySlug || tagSlug || searchQuery;

  return (
    <>
      <Helmet>
        <title>Blog | SaaS Infrastructure</title>
        <meta name="description" content="Insights, tutorials, and updates from our team" />
        <meta property="og:title" content="Blog | SaaS Infrastructure" />
        <meta property="og:description" content="Insights, tutorials, and updates from our team" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== "undefined" ? window.location.href : "https://your-domain.com/blog"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog | SaaS Infrastructure" />
        <meta name="twitter:description" content="Insights, tutorials, and updates from our team" />
      </Helmet>

      <div className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Insights, tutorials, and updates from our team
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-fit">
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
          
          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!categorySlug ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(null)}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={categorySlug === cat.slug ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat.slug)}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Active tag filter badge */}
          {tagSlug && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtered by tag:</span>
              <Badge variant="secondary" className="gap-1">
                <Tag className="h-3 w-3" />
                {tags.find(t => t.slug === tagSlug)?.name || tagSlug}
                <button
                  onClick={() => setTagFilter(null)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Loading posts..." />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No posts found"
            description={
              hasActiveFilters
                ? "Try adjusting your filters"
                : "Check back soon for new content"
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Featured Post */}
              {featuredPost && (
                <Link to={`/blog/${featuredPost.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    {featuredPost.featured_image_url && (
                      <div className="aspect-video">
                        <img
                          src={featuredPost.featured_image_url}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      {featuredPost.category && (
                        <Badge variant="secondary" className="w-fit">
                          {featuredPost.category.name}
                        </Badge>
                      )}
                      <CardTitle className="text-2xl hover:text-primary transition-colors">
                        {featuredPost.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {featuredPost.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(
                            new Date(featuredPost.published_at),
                            "MMM d, yyyy"
                          )}
                        </span>
                        {featuredPost.reading_time_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {featuredPost.reading_time_minutes} min read
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Regular Posts Grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                {regularPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      {post.featured_image_url && (
                        <div className="aspect-video">
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        </div>
                      )}
                      <CardHeader>
                        {post.category && (
                          <Badge variant="secondary" className="w-fit text-xs">
                            {post.category.name}
                          </Badge>
                        )}
                        <CardTitle className="text-lg line-clamp-2 hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                        {post.excerpt && (
                          <CardDescription className="line-clamp-2">
                            {post.excerpt}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(post.published_at), "MMM d")}
                          </span>
                          {post.reading_time_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.reading_time_minutes} min
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <NewsletterSignup />

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => setCategoryFilter(cat.slug)}
                    >
                      {cat.name}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Tags */}
              {tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={tagSlug === tag.slug ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() => setTagFilter(tagSlug === tag.slug ? null : tag.slug)}
                        >
                          #{tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

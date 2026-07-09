import { useState } from "react";
import { GuideArticle, useGuideArticles, useGuideSections } from "@/hooks/useGuides";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  GripVertical, 
  Pencil, 
  Trash2,
  FileText,
  Eye,
  EyeOff,
  Globe,
  Lock
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { format } from "date-fns";

export function GuideArticlesList() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { articles, loading, deleteArticle, publishArticle, unpublishArticle } = useGuideArticles(sectionId);
  const { sections } = useGuideSections();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<GuideArticle | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");

  const currentSection = sections.find(s => s.id === sectionId);

  const filteredArticles = articles.filter(article => {
    if (statusFilter === "all") return true;
    return article.status === statusFilter;
  });

  const handleDelete = async () => {
    if (deletingArticle) {
      await deleteArticle(deletingArticle.id);
      setDeleteDialogOpen(false);
      setDeletingArticle(null);
    }
  };

  const handleTogglePublish = async (article: GuideArticle) => {
    if (article.status === "published") {
      await unpublishArticle(article.id);
    } else {
      await publishArticle(article.id);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardDescription>
                {currentSection 
                  ? `Articles in "${currentSection.title}"`
                  : "All guide articles"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <Button asChild>
                <Link to={sectionId ? `/admin/guides/sections/${sectionId}/new` : "/admin/guides/articles/new"}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Article
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No articles yet. Create your first article to help your users.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{article.title}</span>
                      <Badge variant={article.status === "published" ? "default" : "secondary"}>
                        {article.status === "published" ? (
                          <>
                            <Globe className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </Badge>
                      {article.visible_to_roles.length > 0 && (
                        <Badge variant="outline">
                          {article.visible_to_roles.join(", ")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {article.section && !sectionId && (
                        <span>{article.section.title}</span>
                      )}
                      <span>{article.view_count} views</span>
                      {article.published_at && (
                        <span>Published {format(new Date(article.published_at), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(article)}
                      title={article.status === "published" ? "Unpublish" : "Publish"}
                    >
                      {article.status === "published" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/guides/articles/${article.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingArticle(article);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingArticle?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

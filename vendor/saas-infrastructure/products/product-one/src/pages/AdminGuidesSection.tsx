import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GuideArticlesList } from "@/components/admin/guides/GuideArticlesList";
import { useGuideSections } from "@/hooks/useGuides";
import { ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function AdminGuidesSection() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { sections, loading } = useGuideSections();
  const section = sections.find(s => s.id === sectionId);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/guides">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{section?.title || "Section"}</h1>
          <p className="text-muted-foreground">
            {section?.description || "Manage articles in this section"}
          </p>
        </div>
      </div>

      <GuideArticlesList />
    </div>
  );
}

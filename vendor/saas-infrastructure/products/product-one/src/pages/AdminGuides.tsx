import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GuideSectionsList } from "@/components/admin/guides/GuideSectionsList";
import { GuideArticlesList } from "@/components/admin/guides/GuideArticlesList";
import { GuideRolesList } from "@/components/admin/guides/GuideRolesList";
import { ExportGuidesPdf } from "@/components/admin/guides/ExportGuidesPdf";
import { BookOpen, FileText, Users } from "lucide-react";

export default function AdminGuides() {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Guides</h1>
          <p className="text-muted-foreground">
            Create and manage help documentation organized by user roles
          </p>
        </div>
        <ExportGuidesPdf />
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Articles
          </TabsTrigger>
        </TabsList>
        <TabsContent value="roles">
          <GuideRolesList />
        </TabsContent>
        <TabsContent value="sections">
          <GuideSectionsList />
        </TabsContent>
        <TabsContent value="articles">
          <GuideArticlesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

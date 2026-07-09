import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogPostsList } from "@/components/admin/blog/BlogPostsList";
import { BlogCategories } from "@/components/admin/blog/BlogCategories";
import { BlogTags } from "@/components/admin/blog/BlogTags";
import { FileText, FolderOpen, Tag } from "lucide-react";

export default function AdminBlog() {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">
            Create and manage your blog content
          </p>
        </div>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts" className="gap-2">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <BlogPostsList />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <BlogCategories />
        </TabsContent>

        <TabsContent value="tags" className="mt-6">
          <BlogTags />
        </TabsContent>
      </Tabs>
    </div>
  );
}

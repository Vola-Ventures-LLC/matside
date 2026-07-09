import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  X,
  Image as ImageIcon,
  Settings,
  FileText,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  category_id: string;
  status: "draft" | "published" | "scheduled";
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  is_featured: boolean;
}

export function BlogPostEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image_url: "",
    category_id: "",
    status: "draft",
    meta_title: "",
    meta_description: "",
    og_image_url: "",
    is_featured: false,
  });

  const fetchCategoriesAndTags = useCallback(async () => {
    const [categoriesRes, tagsRes] = await Promise.all([
      supabase
        .from("blog_categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name"),
      supabase.from("blog_tags").select("id, name, slug").order("name"),
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (tagsRes.data) setTags(tagsRes.data);
  }, []);

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !post) {
      toast({ variant: "destructive", title: "Post not found" });
      navigate("/admin/blog");
      return;
    }

    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      featured_image_url: post.featured_image_url || "",
      category_id: post.category_id || "",
      status: post.status as "draft" | "published" | "scheduled",
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      og_image_url: post.og_image_url || "",
      is_featured: post.is_featured,
    });

    // Fetch post tags
    const { data: postTags } = await supabase
      .from("blog_post_tags")
      .select("tag_id")
      .eq("post_id", id);

    if (postTags) {
      setSelectedTags(postTags.map((pt) => pt.tag_id));
    }

    setIsLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    fetchCategoriesAndTags();
    if (isEditing) {
      fetchPost();
    }
  }, [fetchCategoriesAndTags, isEditing, fetchPost]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: isEditing ? formData.slug : generateSlug(title),
    });
  };

  const calculateReadingTime = (content: string) => {
    const text = content.replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).length;
    return Math.ceil(words / 200);
  };

  const handleSave = async (publish = false) => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast({
        variant: "destructive",
        title: "Title, slug, and content are required",
      });
      return;
    }

    setIsSaving(true);

    const postData = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt || null,
      content: formData.content,
      featured_image_url: formData.featured_image_url || null,
      category_id: formData.category_id || null,
      status: publish ? "published" : formData.status,
      meta_title: formData.meta_title || null,
      meta_description: formData.meta_description || null,
      og_image_url: formData.og_image_url || null,
      is_featured: formData.is_featured,
      reading_time_minutes: calculateReadingTime(formData.content),
      published_at: publish ? new Date().toISOString() : null,
      author_id: user?.id,
    };

    let postId = id;

    if (isEditing) {
      const { error } = await supabase
        .from("blog_posts")
        .update(postData)
        .eq("id", id);

      if (error) {
        toast({ variant: "destructive", title: "Failed to update post" });
        setIsSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(postData)
        .select("id")
        .single();

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Failed to create post",
          description: error?.message,
        });
        setIsSaving(false);
        return;
      }
      postId = data.id;
    }

    // Update tags
    if (postId) {
      await supabase.from("blog_post_tags").delete().eq("post_id", postId);

      if (selectedTags.length > 0) {
        await supabase.from("blog_post_tags").insert(
          selectedTags.map((tagId) => ({
            post_id: postId,
            tag_id: tagId,
          }))
        );
      }
    }

    toast({ title: publish ? "Post published!" : "Post saved" });
    setIsSaving(false);

    if (!isEditing && postId) {
      navigate(`/admin/blog/edit/${postId}`);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/blog")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edit Post" : "New Post"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Update your blog post" : "Create a new blog post"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSaving}>
            <Send className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Post title"
                  className="text-lg"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="post-slug"
                />
              </div>
              <div>
                <Label>Excerpt</Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  placeholder="Brief summary of the post"
                  rows={3}
                />
              </div>
              <div>
                <Label>Content</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Tabs defaultValue="settings">
            <TabsList className="w-full">
              <TabsTrigger value="settings" className="flex-1">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                SEO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="mt-4 space-y-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <Label>Featured Image URL</Label>
                    <Input
                      value={formData.featured_image_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          featured_image_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                    {formData.featured_image_url && (
                      <img
                        src={formData.featured_image_url}
                        alt="Featured"
                        className="mt-2 w-full rounded-lg object-cover h-32"
                      />
                    )}
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={
                            selectedTags.includes(tag.id)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => toggleTag(tag.id)}
                        >
                          {tag.name}
                          {selectedTags.includes(tag.id) && (
                            <X className="ml-1 h-3 w-3" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Featured Post</Label>
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_featured: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SEO Settings</CardTitle>
                  <CardDescription>
                    Optimize for search engines
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Meta Title</Label>
                    <Input
                      value={formData.meta_title}
                      onChange={(e) =>
                        setFormData({ ...formData, meta_title: e.target.value })
                      }
                      placeholder="SEO title (defaults to post title)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.meta_title.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <Label>Meta Description</Label>
                    <Textarea
                      value={formData.meta_description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          meta_description: e.target.value,
                        })
                      }
                      placeholder="SEO description"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.meta_description.length}/160 characters
                    </p>
                  </div>

                  <div>
                    <Label>OG Image URL</Label>
                    <Input
                      value={formData.og_image_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          og_image_url: e.target.value,
                        })
                      }
                      placeholder="Social share image URL"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

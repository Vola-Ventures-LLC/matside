import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useGuideSections, useGuideArticles, GuideArticle } from "@/hooks/useGuides";
import { useGuideRoles } from "@/hooks/useGuideRoles";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import { ArrowLeft, Save, Eye, Globe, Lock, Paperclip, X, PanelRightOpen, PanelRightClose } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { sanitizeRichContent } from "@/lib/sanitize";

interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

export function GuideArticleEditor() {
  const { articleId, sectionId } = useParams<{ articleId?: string; sectionId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sections } = useGuideSections();
  const { roles } = useGuideRoles();
  const { createArticle, updateArticle } = useGuideArticles();
  const { toast } = useToast();

  const [loading, setLoading] = useState(!!articleId);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    section_id: sectionId || "",
    status: "draft" as "draft" | "published",
    visible_to_roles: [] as string[],
    attachments: [] as Attachment[],
  });

  const loadArticle = useCallback(async () => {
    const { data, error } = await supabase
      .from("guide_articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (error) {
      toast({ title: "Error loading article", description: error.message, variant: "destructive" });
      navigate("/admin/guides");
      return;
    }

    setFormData({
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || "",
      section_id: data.section_id,
      status: data.status as "draft" | "published",
      visible_to_roles: data.visible_to_roles || [],
      attachments: (Array.isArray(data.attachments) ? data.attachments as unknown as Attachment[] : []),
    });
    setLoading(false);
  }, [articleId, toast, navigate]);

  useEffect(() => {
    if (articleId) {
      loadArticle();
    }
  }, [articleId, loadArticle]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSave = async (publish = false) => {
    if (!formData.title || !formData.slug || !formData.section_id) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    const status = publish ? "published" : formData.status;
    const articleData = {
      ...formData,
      status,
      published_at: publish ? new Date().toISOString() : undefined,
      author_id: user?.id,
    };

    let success;
    if (articleId) {
      success = await updateArticle(articleId, articleData);
    } else {
      const result = await createArticle(articleData);
      success = !!result;
    }

    setSaving(false);
    if (success) {
      toast({ title: publish ? "Article published!" : "Article saved" });
      navigate(sectionId ? `/admin/guides/sections/${sectionId}` : "/admin/guides");
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${articleId || 'new'}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('guide-attachments')
      .upload(filePath, file);

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('guide-attachments')
      .getPublicUrl(data.path);

    const newAttachment: Attachment = {
      name: file.name,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
    };

    setFormData({
      ...formData,
      attachments: [...formData.attachments, newAttachment],
    });
    
    setUploading(false);
    toast({ title: "Attachment uploaded" });
    
    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {articleId ? "Edit Article" : "New Article"}
            </h1>
            <p className="text-muted-foreground">
              {articleId ? "Update article content and settings" : "Create a new help article"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={formData.status === "published" ? "default" : "secondary"}>
            {formData.status === "published" ? (
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <><PanelRightClose className="h-4 w-4 mr-2" />Hide Preview</>
            ) : (
              <><PanelRightOpen className="h-4 w-4 mr-2" />Preview</>
            )}
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Eye className="h-4 w-4 mr-2" />
            {formData.status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
        <div className={`${showPreview ? '' : 'lg:col-span-2'} space-y-6`}>
          {/* Title & Slug */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData({
                      ...formData,
                      title,
                      slug: articleId ? formData.slug : generateSlug(title),
                    });
                  }}
                  placeholder="How to get started"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="how-to-get-started"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description for search results..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
              />
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded border bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{attachment.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(attachment.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {uploading ? "Uploading..." : "Add PDFs, documents, or other files for users to download."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Preview */}
        {showPreview ? (
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <article>
                    <h1 className="text-2xl font-bold mb-2">{formData.title || "Untitled"}</h1>
                    {formData.excerpt && (
                      <p className="text-muted-foreground mb-4">{formData.excerpt}</p>
                    )}
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_p]:mb-4 [&_p:last-child]:mb-0"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichContent(formData.content || "<p class='text-muted-foreground italic'>Start writing to see preview...</p>") }}
                    />
                    {formData.attachments.length > 0 && (
                      <div className="mt-6 p-3 rounded-lg border bg-muted/50">
                        <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm">
                          <Paperclip className="h-4 w-4" />
                          Attachments
                        </h3>
                        <div className="space-y-1">
                          {formData.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <Paperclip className="h-3 w-3 text-muted-foreground" />
                              <span>{attachment.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section *</Label>
                  <Select
                    value={formData.section_id}
                    onValueChange={(v) => setFormData({ ...formData, section_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visible to Roles</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select which roles can see this article. If none selected, visible to everyone.
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {roles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No roles defined yet.</p>
                    ) : (
                      roles.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.slug}`}
                            checked={formData.visible_to_roles.includes(role.slug)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  visible_to_roles: [...formData.visible_to_roles, role.slug],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  visible_to_roles: formData.visible_to_roles.filter(r => r !== role.slug),
                                });
                              }
                            }}
                          />
                          <label
                            htmlFor={`role-${role.slug}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {role.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {formData.visible_to_roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.visible_to_roles.map((r) => (
                        <Badge key={r} variant="secondary" className="text-xs">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

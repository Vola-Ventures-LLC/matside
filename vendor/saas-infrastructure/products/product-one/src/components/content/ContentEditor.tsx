import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import { ContentItem, ContentType, ContentStatus, Platform } from "@/hooks/useContentPlanner";
import { format } from "date-fns";
import { CalendarIcon, Save, Send, ArrowLeft, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentEditorProps {
  item?: ContentItem | null;
  onSave: (data: Partial<ContentItem>) => void;
  onBack: () => void;
  onAIAssist: (action: "brainstorm" | "draft" | "refine", data: any) => void;
  isAILoading?: boolean;
}

const contentTypes: { value: ContentType; label: string }[] = [
  { value: "blog_post", label: "Blog Post" },
  { value: "social_media", label: "Social Media" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "marketing_copy", label: "Marketing Copy" },
];

const platforms: { value: Platform; label: string }[] = [
  { value: "instagram", label: "📷 Instagram" },
  { value: "facebook", label: "📘 Facebook" },
  { value: "twitter", label: "🐦 Twitter" },
  { value: "linkedin", label: "💼 LinkedIn" },
  { value: "email", label: "📧 Email" },
  { value: "website", label: "🌐 Website" },
];

const statuses: { value: ContentStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "In Review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
];

export function ContentEditor({ item, onSave, onBack, onAIAssist, isAILoading }: ContentEditorProps) {
  const [formData, setFormData] = useState<Partial<ContentItem>>({
    title: "",
    content: "",
    excerpt: "",
    content_type: "blog_post",
    platform: null,
    status: "draft",
    scheduled_for: null,
  });
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();

  useEffect(() => {
    if (item) {
      setFormData(item);
      if (item.scheduled_for) {
        setScheduledDate(new Date(item.scheduled_for));
      }
    }
  }, [item]);

  const handleSave = (publish = false) => {
    const data = {
      ...formData,
      status: publish ? "scheduled" : formData.status,
      scheduled_for: scheduledDate?.toISOString() || null,
    };
    onSave(data);
  };

  const showPlatformSelector = formData.content_type === "social_media";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{item ? "Edit Content" : "New Content"}</h1>
            <p className="text-muted-foreground">Create and schedule your content</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)}>
            <Send className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter a compelling title"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onAIAssist("brainstorm", { topic: formData.title })}
                    disabled={isAILoading}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Excerpt / Summary</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={formData.excerpt || ""}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief summary for previews"
                    rows={2}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Content</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAIAssist("draft", {
                        topic: formData.title,
                        content_type: formData.content_type,
                        platform: formData.platform,
                      })}
                      disabled={isAILoading || !formData.title}
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Draft
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAIAssist("refine", {
                        existing_content: formData.content,
                        content_type: formData.content_type,
                        platform: formData.platform,
                      })}
                      disabled={isAILoading || !formData.content}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Refine
                    </Button>
                  </div>
                </div>
                {formData.content_type === "blog_post" ? (
                  <RichTextEditor
                    content={formData.content || ""}
                    onChange={(content) => setFormData({ ...formData, content })}
                  />
                ) : (
                  <Textarea
                    value={formData.content || ""}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your content here..."
                    rows={10}
                    className="font-mono"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value) => setFormData({ ...formData, content_type: value as ContentType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showPlatformSelector && (
                <div>
                  <Label>Platform</Label>
                  <Select
                    value={formData.platform || ""}
                    onValueChange={(value) => setFormData({ ...formData, platform: value as Platform })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.value!} value={platform.value!}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as ContentStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Schedule For</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

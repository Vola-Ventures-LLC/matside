import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import { toast } from "@/hooks/use-toast";
import { sanitizeEmailPreview } from "@/lib/sanitize";
import {
  Mail,
  MessageSquare,
  Edit,
  Eye,
  Save,
  X,
  FileText,
  Code,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

type DomainCategory = "transactional" | "support" | "outbound" | "marketing" | "notifications" | "billing";

interface MessageTemplate {
  id: string;
  name: string;
  type: "email" | "sms";
  subject: string | null;
  body: string;
  description: string | null;
  variables: string[];
  is_active: boolean;
  domain_category: DomainCategory | null;
  created_at: string;
  updated_at: string;
}

const domainCategoryConfig: Record<DomainCategory, { label: string; color: string }> = {
  transactional: { label: "Transactional", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  support: { label: "Support", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  outbound: { label: "Outbound", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  marketing: { label: "Marketing", color: "bg-pink-500/10 text-pink-600 border-pink-200" },
  notifications: { label: "Notifications", color: "bg-cyan-500/10 text-cyan-600 border-cyan-200" },
  billing: { label: "Billing", color: "bg-green-500/10 text-green-600 border-green-200" },
};

interface EmailBrandingData {
  header_html: string;
  footer_html: string;
  logo_url: string | null;
  background_color: string;
  text_color: string;
}

function TemplatePreview({ 
  template, 
  type,
  branding 
}: { 
  template: MessageTemplate; 
  type: "email" | "sms";
  branding?: EmailBrandingData | null;
}) {
  // Replace variables with sample data for preview
  const sampleData: Record<string, string> = {
    user_name: "John Doe",
    app_name: "Your App",
    dashboard_url: "https://yourapp.com/dashboard",
    reset_url: "https://yourapp.com/reset?token=abc123",
    verification_url: "https://yourapp.com/verify?token=xyz789",
    magic_link_url: "https://yourapp.com/auth?token=magic123",
    expiry_time: "1 hour",
    code: "123456",
    logo_url: branding?.logo_url || "/placeholder.svg",
    year: new Date().getFullYear().toString(),
    unsubscribe_url: "#",
    privacy_url: "#",
  };

  const replaceVariables = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleData[key] || `{{${key}}}`);
  };

  if (type === "sms") {
    return (
      <div className="bg-muted rounded-lg p-4">
        <div className="max-w-[280px] mx-auto">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-bl-md p-3 text-sm">
            {replaceVariables(template.body)}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">SMS Preview</p>
        </div>
      </div>
    );
  }

  // Build full email with branding
  const bodyContent = replaceVariables(template.body);
  const headerHtml = branding?.header_html ? replaceVariables(branding.header_html) : "";
  const footerHtml = branding?.footer_html ? replaceVariables(branding.footer_html) : "";

  const fullEmail = branding ? `
    <div style="background-color: ${branding.background_color}; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        ${headerHtml}
        <div style="padding: 24px; color: ${branding.text_color};">
          ${bodyContent}
        </div>
        ${footerHtml}
      </div>
    </div>
  ` : bodyContent;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b">
        <p className="text-sm font-medium">Subject: {replaceVariables(template.subject || "")}</p>
      </div>
      <div 
        className={branding ? "" : "p-4 bg-background prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_p]:mb-4 [&_p:last-child]:mb-0"}
        dangerouslySetInnerHTML={{ __html: sanitizeEmailPreview(fullEmail) }}
      />
    </div>
  );
}

function TemplateEditor({ 
  template, 
  onSave, 
  onCancel,
  isSaving,
  branding,
}: { 
  template: MessageTemplate; 
  onSave: (data: Partial<MessageTemplate>) => void;
  onCancel: () => void;
  isSaving: boolean;
  branding?: EmailBrandingData | null;
}) {
  const [subject, setSubject] = useState(template.subject || "");
  const [body, setBody] = useState(template.body);
  const [isActive, setIsActive] = useState(template.is_active);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");

  const handleSave = () => {
    onSave({
      subject: template.type === "email" ? subject : null,
      body,
      is_active: isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={template.type === "email" ? "default" : "secondary"}>
            {template.type === "email" ? <Mail className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
            {template.type.toUpperCase()}
          </Badge>
          <span className="text-sm text-muted-foreground">{template.description}</span>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="active" className="text-sm">Active</Label>
          <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      {/* Available Variables */}
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">Available Variables:</p>
        <div className="flex flex-wrap gap-1">
          {template.variables.map((variable) => (
            <code key={variable} className="text-xs bg-background px-2 py-1 rounded border">
              {`{{${variable}}}`}
            </code>
          ))}
        </div>
      </div>

      <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "edit" | "preview")}>
        <TabsList>
          <TabsTrigger value="edit" className="gap-1">
            <Code className="h-4 w-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4 mt-4">
          {template.type === "email" && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>
              {template.type === "email" ? "Email Body" : "Message Body"}
            </Label>
            {template.type === "email" ? (
              <RichTextEditor
                content={body}
                onChange={setBody}
              />
            ) : (
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="SMS message..."
                className="min-h-[150px] font-mono text-sm"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <TemplatePreview 
            template={{ ...template, subject, body }} 
            type={template.type}
            branding={branding}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function TemplateCard({ 
  template, 
  onEdit 
}: { 
  template: MessageTemplate; 
  onEdit: () => void;
}) {
  const Icon = template.type === "email" ? Mail : MessageSquare;
  const displayName = template.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const categoryConfig = template.domain_category ? domainCategoryConfig[template.domain_category] : null;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
          template.type === "email" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
        }`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">{displayName}</p>
            {categoryConfig && (
              <Badge variant="outline" className={`text-xs ${categoryConfig.color}`}>
                {categoryConfig.label}
              </Badge>
            )}
            {!template.is_active && (
              <Badge variant="outline" className="text-xs">Inactive</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground max-w-md">{template.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Updated {format(new Date(template.updated_at), "MMM d, yyyy")}
        </span>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>
    </div>
  );
}

export function MessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | DomainCategory>("all");
  const [branding, setBranding] = useState<EmailBrandingData | null>(null);
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchTemplates();
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    const { data } = await supabase
      .from("email_branding")
      .select("header_html, footer_html, logo_url, background_color, text_color")
      .eq("name", "default")
      .single();
    
    if (data) {
      setBranding(data as EmailBrandingData);
    }
  };

  const fetchTemplates = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("message_templates")
      .select("*")
      .order("domain_category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to fetch templates:", error);
      toast({
        variant: "destructive",
        title: "Failed to load templates",
        description: error.message,
      });
    } else {
      // Parse variables from JSON
      const parsedTemplates = (data || []).map((t) => ({
        ...t,
        type: t.type as "email" | "sms",
        variables: Array.isArray(t.variables) ? t.variables : JSON.parse(t.variables as string || "[]"),
      }));
      setTemplates(parsedTemplates);
    }

    setIsLoading(false);
  };

  const handleSave = async (data: Partial<MessageTemplate>) => {
    if (!selectedTemplate) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("message_templates")
      .update({
        subject: data.subject,
        body: data.body,
        is_active: data.is_active,
      })
      .eq("id", selectedTemplate.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to save template",
        description: error.message,
      });
    } else {
      toast({
        title: "Template saved",
        description: "Your changes have been saved successfully.",
      });

      // Log the action
      logAction({
        action: "EDIT_TEMPLATE",
        details: { 
          template_name: selectedTemplate.name,
          template_type: selectedTemplate.type,
        },
      });

      setSelectedTemplate(null);
      fetchTemplates();
    }

    setIsSaving(false);
  };

  const filteredTemplates = templates.filter((t) => 
    categoryFilter === "all" || t.domain_category === categoryFilter
  );

  // Group templates by domain category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.domain_category || "transactional";
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<DomainCategory, MessageTemplate[]>);

  const categoryOrder: DomainCategory[] = ["transactional", "support", "billing", "notifications", "marketing", "outbound"];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription>
              System emails grouped by sending domain. Each template shows when it triggers.
            </CardDescription>
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as "all" | DomainCategory)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchTemplates}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Loading templates..." />
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No templates found"
              description="Message templates will appear here"
            />
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {categoryOrder.map((category) => {
                  const categoryTemplates = groupedTemplates[category];
                  if (!categoryTemplates || categoryTemplates.length === 0) return null;
                  
                  const config = domainCategoryConfig[category];
                  
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded flex items-center justify-center ${config.color}`}>
                          <Mail className="h-3 w-3" />
                        </div>
                        <h3 className="font-medium text-sm">{config.label}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {categoryTemplates.length} template{categoryTemplates.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {categoryTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            onEdit={() => setSelectedTemplate(template)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <Sheet open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Edit Template: {selectedTemplate?.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </SheetTitle>
            <SheetDescription>
              Customize the content and settings for this template
            </SheetDescription>
          </SheetHeader>
          {selectedTemplate && (
            <div className="py-4">
              <TemplateEditor
                template={selectedTemplate}
                onSave={handleSave}
                onCancel={() => setSelectedTemplate(null)}
                isSaving={isSaving}
                branding={branding}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

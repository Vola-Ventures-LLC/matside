import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useSupabase } from "@saas-infra/auth/provider";
import { useAuditLog } from "@saas-infra/admin-kit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@saas-infra/ui/card";
import { Button } from "@saas-infra/ui/button";
import { Input } from "@saas-infra/ui/input";
import { Label } from "@saas-infra/ui/label";
import { Textarea } from "@saas-infra/ui/textarea";
import { Badge } from "@saas-infra/ui/badge";
import { Switch } from "@saas-infra/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@saas-infra/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@saas-infra/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@saas-infra/ui/select";
import { ScrollArea } from "@saas-infra/ui/scroll-area";
import { sanitizeEmailPreview } from "@saas-infra/utils";
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

export type DomainCategory = "transactional" | "support" | "outbound" | "marketing" | "notifications" | "billing";

export interface MessageTemplate {
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

export interface MessageTemplatesProps {
  /** Render a rich text editor for email body editing. Receives content and onChange callback. */
  renderEditor?: (props: { content: string; onChange: (html: string) => void }) => ReactNode;
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}

interface EmailBrandingData {
  header_html: string;
  footer_html: string;
  logo_url: string | null;
  background_color: string;
  text_color: string;
}

const domainCategoryConfig: Record<DomainCategory, { label: string; color: string }> = {
  transactional: { label: "Transactional", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  support: { label: "Support", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  outbound: { label: "Outbound", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  marketing: { label: "Marketing", color: "bg-pink-500/10 text-pink-600 border-pink-200" },
  notifications: { label: "Notifications", color: "bg-cyan-500/10 text-cyan-600 border-cyan-200" },
  billing: { label: "Billing", color: "bg-green-500/10 text-green-600 border-green-200" },
};

function TemplatePreview({
  template,
  type,
  branding,
}: {
  template: MessageTemplate;
  type: "email" | "sms";
  branding?: EmailBrandingData | null;
}) {
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
        className={branding ? "" : "p-4 bg-background prose prose-sm max-w-none"}
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
  renderEditor,
}: {
  template: MessageTemplate;
  onSave: (data: Partial<MessageTemplate>) => void;
  onCancel: () => void;
  isSaving: boolean;
  branding?: EmailBrandingData | null;
  renderEditor?: MessageTemplatesProps["renderEditor"];
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
            {template.type === "email" && renderEditor ? (
              renderEditor({ content: body, onChange: setBody })
            ) : (
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={template.type === "email" ? "Email HTML body..." : "SMS message..."}
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
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
  onEdit,
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

export function MessageTemplates({ renderEditor, onError, onSuccess }: MessageTemplatesProps) {
  const supabase = useSupabase();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | DomainCategory>("all");
  const [branding, setBranding] = useState<EmailBrandingData | null>(null);
  const { logAction } = useAuditLog();

  const fetchBranding = useCallback(async () => {
    const { data } = await supabase
      .from("email_branding")
      .select("header_html, footer_html, logo_url, background_color, text_color")
      .eq("name", "default")
      .single();

    if (data) {
      setBranding(data as EmailBrandingData);
    }
  }, [supabase]);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("message_templates")
      .select("*")
      .order("domain_category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to fetch templates:", error);
      onError?.("Failed to load templates", error.message);
    } else {
      const parsedTemplates = (data || []).map((t) => ({
        ...t,
        type: t.type as "email" | "sms",
        variables: Array.isArray(t.variables) ? t.variables : JSON.parse(t.variables as string || "[]"),
      }));
      setTemplates(parsedTemplates);
    }

    setIsLoading(false);
  }, [supabase, onError]);

  useEffect(() => {
    fetchTemplates();
    fetchBranding();
  }, [fetchTemplates, fetchBranding]);

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
      onError?.("Failed to save template", error.message);
    } else {
      onSuccess?.("Template saved", "Your changes have been saved successfully.");
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No templates found</p>
              <p className="text-sm">Message templates will appear here</p>
            </div>
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
                renderEditor={renderEditor}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

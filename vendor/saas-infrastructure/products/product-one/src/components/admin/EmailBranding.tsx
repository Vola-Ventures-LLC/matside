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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "@/hooks/use-toast";
import { Save, Eye, Code, Palette, RefreshCw } from "lucide-react";
import { sanitizeEmailPreview } from "@/lib/sanitize";

interface EmailBranding {
  id: string;
  name: string;
  header_html: string;
  footer_html: string;
  logo_url: string | null;
  primary_color: string;
  background_color: string;
  text_color: string;
  link_color: string;
  is_active: boolean;
}

const defaultSampleBody = `
<h2 style="margin: 0 0 16px 0; color: #1f2937;">Welcome to Our Platform!</h2>
<p style="margin: 0 0 16px 0; color: #4b5563;">Hello {{user_name}},</p>
<p style="margin: 0 0 16px 0; color: #4b5563;">Thank you for joining us. We're excited to have you on board.</p>
<p style="margin: 0; color: #4b5563;">Best regards,<br/>The Team</p>
`;

function BrandingPreview({ branding, sampleBody }: { branding: EmailBranding; sampleBody: string }) {
  const replaceVariables = (html: string) => {
    return html
      .replace(/\{\{logo_url\}\}/g, branding.logo_url || "/placeholder.svg")
      .replace(/\{\{app_name\}\}/g, "Your App")
      .replace(/\{\{year\}\}/g, new Date().getFullYear().toString())
      .replace(/\{\{unsubscribe_url\}\}/g, "#")
      .replace(/\{\{privacy_url\}\}/g, "#")
      .replace(/\{\{user_name\}\}/g, "John Doe");
  };

  const fullEmail = `
    <div style="background-color: ${branding.background_color}; padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        ${replaceVariables(branding.header_html)}
        <div style="padding: 32px; color: ${branding.text_color};">
          ${replaceVariables(sampleBody)}
        </div>
        ${replaceVariables(branding.footer_html)}
      </div>
    </div>
  `;

  return (
    <div className="border rounded-lg overflow-hidden bg-muted">
      <div className="bg-muted px-4 py-2 border-b flex items-center gap-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Email Preview</span>
      </div>
      <div 
        className="bg-white"
        dangerouslySetInnerHTML={{ __html: sanitizeEmailPreview(fullEmail) }}
      />
    </div>
  );
}

export function EmailBranding() {
  const { logAction } = useAuditLog();
  const [branding, setBranding] = useState<EmailBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"header" | "footer" | "colors">("header");

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    const { data, error } = await supabase
      .from("email_branding")
      .select("*")
      .eq("name", "default")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching branding:", error);
    } else if (data) {
      setBranding(data as EmailBranding);
    } else {
      // Create default if doesn't exist
      const { data: newData } = await supabase
        .from("email_branding")
        .insert({ name: "default" })
        .select()
        .single();
      if (newData) setBranding(newData as EmailBranding);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!branding) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("email_branding")
      .update({
        header_html: branding.header_html,
        footer_html: branding.footer_html,
        logo_url: branding.logo_url,
        primary_color: branding.primary_color,
        background_color: branding.background_color,
        text_color: branding.text_color,
        link_color: branding.link_color,
      })
      .eq("id", branding.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Email branding updated successfully" });
      logAction({ action: "UPDATE_EMAIL_BRANDING", details: { brandingId: branding.id } });
    }
    setIsSaving(false);
  };

  const updateField = <K extends keyof EmailBranding>(field: K, value: EmailBranding[K]) => {
    if (branding) {
      setBranding({ ...branding, [field]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!branding) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Unable to load email branding settings.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Editor Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Email Branding
          </CardTitle>
          <CardDescription>
            Configure header, footer, and colors for all outgoing emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="w-full">
              <TabsTrigger value="header" className="flex-1">Header</TabsTrigger>
              <TabsTrigger value="footer" className="flex-1">Footer</TabsTrigger>
              <TabsTrigger value="colors" className="flex-1">Colors</TabsTrigger>
            </TabsList>

            <TabsContent value="header" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={branding.logo_url || ""}
                  onChange={(e) => updateField("logo_url", e.target.value)}
                  placeholder="https://yourapp.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">{"{{logo_url}}"}</code> in header HTML to reference this
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="header_html">Header HTML</Label>
                <Textarea
                  id="header_html"
                  value={branding.header_html}
                  onChange={(e) => updateField("header_html", e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="<div>Your header HTML...</div>"
                />
                <p className="text-xs text-muted-foreground">
                  Available: <code className="bg-muted px-1 rounded">{"{{logo_url}}"}</code> <code className="bg-muted px-1 rounded">{"{{app_name}}"}</code>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="footer" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="footer_html">Footer HTML</Label>
                <Textarea
                  id="footer_html"
                  value={branding.footer_html}
                  onChange={(e) => updateField("footer_html", e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder="<div>Your footer HTML...</div>"
                />
                <p className="text-xs text-muted-foreground">
                  Available: <code className="bg-muted px-1 rounded">{"{{year}}"}</code> <code className="bg-muted px-1 rounded">{"{{app_name}}"}</code> <code className="bg-muted px-1 rounded">{"{{unsubscribe_url}}"}</code> <code className="bg-muted px-1 rounded">{"{{privacy_url}}"}</code>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="primary_color"
                      value={branding.primary_color}
                      onChange={(e) => updateField("primary_color", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={branding.primary_color}
                      onChange={(e) => updateField("primary_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background_color">Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="background_color"
                      value={branding.background_color}
                      onChange={(e) => updateField("background_color", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={branding.background_color}
                      onChange={(e) => updateField("background_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text_color">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="text_color"
                      value={branding.text_color}
                      onChange={(e) => updateField("text_color", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={branding.text_color}
                      onChange={(e) => updateField("text_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link_color">Link Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="link_color"
                      value={branding.link_color}
                      onChange={(e) => updateField("link_color", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={branding.link_color}
                      onChange={(e) => updateField("link_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <div className="space-y-4">
        <BrandingPreview branding={branding} sampleBody={defaultSampleBody} />
        <p className="text-xs text-muted-foreground text-center">
          This preview shows how your branded emails will appear to recipients
        </p>
      </div>
    </div>
  );
}

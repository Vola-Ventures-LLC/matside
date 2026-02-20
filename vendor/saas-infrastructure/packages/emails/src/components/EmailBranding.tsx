import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@saas-infra/auth/provider";
import { useAuditLog } from "@saas-infra/admin-kit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saas-infra/ui/card";
import { Button } from "@saas-infra/ui/button";
import { Input } from "@saas-infra/ui/input";
import { Label } from "@saas-infra/ui/label";
import { Textarea } from "@saas-infra/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@saas-infra/ui/tabs";
import { Save, Eye, Palette, RefreshCw } from "lucide-react";
import { sanitizeEmailPreview } from "@saas-infra/utils";

interface EmailBrandingData {
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

export interface EmailBrandingProps {
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}

const defaultSampleBody = `
<h2 style="margin: 0 0 16px 0; color: #1f2937;">Welcome to Our Platform!</h2>
<p style="margin: 0 0 16px 0; color: #4b5563;">Hello {{user_name}},</p>
<p style="margin: 0 0 16px 0; color: #4b5563;">Thank you for joining us. We're excited to have you on board.</p>
<p style="margin: 0; color: #4b5563;">Best regards,<br/>The Team</p>
`;

function BrandingPreview({ branding, sampleBody }: { branding: EmailBrandingData; sampleBody: string }) {
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

export function EmailBranding({ onError, onSuccess }: EmailBrandingProps) {
  const supabase = useSupabase();
  const { logAction } = useAuditLog();
  const [branding, setBranding] = useState<EmailBrandingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"header" | "footer" | "colors">("header");

  const fetchBranding = useCallback(async () => {
    const { data, error } = await supabase
      .from("email_branding")
      .select("*")
      .eq("name", "default")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching branding:", error);
    } else if (data) {
      setBranding(data as EmailBrandingData);
    } else {
      const { data: newData } = await supabase
        .from("email_branding")
        .insert({ name: "default" })
        .select()
        .single();
      if (newData) setBranding(newData as EmailBrandingData);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

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
      onError?.("Error", error.message);
    } else {
      onSuccess?.("Saved", "Email branding updated successfully");
      logAction({ action: "UPDATE_EMAIL_BRANDING", details: { brandingId: branding.id } });
    }
    setIsSaving(false);
  };

  const updateField = <K extends keyof EmailBrandingData>(field: K, value: EmailBrandingData[K]) => {
    if (branding) {
      setBranding({ ...branding, [field]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                {(["primary_color", "background_color", "text_color", "link_color"] as const).map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>{field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id={field}
                        value={branding[field]}
                        onChange={(e) => updateField(field, e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding[field]}
                        onChange={(e) => updateField(field, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
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

      <div className="space-y-4">
        <BrandingPreview branding={branding} sampleBody={defaultSampleBody} />
        <p className="text-xs text-muted-foreground text-center">
          This preview shows how your branded emails will appear to recipients
        </p>
      </div>
    </div>
  );
}

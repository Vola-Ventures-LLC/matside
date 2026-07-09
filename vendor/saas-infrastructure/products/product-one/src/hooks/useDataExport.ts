import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface UserDataExport {
  profile: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
    created_at: string;
    last_login_at: string | null;
  };
  email_preferences: {
    marketing_emails: boolean;
    unsubscribed_at: string | null;
  } | null;
  organizations: Array<{
    role: string;
    joined_at: string;
  }>;
  subscriptions: Array<{
    status: string;
    created_at: string;
  }>;
  support_conversations: Array<{
    category: string;
    status: string;
    created_at: string;
  }>;
  login_events: Array<{
    event_type: string;
    ip_address: string | null;
    created_at: string;
  }>;
  content_items: Array<{
    title: string;
    content_type: string;
    status: string;
    created_at: string;
  }>;
  milestones: Array<{
    milestone_key: string;
    completed_at: string;
  }>;
  exported_at: string;
}

export interface DataPreview {
  profile: boolean;
  email_preferences: boolean;
  organizations: number;
  subscriptions: number;
  support_conversations: number;
  login_events: number;
  content_items: number;
  milestones: number;
}

export function useDataExport() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<DataPreview | null>(null);

  const loadPreview = async (): Promise<DataPreview | null> => {
    if (!user) return null;
    
    setIsLoadingPreview(true);
    try {
      const orgRes = await supabase.from("organization_members").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const subRes = await supabase.from("user_subscriptions").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const convRes = await supabase.from("support_conversations").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const loginRes = await supabase.from("login_events").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const contentRes = await supabase.from("content_items").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const mileRes = await supabase.from("user_milestones").select("*", { count: "exact", head: true }).eq("user_id", user.id);

      const previewData: DataPreview = {
        profile: true,
        email_preferences: true,
        organizations: orgRes.count || 0,
        subscriptions: subRes.count || 0,
        support_conversations: convRes.count || 0,
        login_events: loginRes.count || 0,
        content_items: contentRes.count || 0,
        milestones: mileRes.count || 0,
      };

      setPreview(previewData);
      return previewData;
    } catch (error) {
      console.error("Failed to load data preview:", error);
      return null;
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const exportData = async (): Promise<UserDataExport | null> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not authenticated",
        description: "Please sign in to export your data.",
      });
      return null;
    }

    setIsExporting(true);

    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email, avatar_url, created_at, last_login_at")
        .eq("user_id", user.id)
        .single();

      // Fetch email preferences
      const { data: emailPrefs } = await supabase
        .from("email_preferences")
        .select("marketing_emails, unsubscribed_at")
        .eq("user_id", user.id)
        .single();

      // Fetch org memberships
      const { data: orgMemberships } = await supabase
        .from("organization_members")
        .select("role, created_at")
        .eq("user_id", user.id);

      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select("status, created_at")
        .eq("user_id", user.id);

      // Fetch support conversations (use correct column: category instead of subject)
      const { data: conversations } = await supabase
        .from("support_conversations")
        .select("category, status, created_at")
        .eq("user_id", user.id);

      // Fetch login events
      const { data: loginEvents } = await supabase
        .from("login_events")
        .select("event_type, ip_address, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      // Fetch content items
      const { data: contentItems } = await supabase
        .from("content_items")
        .select("title, content_type, status, created_at")
        .eq("user_id", user.id);

      // Fetch milestones (use correct column: completed_at instead of achieved_at)
      const { data: milestones } = await supabase
        .from("user_milestones")
        .select("milestone_key, completed_at")
        .eq("user_id", user.id);

      const exportResult: UserDataExport = {
        profile: {
          display_name: profile?.display_name || null,
          email: profile?.email || null,
          avatar_url: profile?.avatar_url || null,
          created_at: profile?.created_at || "",
          last_login_at: profile?.last_login_at || null,
        },
        email_preferences: emailPrefs ? {
          marketing_emails: emailPrefs.marketing_emails,
          unsubscribed_at: emailPrefs.unsubscribed_at,
        } : null,
        organizations: (orgMemberships || []).map((m) => ({
          role: m.role,
          joined_at: m.created_at,
        })),
        subscriptions: (subscriptions || []).map((s) => ({
          status: s.status,
          created_at: s.created_at,
        })),
        support_conversations: (conversations || []).map((c) => ({
          category: c.category,
          status: c.status,
          created_at: c.created_at,
        })),
        login_events: (loginEvents || []).map((e) => ({
          event_type: e.event_type,
          ip_address: e.ip_address,
          created_at: e.created_at,
        })),
        content_items: (contentItems || []).map((c) => ({
          title: c.title,
          content_type: c.content_type,
          status: c.status,
          created_at: c.created_at,
        })),
        milestones: (milestones || []).map((m) => ({
          milestone_key: m.milestone_key,
          completed_at: m.completed_at,
        })),
        exported_at: new Date().toISOString(),
      };

      // Trigger download
      const blob = new Blob([JSON.stringify(exportResult, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `my-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded as a JSON file.",
      });

      return exportResult;
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Could not export your data. Please try again.",
      });
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    loadPreview,
    preview,
    isExporting,
    isLoadingPreview,
  };
}

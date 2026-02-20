import { useCallback } from "react";
import { useSupabase } from "@saas-infra/auth/provider";
import { useAuth } from "@saas-infra/auth";

export type AuditAction =
  | "VIEW_USERS"
  | "DELETE_USER_ATTEMPT"
  | "DELETE_USER"
  | "BAN_USER_ATTEMPT"
  | "BAN_USER"
  | "UNBAN_USER"
  | "IMPERSONATE_USER"
  | "END_IMPERSONATION"
  | "DOWNLOAD_LOGO"
  | "DOWNLOAD_FAVICON"
  | "COPY_BRAND_COLOR"
  | "VIEW_AUDIT_LOGS"
  | "REFRESH_USER_LIST"
  | "EDIT_TEMPLATE"
  | "UPDATE_AFFILIATE_SETTINGS"
  | "CREATE_AFFILIATE_TIER"
  | "UPDATE_AFFILIATE_TIER"
  | "AFFILIATE_APPROVED"
  | "AFFILIATE_REJECTED"
  | "AFFILIATE_SUSPENDED"
  | "PAYOUT_COMPLETED"
  | "PAYOUT_FAILED"
  | "UPDATE_EMAIL_BRANDING"
  | "UPDATE_FEATURE_TOGGLE"
  | "VIEW_ORGANIZATIONS"
  | "REFRESH_ORG_LIST"
  | "UPDATE_ORG_MEMBER"
  | "REMOVE_ORG_MEMBER";

interface AuditLogParams {
  action: AuditAction;
  targetUserId?: string;
  details?: Record<string, string | number | boolean | null>;
}

export function useAuditLog() {
  const supabase = useSupabase();
  const { user } = useAuth();

  const logAction = useCallback(async ({ action, targetUserId, details }: AuditLogParams) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("admin_audit_logs").insert([{
        admin_user_id: user.id,
        action,
        target_user_id: targetUserId || null,
        details: (details as Record<string, unknown>) || null,
      }]);

      if (error) {
        console.error("Failed to log audit action:", error);
      }
    } catch (err) {
      console.error("Audit log error:", err);
    }
  }, [user, supabase]);

  return { logAction };
}

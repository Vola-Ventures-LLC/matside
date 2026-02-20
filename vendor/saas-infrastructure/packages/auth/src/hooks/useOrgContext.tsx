import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSupabase } from "../provider";
import { useAuth } from "./useAuth";

export interface OrgMembership {
  id: string;
  organization_id: string;
  role: string;
  can_manage_billing: boolean;
  can_manage_members: boolean;
  can_manage_content: boolean;
  can_view_analytics: boolean;
  is_owner: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

interface OrgContextType {
  // Current active context
  activeOrgId: string | null; // null = personal context
  activeOrg: OrgMembership | null;
  isPersonalContext: boolean;

  // User's org memberships
  memberships: OrgMembership[];
  isLoading: boolean;

  // Actions
  switchToOrg: (orgId: string | null) => void;
  refreshMemberships: () => Promise<void>;

  // Permission checks for active org
  canManageBilling: boolean;
  canManageMembers: boolean;
  canManageContent: boolean;
  canViewAnalytics: boolean;
  isOrgOwner: boolean;
}

const STORAGE_KEY = "active-org-id";

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children, orgsEnabled = false }: { children: ReactNode; orgsEnabled?: boolean }) {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMemberships = useCallback(async () => {
    if (!user || !orgsEnabled) {
      setMemberships([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        id,
        organization_id,
        role,
        can_manage_billing,
        can_manage_members,
        can_manage_content,
        can_view_analytics,
        is_owner,
        organization:organizations(id, name, slug)
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching org memberships:", error);
      setMemberships([]);
    } else {
      // Transform the data to match our interface
      const transformed = (data || []).map((m: any) => ({
        ...m,
        organization: Array.isArray(m.organization) ? m.organization[0] : m.organization,
      })).filter((m: any) => m.organization); // Filter out any with missing org data

      setMemberships(transformed);

      // Validate that activeOrgId is still valid
      if (activeOrgId && !transformed.some((m: any) => m.organization_id === activeOrgId)) {
        // User no longer has access to this org, reset to personal
        setActiveOrgId(null);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore localStorage errors (e.g., quota exceeded, private browsing)
        }
      }
    }

    setIsLoading(false);
  }, [user, orgsEnabled, activeOrgId, supabase]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const switchToOrg = useCallback((orgId: string | null) => {
    setActiveOrgId(orgId);
    try {
      if (orgId) {
        localStorage.setItem(STORAGE_KEY, orgId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore localStorage errors (e.g., quota exceeded, private browsing)
    }
  }, []);

  const activeOrg = activeOrgId
    ? memberships.find(m => m.organization_id === activeOrgId) || null
    : null;

  const isPersonalContext = activeOrgId === null;

  // Permission checks for active org context
  const canManageBilling = activeOrg?.can_manage_billing ?? false;
  const canManageMembers = activeOrg?.can_manage_members ?? false;
  const canManageContent = activeOrg?.can_manage_content ?? true;
  const canViewAnalytics = activeOrg?.can_view_analytics ?? false;
  const isOrgOwner = activeOrg?.is_owner ?? false;

  return (
    <OrgContext.Provider
      value={{
        activeOrgId,
        activeOrg,
        isPersonalContext,
        memberships,
        isLoading,
        switchToOrg,
        refreshMemberships: fetchMemberships,
        canManageBilling,
        canManageMembers,
        canManageContent,
        canViewAnalytics,
        isOrgOwner,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrgContext() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error("useOrgContext must be used within an OrgProvider");
  }
  return context;
}

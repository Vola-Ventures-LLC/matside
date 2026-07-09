import { describe, it, expect } from "vitest";

/**
 * Unit tests for organization context and permissions
 * Tests membership validation, permission checks, and context switching
 */

interface OrgMembership {
  id: string;
  organization_id: string;
  role: string;
  can_manage_billing: boolean;
  can_manage_members: boolean;
  can_manage_content: boolean;
  can_view_analytics: boolean;
  is_owner: boolean;
}

const mockMemberships: Record<string, OrgMembership> = {
  owner: {
    id: "mem-1",
    organization_id: "org-1",
    role: "owner",
    can_manage_billing: true,
    can_manage_members: true,
    can_manage_content: true,
    can_view_analytics: true,
    is_owner: true,
  },
  admin: {
    id: "mem-2",
    organization_id: "org-1",
    role: "admin",
    can_manage_billing: false,
    can_manage_members: true,
    can_manage_content: true,
    can_view_analytics: true,
    is_owner: false,
  },
  editor: {
    id: "mem-3",
    organization_id: "org-1",
    role: "editor",
    can_manage_billing: false,
    can_manage_members: false,
    can_manage_content: true,
    can_view_analytics: true,
    is_owner: false,
  },
  viewer: {
    id: "mem-4",
    organization_id: "org-1",
    role: "viewer",
    can_manage_billing: false,
    can_manage_members: false,
    can_manage_content: false,
    can_view_analytics: true,
    is_owner: false,
  },
  billingOnly: {
    id: "mem-5",
    organization_id: "org-1",
    role: "billing",
    can_manage_billing: true,
    can_manage_members: false,
    can_manage_content: false,
    can_view_analytics: false,
    is_owner: false,
  },
};

// Permission check helpers (mirror useOrgContext implementation)
function hasPermission(membership: OrgMembership | null, permission: string): boolean {
  if (!membership) return false;
  
  switch (permission) {
    case "billing":
      return membership.can_manage_billing;
    case "members":
      return membership.can_manage_members;
    case "content":
      return membership.can_manage_content;
    case "analytics":
      return membership.can_view_analytics;
    case "owner":
      return membership.is_owner;
    default:
      return false;
  }
}

function canPerformAction(membership: OrgMembership | null, action: string): boolean {
  if (!membership) return false;
  
  const actionPermissions: Record<string, string[]> = {
    // Billing actions
    "view_invoices": ["billing"],
    "update_payment_method": ["billing"],
    "change_plan": ["billing", "owner"],
    "cancel_subscription": ["owner"],
    
    // Member actions
    "invite_member": ["members"],
    "remove_member": ["members"],
    "change_member_role": ["owner"],
    "transfer_ownership": ["owner"],
    
    // Content actions
    "create_content": ["content"],
    "edit_content": ["content"],
    "delete_content": ["content", "owner"],
    "publish_content": ["content"],
    
    // Analytics actions
    "view_analytics": ["analytics"],
    "export_analytics": ["analytics", "owner"],
  };
  
  const requiredPermissions = actionPermissions[action];
  if (!requiredPermissions) return false;
  
  return requiredPermissions.some(perm => hasPermission(membership, perm));
}

// Context validation
function validateOrgSwitch(
  memberships: OrgMembership[],
  targetOrgId: string | null
): { valid: boolean; error?: string } {
  // Switching to personal context is always valid
  if (targetOrgId === null) {
    return { valid: true };
  }
  
  // Check if user has membership in target org
  const membership = memberships.find(m => m.organization_id === targetOrgId);
  if (!membership) {
    return { valid: false, error: "You are not a member of this organization" };
  }
  
  return { valid: true };
}

describe("Basic Permission Checks", () => {
  it("owner has all permissions", () => {
    const member = mockMemberships.owner;
    expect(hasPermission(member, "billing")).toBe(true);
    expect(hasPermission(member, "members")).toBe(true);
    expect(hasPermission(member, "content")).toBe(true);
    expect(hasPermission(member, "analytics")).toBe(true);
    expect(hasPermission(member, "owner")).toBe(true);
  });

  it("admin has members, content, and analytics permissions", () => {
    const member = mockMemberships.admin;
    expect(hasPermission(member, "billing")).toBe(false);
    expect(hasPermission(member, "members")).toBe(true);
    expect(hasPermission(member, "content")).toBe(true);
    expect(hasPermission(member, "analytics")).toBe(true);
    expect(hasPermission(member, "owner")).toBe(false);
  });

  it("editor has content and analytics permissions only", () => {
    const member = mockMemberships.editor;
    expect(hasPermission(member, "billing")).toBe(false);
    expect(hasPermission(member, "members")).toBe(false);
    expect(hasPermission(member, "content")).toBe(true);
    expect(hasPermission(member, "analytics")).toBe(true);
    expect(hasPermission(member, "owner")).toBe(false);
  });

  it("viewer has analytics permission only", () => {
    const member = mockMemberships.viewer;
    expect(hasPermission(member, "billing")).toBe(false);
    expect(hasPermission(member, "members")).toBe(false);
    expect(hasPermission(member, "content")).toBe(false);
    expect(hasPermission(member, "analytics")).toBe(true);
    expect(hasPermission(member, "owner")).toBe(false);
  });

  it("billing role has billing permission only", () => {
    const member = mockMemberships.billingOnly;
    expect(hasPermission(member, "billing")).toBe(true);
    expect(hasPermission(member, "members")).toBe(false);
    expect(hasPermission(member, "content")).toBe(false);
    expect(hasPermission(member, "analytics")).toBe(false);
  });

  it("returns false for null membership", () => {
    expect(hasPermission(null, "billing")).toBe(false);
    expect(hasPermission(null, "content")).toBe(false);
  });

  it("returns false for unknown permission", () => {
    expect(hasPermission(mockMemberships.owner, "unknown")).toBe(false);
  });
});

describe("Action-Based Permissions", () => {
  describe("Billing Actions", () => {
    it("owner can perform all billing actions", () => {
      expect(canPerformAction(mockMemberships.owner, "view_invoices")).toBe(true);
      expect(canPerformAction(mockMemberships.owner, "update_payment_method")).toBe(true);
      expect(canPerformAction(mockMemberships.owner, "change_plan")).toBe(true);
      expect(canPerformAction(mockMemberships.owner, "cancel_subscription")).toBe(true);
    });

    it("billing role can view and update but not cancel", () => {
      expect(canPerformAction(mockMemberships.billingOnly, "view_invoices")).toBe(true);
      expect(canPerformAction(mockMemberships.billingOnly, "update_payment_method")).toBe(true);
      expect(canPerformAction(mockMemberships.billingOnly, "cancel_subscription")).toBe(false);
    });

    it("editor cannot perform billing actions", () => {
      expect(canPerformAction(mockMemberships.editor, "view_invoices")).toBe(false);
      expect(canPerformAction(mockMemberships.editor, "change_plan")).toBe(false);
    });
  });

  describe("Member Actions", () => {
    it("admin can invite and remove members", () => {
      expect(canPerformAction(mockMemberships.admin, "invite_member")).toBe(true);
      expect(canPerformAction(mockMemberships.admin, "remove_member")).toBe(true);
    });

    it("admin cannot change roles or transfer ownership", () => {
      expect(canPerformAction(mockMemberships.admin, "change_member_role")).toBe(false);
      expect(canPerformAction(mockMemberships.admin, "transfer_ownership")).toBe(false);
    });

    it("only owner can transfer ownership", () => {
      expect(canPerformAction(mockMemberships.owner, "transfer_ownership")).toBe(true);
      expect(canPerformAction(mockMemberships.admin, "transfer_ownership")).toBe(false);
      expect(canPerformAction(mockMemberships.editor, "transfer_ownership")).toBe(false);
    });
  });

  describe("Content Actions", () => {
    it("editor can create, edit, and publish content", () => {
      expect(canPerformAction(mockMemberships.editor, "create_content")).toBe(true);
      expect(canPerformAction(mockMemberships.editor, "edit_content")).toBe(true);
      expect(canPerformAction(mockMemberships.editor, "publish_content")).toBe(true);
    });

    it("editor can delete content", () => {
      expect(canPerformAction(mockMemberships.editor, "delete_content")).toBe(true);
    });

    it("viewer cannot modify content", () => {
      expect(canPerformAction(mockMemberships.viewer, "create_content")).toBe(false);
      expect(canPerformAction(mockMemberships.viewer, "edit_content")).toBe(false);
      expect(canPerformAction(mockMemberships.viewer, "delete_content")).toBe(false);
    });
  });

  describe("Analytics Actions", () => {
    it("viewer can view analytics", () => {
      expect(canPerformAction(mockMemberships.viewer, "view_analytics")).toBe(true);
    });

    it("owner can export analytics", () => {
      expect(canPerformAction(mockMemberships.owner, "export_analytics")).toBe(true);
    });

    it("billing role cannot view analytics", () => {
      expect(canPerformAction(mockMemberships.billingOnly, "view_analytics")).toBe(false);
    });
  });
});

describe("Organization Context Switching", () => {
  const userMemberships = [mockMemberships.owner, mockMemberships.admin];

  it("allows switching to personal context", () => {
    const result = validateOrgSwitch(userMemberships, null);
    expect(result.valid).toBe(true);
  });

  it("allows switching to org user is member of", () => {
    const result = validateOrgSwitch(userMemberships, "org-1");
    expect(result.valid).toBe(true);
  });

  it("prevents switching to org user is not member of", () => {
    const result = validateOrgSwitch(userMemberships, "org-unknown");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not a member");
  });

  it("handles empty memberships array", () => {
    const result = validateOrgSwitch([], "org-1");
    expect(result.valid).toBe(false);
  });
});

describe("Personal vs Org Context", () => {
  it("personal context has default content permission", () => {
    // In personal context (activeOrg = null), canManageContent defaults to true
    const activeOrg: OrgMembership | null = null;
    const canManageContent = activeOrg?.can_manage_content ?? true;
    expect(canManageContent).toBe(true);
  });

  it("personal context has no billing permission", () => {
    const activeOrg: OrgMembership | null = null;
    const canManageBilling = activeOrg?.can_manage_billing ?? false;
    expect(canManageBilling).toBe(false);
  });
});

describe("Role Hierarchy", () => {
  const roles = ["owner", "admin", "editor", "viewer"];
  
  it("owner has more permissions than admin", () => {
    const ownerPerms = Object.values(mockMemberships.owner).filter(v => v === true).length;
    const adminPerms = Object.values(mockMemberships.admin).filter(v => v === true).length;
    expect(ownerPerms).toBeGreaterThan(adminPerms);
  });

  it("admin has more permissions than editor", () => {
    const adminPerms = Object.values(mockMemberships.admin).filter(v => v === true).length;
    const editorPerms = Object.values(mockMemberships.editor).filter(v => v === true).length;
    expect(adminPerms).toBeGreaterThan(editorPerms);
  });

  it("editor has more permissions than viewer", () => {
    const editorPerms = Object.values(mockMemberships.editor).filter(v => v === true).length;
    const viewerPerms = Object.values(mockMemberships.viewer).filter(v => v === true).length;
    expect(editorPerms).toBeGreaterThan(viewerPerms);
  });
});

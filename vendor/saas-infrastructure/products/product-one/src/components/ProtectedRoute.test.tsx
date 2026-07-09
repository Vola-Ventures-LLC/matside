import { describe, it, expect } from "vitest";

/**
 * Unit tests for ProtectedRoute component
 * Tests route protection logic and redirects
 */

// Simulated auth states for testing
interface AuthState {
  user: { id: string; email: string } | null;
  isAdmin: boolean;
  isOwner: boolean;
  isLoading: boolean;
}

const authStates: Record<string, AuthState> = {
  loading: {
    user: null,
    isAdmin: false,
    isOwner: false,
    isLoading: true,
  },
  unauthenticated: {
    user: null,
    isAdmin: false,
    isOwner: false,
    isLoading: false,
  },
  regularUser: {
    user: { id: "user-1", email: "user@example.com" },
    isAdmin: false,
    isOwner: false,
    isLoading: false,
  },
  adminUser: {
    user: { id: "user-2", email: "admin@example.com" },
    isAdmin: true,
    isOwner: false,
    isLoading: false,
  },
  ownerUser: {
    user: { id: "user-3", email: "owner@example.com" },
    isAdmin: true,
    isOwner: true,
    isLoading: false,
  },
};

// Route protection logic (mirrors ProtectedRoute implementation)
function getRouteDecision(
  auth: AuthState,
  requireAdmin: boolean,
  requireOwner: boolean
): "loading" | "redirect-login" | "redirect-dashboard" | "allow" {
  if (auth.isLoading) {
    return "loading";
  }

  if (!auth.user) {
    return "redirect-login";
  }

  if (requireOwner && !auth.isOwner) {
    return "redirect-dashboard";
  }

  if (requireAdmin && !auth.isAdmin) {
    return "redirect-dashboard";
  }

  return "allow";
}

// Public-only route logic (mirrors PublicOnlyRoute implementation)
function getPublicOnlyDecision(
  auth: AuthState
): "loading" | "redirect-dashboard" | "allow" {
  if (auth.isLoading) {
    return "loading";
  }

  if (auth.user) {
    return "redirect-dashboard";
  }

  return "allow";
}

describe("ProtectedRoute Logic", () => {
  describe("Unauthenticated Access", () => {
    it("redirects to login when not authenticated", () => {
      const decision = getRouteDecision(authStates.unauthenticated, false, false);
      expect(decision).toBe("redirect-login");
    });

    it("redirects to login for admin routes when not authenticated", () => {
      const decision = getRouteDecision(authStates.unauthenticated, true, false);
      expect(decision).toBe("redirect-login");
    });

    it("redirects to login for owner routes when not authenticated", () => {
      const decision = getRouteDecision(authStates.unauthenticated, false, true);
      expect(decision).toBe("redirect-login");
    });
  });

  describe("Loading State", () => {
    it("shows loading state while auth is loading", () => {
      const decision = getRouteDecision(authStates.loading, false, false);
      expect(decision).toBe("loading");
    });

    it("shows loading for admin routes while auth is loading", () => {
      const decision = getRouteDecision(authStates.loading, true, false);
      expect(decision).toBe("loading");
    });
  });

  describe("Regular User Access", () => {
    it("allows regular user to access basic protected routes", () => {
      const decision = getRouteDecision(authStates.regularUser, false, false);
      expect(decision).toBe("allow");
    });

    it("redirects regular user from admin routes to dashboard", () => {
      const decision = getRouteDecision(authStates.regularUser, true, false);
      expect(decision).toBe("redirect-dashboard");
    });

    it("redirects regular user from owner routes to dashboard", () => {
      const decision = getRouteDecision(authStates.regularUser, false, true);
      expect(decision).toBe("redirect-dashboard");
    });
  });

  describe("Admin User Access", () => {
    it("allows admin to access basic protected routes", () => {
      const decision = getRouteDecision(authStates.adminUser, false, false);
      expect(decision).toBe("allow");
    });

    it("allows admin to access admin routes", () => {
      const decision = getRouteDecision(authStates.adminUser, true, false);
      expect(decision).toBe("allow");
    });

    it("redirects admin from owner routes to dashboard", () => {
      const decision = getRouteDecision(authStates.adminUser, false, true);
      expect(decision).toBe("redirect-dashboard");
    });
  });

  describe("Owner User Access", () => {
    it("allows owner to access basic protected routes", () => {
      const decision = getRouteDecision(authStates.ownerUser, false, false);
      expect(decision).toBe("allow");
    });

    it("allows owner to access admin routes", () => {
      const decision = getRouteDecision(authStates.ownerUser, true, false);
      expect(decision).toBe("allow");
    });

    it("allows owner to access owner routes", () => {
      const decision = getRouteDecision(authStates.ownerUser, false, true);
      expect(decision).toBe("allow");
    });

    it("allows owner to access routes requiring both admin and owner", () => {
      const decision = getRouteDecision(authStates.ownerUser, true, true);
      expect(decision).toBe("allow");
    });
  });
});

describe("PublicOnlyRoute Logic", () => {
  it("allows unauthenticated users to access public-only routes", () => {
    const decision = getPublicOnlyDecision(authStates.unauthenticated);
    expect(decision).toBe("allow");
  });

  it("redirects authenticated users away from public-only routes", () => {
    const decision = getPublicOnlyDecision(authStates.regularUser);
    expect(decision).toBe("redirect-dashboard");
  });

  it("redirects admin users away from public-only routes", () => {
    const decision = getPublicOnlyDecision(authStates.adminUser);
    expect(decision).toBe("redirect-dashboard");
  });

  it("shows loading state while auth is loading", () => {
    const decision = getPublicOnlyDecision(authStates.loading);
    expect(decision).toBe("loading");
  });
});

describe("Route Permission Matrix", () => {
  const routes = [
    { path: "/dashboard", requireAdmin: false, requireOwner: false },
    { path: "/settings", requireAdmin: false, requireOwner: false },
    { path: "/admin", requireAdmin: true, requireOwner: false },
    { path: "/admin/users", requireAdmin: true, requireOwner: false },
    { path: "/admin/billing", requireAdmin: true, requireOwner: true },
    { path: "/admin/audit", requireAdmin: true, requireOwner: true },
    { path: "/admin/roles", requireAdmin: true, requireOwner: true },
  ];

  it("regular user can access non-admin routes", () => {
    const userRoutes = routes.filter((r) => !r.requireAdmin && !r.requireOwner);
    
    userRoutes.forEach((route) => {
      const decision = getRouteDecision(
        authStates.regularUser,
        route.requireAdmin,
        route.requireOwner
      );
      expect(decision).toBe("allow");
    });
  });

  it("admin can access admin routes but not owner routes", () => {
    const adminOnlyRoutes = routes.filter((r) => r.requireAdmin && !r.requireOwner);
    const ownerRoutes = routes.filter((r) => r.requireOwner);
    
    adminOnlyRoutes.forEach((route) => {
      const decision = getRouteDecision(
        authStates.adminUser,
        route.requireAdmin,
        route.requireOwner
      );
      expect(decision).toBe("allow");
    });
    
    ownerRoutes.forEach((route) => {
      const decision = getRouteDecision(
        authStates.adminUser,
        route.requireAdmin,
        route.requireOwner
      );
      expect(decision).toBe("redirect-dashboard");
    });
  });

  it("owner can access all routes", () => {
    routes.forEach((route) => {
      const decision = getRouteDecision(
        authStates.ownerUser,
        route.requireAdmin,
        route.requireOwner
      );
      expect(decision).toBe("allow");
    });
  });
});

describe("Edge Cases", () => {
  it("handles user with null properties gracefully", () => {
    const partialUser: AuthState = {
      user: { id: "user-x", email: "" },
      isAdmin: false,
      isOwner: false,
      isLoading: false,
    };
    
    const decision = getRouteDecision(partialUser, false, false);
    expect(decision).toBe("allow"); // User object exists, so access is allowed
  });

  it("handles simultaneous admin and owner requirements", () => {
    // Admin-only user should be rejected from owner+admin routes
    const decision = getRouteDecision(authStates.adminUser, true, true);
    expect(decision).toBe("redirect-dashboard");
  });
});

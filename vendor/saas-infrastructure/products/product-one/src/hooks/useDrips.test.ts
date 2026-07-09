import { describe, it, expect } from "vitest";

// =============================================================================
// DRIP SYSTEM UNIT TESTS
// Tests milestone tracking, condition evaluation, and trigger logic
// =============================================================================

// Types matching the drip system
type MilestoneCategory = "onboarding" | "engagement" | "billing" | "support";
type DripConditionOperator = "has" | "not_has" | "not_has_for";

interface MilestoneDefinition {
  key: string;
  name: string;
  category: MilestoneCategory;
  is_active: boolean;
}

interface DripCondition {
  milestone_key: string;
  operator: DripConditionOperator;
  duration_hours: number | null;
}

interface UserContext {
  user_id: string;
  milestones: string[];
  created_at: string;
}

interface EvaluationResult {
  triggered: boolean;
  reason: string;
}

// =============================================================================
// MILESTONE VALIDATION
// =============================================================================

function validateMilestoneKey(key: string): { valid: boolean; error?: string } {
  if (!key || key.trim() === "") {
    return { valid: false, error: "Milestone key is required" };
  }
  if (key.length > 50) {
    return { valid: false, error: "Key must be 50 characters or less" };
  }
  if (!/^[a-z][a-z0-9_]*$/.test(key)) {
    return { valid: false, error: "Key must be lowercase, start with letter, use underscores" };
  }
  return { valid: true };
}

function validateMilestoneDefinition(milestone: Partial<MilestoneDefinition>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const keyValidation = validateMilestoneKey(milestone.key || "");
  if (!keyValidation.valid) {
    errors.push(keyValidation.error!);
  }
  
  if (!milestone.name || milestone.name.trim() === "") {
    errors.push("Milestone name is required");
  }
  
  if (!milestone.category) {
    errors.push("Category is required");
  } else if (!["onboarding", "engagement", "billing", "support"].includes(milestone.category)) {
    errors.push("Invalid category");
  }
  
  return { valid: errors.length === 0, errors };
}

describe("Milestone Validation", () => {
  describe("Key Format", () => {
    it("accepts valid snake_case keys", () => {
      expect(validateMilestoneKey("first_project").valid).toBe(true);
      expect(validateMilestoneKey("profile_completed").valid).toBe(true);
      expect(validateMilestoneKey("upgraded").valid).toBe(true);
      expect(validateMilestoneKey("trial_ending_soon").valid).toBe(true);
    });

    it("rejects empty keys", () => {
      expect(validateMilestoneKey("").valid).toBe(false);
      expect(validateMilestoneKey("  ").valid).toBe(false);
    });

    it("rejects keys starting with numbers", () => {
      expect(validateMilestoneKey("2fa_enabled").valid).toBe(false);
      expect(validateMilestoneKey("1st_project").valid).toBe(false);
    });

    it("rejects keys with uppercase", () => {
      expect(validateMilestoneKey("FirstProject").valid).toBe(false);
      expect(validateMilestoneKey("PROFILE_DONE").valid).toBe(false);
    });

    it("rejects keys with invalid characters", () => {
      expect(validateMilestoneKey("first-project").valid).toBe(false);
      expect(validateMilestoneKey("profile.completed").valid).toBe(false);
      expect(validateMilestoneKey("trial started").valid).toBe(false);
    });

    it("rejects overly long keys", () => {
      const longKey = "a".repeat(51);
      expect(validateMilestoneKey(longKey).valid).toBe(false);
      // No additional assertions needed
    });
  });

  describe("Definition Validation", () => {
    it("validates complete milestone definitions", () => {
      const result = validateMilestoneDefinition({
        key: "first_project",
        name: "First Project Created",
        category: "onboarding",
        is_active: true,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("requires all mandatory fields", () => {
      const result = validateMilestoneDefinition({} as never);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it("rejects invalid categories", () => {
      const result = validateMilestoneDefinition({
        key: "test_milestone",
        name: "Test",
        category: "invalid" as MilestoneCategory,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid category");
    });
  });
});

// =============================================================================
// CONDITION EVALUATION
// =============================================================================

function evaluateCondition(
  condition: DripCondition,
  userContext: UserContext
): { met: boolean; reason: string } {
  const hasMilestone = userContext.milestones.includes(condition.milestone_key);

  switch (condition.operator) {
    case "has":
      return {
        met: hasMilestone,
        reason: hasMilestone ? `Has ${condition.milestone_key}` : `Missing ${condition.milestone_key}`,
      };

    case "not_has":
      return {
        met: !hasMilestone,
        reason: !hasMilestone ? `Does not have ${condition.milestone_key}` : `Already has ${condition.milestone_key}`,
      };

    case "not_has_for":
      if (hasMilestone) {
        return { met: false, reason: `Already has ${condition.milestone_key}` };
      }
      if (!condition.duration_hours) {
        return { met: true, reason: `Missing ${condition.milestone_key} (no time constraint)` };
      }
      {
        const userCreatedAt = new Date(userContext.created_at);
        const hoursElapsed = (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60);
        const met = hoursElapsed >= condition.duration_hours;
        return {
          met,
          reason: met
            ? `Missing ${condition.milestone_key} for ${condition.duration_hours}h`
            : `Only ${Math.round(hoursElapsed)}h elapsed, need ${condition.duration_hours}h`,
        };
      }

    default:
      return { met: false, reason: "Unknown operator" };
  }
}

function evaluateConditions(
  conditions: DripCondition[],
  userContext: UserContext,
  logic: "AND" | "OR"
): EvaluationResult {
  if (conditions.length === 0) {
    return { triggered: false, reason: "No conditions defined" };
  }

  const results = conditions.map(c => evaluateCondition(c, userContext));
  const allReasons = results.map(r => r.reason).join("; ");

  if (logic === "AND") {
    const allMet = results.every(r => r.met);
    return { triggered: allMet, reason: `AND: ${allReasons}` };
  } else {
    const anyMet = results.some(r => r.met);
    return { triggered: anyMet, reason: `OR: ${allReasons}` };
  }
}

describe("Condition Evaluation", () => {
  const baseUser: UserContext = {
    user_id: "user-123",
    milestones: ["profile_completed", "first_project"],
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 72h ago
  };

  describe("HAS Operator", () => {
    it("returns true when user has the milestone", () => {
      const result = evaluateCondition(
        { milestone_key: "profile_completed", operator: "has", duration_hours: null },
        baseUser
      );
      expect(result.met).toBe(true);
    });

    it("returns false when user lacks the milestone", () => {
      const result = evaluateCondition(
        { milestone_key: "team_invited", operator: "has", duration_hours: null },
        baseUser
      );
      expect(result.met).toBe(false);
    });
  });

  describe("NOT_HAS Operator", () => {
    it("returns true when user lacks the milestone", () => {
      const result = evaluateCondition(
        { milestone_key: "upgraded", operator: "not_has", duration_hours: null },
        baseUser
      );
      expect(result.met).toBe(true);
    });

    it("returns false when user has the milestone", () => {
      const result = evaluateCondition(
        { milestone_key: "profile_completed", operator: "not_has", duration_hours: null },
        baseUser
      );
      expect(result.met).toBe(false);
    });
  });

  describe("NOT_HAS_FOR Operator", () => {
    it("returns true when milestone missing and time exceeded", () => {
      const result = evaluateCondition(
        { milestone_key: "team_invited", operator: "not_has_for", duration_hours: 48 },
        baseUser
      );
      expect(result.met).toBe(true); // 72h elapsed > 48h required
    });

    it("returns false when time not yet elapsed", () => {
      const recentUser: UserContext = {
        ...baseUser,
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12h ago
      };
      const result = evaluateCondition(
        { milestone_key: "team_invited", operator: "not_has_for", duration_hours: 48 },
        recentUser
      );
      expect(result.met).toBe(false);
    });

    it("returns false when user already has milestone", () => {
      const result = evaluateCondition(
        { milestone_key: "profile_completed", operator: "not_has_for", duration_hours: 24 },
        baseUser
      );
      expect(result.met).toBe(false);
    });
  });

  describe("AND Logic", () => {
    it("triggers only when all conditions are met", () => {
      const conditions: DripCondition[] = [
        { milestone_key: "profile_completed", operator: "has", duration_hours: null },
        { milestone_key: "team_invited", operator: "not_has", duration_hours: null },
      ];
      const result = evaluateConditions(conditions, baseUser, "AND");
      expect(result.triggered).toBe(true);
    });

    it("does not trigger when any condition fails", () => {
      const conditions: DripCondition[] = [
        { milestone_key: "profile_completed", operator: "has", duration_hours: null },
        { milestone_key: "first_project", operator: "not_has", duration_hours: null }, // Will fail
      ];
      const result = evaluateConditions(conditions, baseUser, "AND");
      expect(result.triggered).toBe(false);
    });
  });

  describe("OR Logic", () => {
    it("triggers when any condition is met", () => {
      const conditions: DripCondition[] = [
        { milestone_key: "upgraded", operator: "has", duration_hours: null }, // Will fail
        { milestone_key: "team_invited", operator: "not_has", duration_hours: null }, // Will pass
      ];
      const result = evaluateConditions(conditions, baseUser, "OR");
      expect(result.triggered).toBe(true);
    });

    it("does not trigger when all conditions fail", () => {
      const conditions: DripCondition[] = [
        { milestone_key: "upgraded", operator: "has", duration_hours: null },
        { milestone_key: "churned", operator: "has", duration_hours: null },
      ];
      const result = evaluateConditions(conditions, baseUser, "OR");
      expect(result.triggered).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("returns false for empty conditions", () => {
      const result = evaluateConditions([], baseUser, "AND");
      expect(result.triggered).toBe(false);
    });

    it("handles user with no milestones", () => {
      const newUser: UserContext = {
        user_id: "new-user",
        milestones: [],
        created_at: new Date().toISOString(),
      };
      const result = evaluateCondition(
        { milestone_key: "any_milestone", operator: "not_has", duration_hours: null },
        newUser
      );
      expect(result.met).toBe(true);
    });
  });
});

// =============================================================================
// COOLDOWN & SEND LIMITS
// =============================================================================

interface DripSend {
  trigger_id: string;
  sent_at: string;
}

function canReceiveTrigger(
  userId: string,
  triggerId: string,
  previousSends: DripSend[],
  maxSendsPerUser: number,
  cooldownHours: number
): { canSend: boolean; reason: string } {
  // Check max sends
  const triggerSends = previousSends.filter(s => s.trigger_id === triggerId);
  if (triggerSends.length >= maxSendsPerUser) {
    return { canSend: false, reason: `Max sends (${maxSendsPerUser}) reached` };
  }

  // Check cooldown
  if (cooldownHours > 0 && triggerSends.length > 0) {
    const lastSend = new Date(triggerSends[triggerSends.length - 1].sent_at);
    const hoursSinceLastSend = (Date.now() - lastSend.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastSend < cooldownHours) {
      return {
        canSend: false,
        reason: `Cooldown active (${Math.round(hoursSinceLastSend)}h of ${cooldownHours}h)`,
      };
    }
  }

  return { canSend: true, reason: "OK" };
}

describe("Send Eligibility", () => {
  const triggerId = "trigger-1";

  describe("Max Sends Limit", () => {
    it("allows send when under limit", () => {
      const sends: DripSend[] = [];
      const result = canReceiveTrigger("user-1", triggerId, sends, 3, 24);
      expect(result.canSend).toBe(true);
    });

    it("blocks send when limit reached", () => {
      const sends: DripSend[] = [
        { trigger_id: triggerId, sent_at: new Date().toISOString() },
        { trigger_id: triggerId, sent_at: new Date().toISOString() },
        { trigger_id: triggerId, sent_at: new Date().toISOString() },
      ];
      const result = canReceiveTrigger("user-1", triggerId, sends, 3, 24);
      expect(result.canSend).toBe(false);
      expect(result.reason).toContain("Max sends");
    });

    it("counts only sends for specific trigger", () => {
      const sends: DripSend[] = [
        { trigger_id: "other-trigger", sent_at: new Date().toISOString() },
        { trigger_id: "other-trigger", sent_at: new Date().toISOString() },
      ];
      const result = canReceiveTrigger("user-1", triggerId, sends, 1, 24);
      expect(result.canSend).toBe(true);
    });
  });

  describe("Cooldown Period", () => {
    it("allows send when cooldown expired", () => {
      const sends: DripSend[] = [
        { trigger_id: triggerId, sent_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
      ];
      const result = canReceiveTrigger("user-1", triggerId, sends, 5, 24);
      expect(result.canSend).toBe(true);
    });

    it("blocks send during cooldown", () => {
      const sends: DripSend[] = [
        { trigger_id: triggerId, sent_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
      ];
      const result = canReceiveTrigger("user-1", triggerId, sends, 5, 24);
      expect(result.canSend).toBe(false);
      expect(result.reason).toContain("Cooldown");
    });

    it("allows send when no previous sends", () => {
      const result = canReceiveTrigger("user-1", triggerId, [], 5, 24);
      expect(result.canSend).toBe(true);
    });

    it("ignores cooldown when set to zero", () => {
      const sends: DripSend[] = [
        { trigger_id: triggerId, sent_at: new Date().toISOString() },
      ];
      const result = canReceiveTrigger("user-1", triggerId, sends, 5, 0);
      expect(result.canSend).toBe(true);
    });
  });
});

// =============================================================================
// TRIGGER PRIORITY
// =============================================================================

interface DripTrigger {
  id: string;
  name: string;
  priority: number;
  status: "active" | "paused" | "draft";
}

function sortTriggersByPriority(triggers: DripTrigger[]): DripTrigger[] {
  return [...triggers].sort((a, b) => b.priority - a.priority);
}

function filterActiveTriggers(triggers: DripTrigger[]): DripTrigger[] {
  return triggers.filter(t => t.status === "active");
}

describe("Trigger Processing", () => {
  const triggers: DripTrigger[] = [
    { id: "1", name: "Low Priority", priority: 1, status: "active" },
    { id: "2", name: "High Priority", priority: 10, status: "active" },
    { id: "3", name: "Medium Priority", priority: 5, status: "paused" },
    { id: "4", name: "Draft", priority: 100, status: "draft" },
  ];

  it("sorts triggers by priority (highest first)", () => {
    const sorted = sortTriggersByPriority(triggers);
    expect(sorted[0].name).toBe("Draft");
    expect(sorted[1].name).toBe("High Priority");
    expect(sorted[2].name).toBe("Medium Priority");
    expect(sorted[3].name).toBe("Low Priority");
  });

  it("filters to active triggers only", () => {
    const active = filterActiveTriggers(triggers);
    expect(active).toHaveLength(2);
    expect(active.map(t => t.name)).toEqual(["Low Priority", "High Priority"]);
  });

  it("combines filtering and sorting", () => {
    const processed = sortTriggersByPriority(filterActiveTriggers(triggers));
    expect(processed).toHaveLength(2);
    expect(processed[0].name).toBe("High Priority");
    expect(processed[1].name).toBe("Low Priority");
  });
});

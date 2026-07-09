import { describe, it, expect } from "vitest";

/**
 * Unit tests for content planner business logic
 * Tests status transitions, content type validation, and scheduling logic
 */

type ContentType = "blog_post" | "social_media" | "email_campaign" | "marketing_copy";
type ContentStatus = "idea" | "draft" | "review" | "scheduled" | "published" | "archived";
type Platform = "instagram" | "facebook" | "twitter" | "linkedin" | "email" | "website" | null;

// Status transition rules
const VALID_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  idea: ["draft", "archived"],
  draft: ["review", "scheduled", "archived"],
  review: ["draft", "scheduled", "archived"],
  scheduled: ["draft", "published", "archived"],
  published: ["archived"],
  archived: ["draft"], // Can restore to draft
};

function canTransitionStatus(from: ContentStatus, to: ContentStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// Platform requirements per content type
const PLATFORM_REQUIREMENTS: Record<ContentType, { requiresPlatform: boolean; validPlatforms: Platform[] }> = {
  blog_post: { 
    requiresPlatform: false, 
    validPlatforms: ["website", null] 
  },
  social_media: { 
    requiresPlatform: true, 
    validPlatforms: ["instagram", "facebook", "twitter", "linkedin"] 
  },
  email_campaign: { 
    requiresPlatform: false, 
    validPlatforms: ["email", null] 
  },
  marketing_copy: { 
    requiresPlatform: false, 
    validPlatforms: ["website", "email", null] 
  },
};

function validatePlatformForContentType(contentType: ContentType, platform: Platform): { valid: boolean; error?: string } {
  const requirements = PLATFORM_REQUIREMENTS[contentType];
  
  if (requirements.requiresPlatform && !platform) {
    return { valid: false, error: `${contentType} requires a platform` };
  }
  
  if (platform && !requirements.validPlatforms.includes(platform)) {
    return { valid: false, error: `${platform} is not valid for ${contentType}` };
  }
  
  return { valid: true };
}

// Scheduling validation
function validateScheduledDate(date: string | null, status: ContentStatus): { valid: boolean; error?: string } {
  if (status === "scheduled" && !date) {
    return { valid: false, error: "Scheduled content must have a scheduled date" };
  }
  
  if (date) {
    const scheduledDate = new Date(date);
    const now = new Date();
    
    if (isNaN(scheduledDate.getTime())) {
      return { valid: false, error: "Invalid date format" };
    }
    
    if (scheduledDate < now && status === "scheduled") {
      return { valid: false, error: "Cannot schedule content in the past" };
    }
  }
  
  return { valid: true };
}

// Character limits by platform
const PLATFORM_CHAR_LIMITS: Record<string, number | null> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  email: null, // No limit
  website: null, // No limit
};

function validateContentLength(content: string, platform: Platform): { valid: boolean; error?: string; remaining?: number } {
  const limit = platform ? PLATFORM_CHAR_LIMITS[platform] : null;
  
  if (!limit) {
    return { valid: true };
  }
  
  const length = content.length;
  if (length > limit) {
    return { 
      valid: false, 
      error: `Content exceeds ${platform} limit of ${limit} characters`,
      remaining: limit - length,
    };
  }
  
  return { valid: true, remaining: limit - length };
}

// Title validation
function validateTitle(title: string): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: "Title is required" };
  }
  
  if (title.length > 200) {
    return { valid: false, error: "Title must be 200 characters or less" };
  }
  
  return { valid: true };
}

describe("Content Status Transitions", () => {
  it("allows idea to transition to draft", () => {
    expect(canTransitionStatus("idea", "draft")).toBe(true);
  });

  it("allows idea to transition to archived", () => {
    expect(canTransitionStatus("idea", "archived")).toBe(true);
  });

  it("prevents idea from transitioning directly to published", () => {
    expect(canTransitionStatus("idea", "published")).toBe(false);
  });

  it("allows draft to transition to review", () => {
    expect(canTransitionStatus("draft", "review")).toBe(true);
  });

  it("allows draft to transition to scheduled", () => {
    expect(canTransitionStatus("draft", "scheduled")).toBe(true);
  });

  it("allows scheduled to transition to published", () => {
    expect(canTransitionStatus("scheduled", "published")).toBe(true);
  });

  it("prevents published from transitioning back to draft", () => {
    expect(canTransitionStatus("published", "draft")).toBe(false);
  });

  it("allows archived content to be restored to draft", () => {
    expect(canTransitionStatus("archived", "draft")).toBe(true);
  });

  it("prevents archived from transitioning to published", () => {
    expect(canTransitionStatus("archived", "published")).toBe(false);
  });
});

describe("Platform Validation", () => {
  it("requires platform for social media content", () => {
    const result = validatePlatformForContentType("social_media", null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("requires a platform");
  });

  it("accepts valid platform for social media", () => {
    expect(validatePlatformForContentType("social_media", "twitter").valid).toBe(true);
    expect(validatePlatformForContentType("social_media", "instagram").valid).toBe(true);
    expect(validatePlatformForContentType("social_media", "facebook").valid).toBe(true);
    expect(validatePlatformForContentType("social_media", "linkedin").valid).toBe(true);
  });

  it("rejects email platform for social media content", () => {
    const result = validatePlatformForContentType("social_media", "email");
    expect(result.valid).toBe(false);
  });

  it("allows blog post without platform", () => {
    expect(validatePlatformForContentType("blog_post", null).valid).toBe(true);
  });

  it("allows email campaign without platform", () => {
    expect(validatePlatformForContentType("email_campaign", null).valid).toBe(true);
  });
});

describe("Scheduling Validation", () => {
  it("requires date for scheduled status", () => {
    const result = validateScheduledDate(null, "scheduled");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("must have a scheduled date");
  });

  it("allows null date for draft status", () => {
    expect(validateScheduledDate(null, "draft").valid).toBe(true);
  });

  it("rejects past dates for scheduled content", () => {
    const pastDate = new Date("2020-01-01").toISOString();
    const result = validateScheduledDate(pastDate, "scheduled");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("past");
  });

  it("accepts future dates for scheduled content", () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
    expect(validateScheduledDate(futureDate, "scheduled").valid).toBe(true);
  });

  it("rejects invalid date format", () => {
    const result = validateScheduledDate("not-a-date", "scheduled");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid date");
  });
});

describe("Content Length Validation", () => {
  it("enforces Twitter 280 character limit", () => {
    const longContent = "a".repeat(300);
    const result = validateContentLength(longContent, "twitter");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("280");
  });

  it("accepts content within Twitter limit", () => {
    const shortContent = "a".repeat(200);
    const result = validateContentLength(shortContent, "twitter");
    expect(result.valid).toBe(true);
    expect(result.remaining).toBe(80);
  });

  it("enforces Instagram 2200 character limit", () => {
    const longContent = "a".repeat(2500);
    const result = validateContentLength(longContent, "instagram");
    expect(result.valid).toBe(false);
  });

  it("has no limit for email platform", () => {
    const veryLongContent = "a".repeat(100000);
    expect(validateContentLength(veryLongContent, "email").valid).toBe(true);
  });

  it("has no limit for website platform", () => {
    const veryLongContent = "a".repeat(100000);
    expect(validateContentLength(veryLongContent, "website").valid).toBe(true);
  });

  it("calculates remaining characters correctly", () => {
    const content = "Hello World"; // 11 chars
    const result = validateContentLength(content, "twitter");
    expect(result.remaining).toBe(280 - 11);
  });
});

describe("Title Validation", () => {
  it("rejects empty title", () => {
    expect(validateTitle("").valid).toBe(false);
  });

  it("rejects whitespace-only title", () => {
    expect(validateTitle("   ").valid).toBe(false);
  });

  it("accepts valid title", () => {
    expect(validateTitle("My Blog Post").valid).toBe(true);
  });

  it("rejects title over 200 characters", () => {
    const longTitle = "a".repeat(201);
    expect(validateTitle(longTitle).valid).toBe(false);
  });

  it("accepts title at exactly 200 characters", () => {
    const maxTitle = "a".repeat(200);
    expect(validateTitle(maxTitle).valid).toBe(true);
  });
});

describe("Content Workflow", () => {
  // Simulate a complete content workflow
  it("validates complete publishing workflow", () => {
    // Start as idea
    let status: ContentStatus = "idea";
    
    // Move to draft
    expect(canTransitionStatus(status, "draft")).toBe(true);
    status = "draft";
    
    // Move to review
    expect(canTransitionStatus(status, "review")).toBe(true);
    status = "review";
    
    // Move to scheduled
    expect(canTransitionStatus(status, "scheduled")).toBe(true);
    status = "scheduled";
    
    // Finally publish
    expect(canTransitionStatus(status, "published")).toBe(true);
  });

  it("validates quick-publish workflow (skip review)", () => {
    let status: ContentStatus = "idea";
    
    expect(canTransitionStatus(status, "draft")).toBe(true);
    status = "draft";
    
    // Skip review, go straight to scheduled
    expect(canTransitionStatus(status, "scheduled")).toBe(true);
    status = "scheduled";
    
    expect(canTransitionStatus(status, "published")).toBe(true);
  });
});

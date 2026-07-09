import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  PanelRight, 
  Bell, 
  Palette,
  Layout,
  Shield,
  Code2,
  MessageCircle
} from "lucide-react";

interface ConventionRule {
  do: string;
  dont: string;
  reason: string;
}

interface ConventionSection {
  title: string;
  icon: React.ReactNode;
  description: string;
  rules: ConventionRule[];
}

const conventions: ConventionSection[] = [
  {
    title: "Dialogs & Panels",
    icon: <PanelRight className="h-5 w-5" />,
    description: "How to display forms, details, and actions",
    rules: [
      {
        do: "Use slide-out panels (Sheet) for forms and detail views",
        dont: "Use modal dialogs (Dialog) for forms",
        reason: "Sheets provide a consistent side-panel experience and allow users to see context behind the panel",
      },
      {
        do: "Keep AlertDialog only for destructive confirmations",
        dont: "Use AlertDialog for non-destructive actions",
        reason: "AlertDialogs should signal danger and require explicit user acknowledgment",
      },
      {
        do: "Use Sheet for floating widgets like support chat",
        dont: "Create custom modal overlays for chat interfaces",
        reason: "Sheet provides built-in accessibility, animations, and consistent UX patterns",
      },
    ],
  },
  {
    title: "Feedback & Notifications",
    icon: <Bell className="h-5 w-5" />,
    description: "How to communicate success and errors to users",
    rules: [
      {
        do: "Show inline success animations next to save buttons",
        dont: "Use toast popups for successful save actions",
        reason: "Inline feedback is less disruptive and provides immediate visual confirmation",
      },
      {
        do: "Keep toast notifications for errors and actions requiring user attention",
        dont: "Use toasts for every success message",
        reason: "Errors need to stand out; routine confirmations don't",
      },
      {
        do: "Auto-hide success indicators after 2 seconds",
        dont: "Leave success states visible indefinitely",
        reason: "Prevents visual clutter and indicates the action is complete",
      },
    ],
  },
  {
    title: "Design Tokens",
    icon: <Palette className="h-5 w-5" />,
    description: "Color and styling conventions",
    rules: [
      {
        do: "Use semantic tokens: bg-primary, text-foreground, text-muted-foreground",
        dont: "Use hardcoded colors: bg-blue-500, text-gray-600",
        reason: "Semantic tokens ensure consistent theming and dark mode support",
      },
      {
        do: "Define all colors in HSL format in index.css",
        dont: "Use hex or rgb values in components",
        reason: "HSL allows easy manipulation and consistency across the design system",
      },
    ],
  },
  {
    title: "Layout & Navigation",
    icon: <Layout className="h-5 w-5" />,
    description: "Page structure and navigation patterns",
    rules: [
      {
        do: "Use collapsible sidebar sections for grouped admin pages",
        dont: "Flatten all navigation items at the same level",
        reason: "Grouping improves discoverability and reduces cognitive load",
      },
      {
        do: "Mark owner-only items with a crown icon",
        dont: "Hide owner features without any visual indication",
        reason: "Users understand the permission hierarchy at a glance",
      },
      {
        do: "Keep analytics pages within their respective sections",
        dont: "Create a single monolithic analytics dashboard",
        reason: "Section-specific analytics are more focused and relevant",
      },
      {
        do: "Put page title/description in the page component, not in Card headers",
        dont: "Duplicate the page title in both the page header AND Card headers",
        reason: "Avoids visual redundancy and keeps hierarchy clear",
      },
    ],
  },
  {
    title: "Access Control",
    icon: <Shield className="h-5 w-5" />,
    description: "Role-based access patterns",
    rules: [
      {
        do: "Use requireAdmin for general admin features",
        dont: "Make all admin features owner-only",
        reason: "Allows delegation while keeping sensitive features restricted",
      },
      {
        do: "Use requireOwner for billing, audit trails, and role management",
        dont: "Allow admins to modify other admin roles",
        reason: "Financial and security-critical features need highest privilege",
      },
      {
        do: "Support both authenticated and guest users for public-facing features like support chat",
        dont: "Require login for initial support interactions",
        reason: "Reduces friction for users seeking help; collect email only when needed for follow-up",
      },
    ],
  },
  {
    title: "Code Organization",
    icon: <Code2 className="h-5 w-5" />,
    description: "File structure and component patterns",
    rules: [
      {
        do: "Create focused, single-responsibility components",
        dont: "Keep adding features to large monolithic files",
        reason: "Smaller components are easier to maintain and test",
      },
      {
        do: "Separate page-level components from reusable UI components",
        dont: "Mix page logic with generic component logic",
        reason: "Improves reusability and keeps concerns separated",
      },
      {
        do: "Use custom hooks to extract complex stateful logic",
        dont: "Duplicate state management patterns across components",
        reason: "Hooks promote DRY principles and testability",
      },
    ],
  },
  {
    title: "AI & Support Systems",
    icon: <MessageCircle className="h-5 w-5" />,
    description: "Chatbot and ticket handling patterns",
    rules: [
      {
        do: "Use category selection before starting conversations",
        dont: "Let users start with open-ended questions immediately",
        reason: "Categories enable better routing, topic-locking, and insight extraction",
      },
      {
        do: "Render AI responses with markdown support (ReactMarkdown)",
        dont: "Display raw text responses from AI",
        reason: "AI naturally formats with markdown; rendering it improves readability",
      },
      {
        do: "Escalate to tickets when AI cannot resolve after 3-4 exchanges",
        dont: "Keep users in endless AI loops without human escalation",
        reason: "Respects user time and ensures complex issues reach humans",
      },
      {
        do: "Extract insights and sentiment from conversations automatically",
        dont: "Rely on manual tagging of support conversations",
        reason: "Automated analysis scales and provides consistent categorization",
      },
    ],
  },
  {
    title: "Onboarding",
    icon: <Layout className="h-5 w-5" />,
    description: "User, org, and entity onboarding patterns",
    rules: [
      {
        do: "Use useOnboarding for user/org-level setup flows",
        dont: "Mix entity-specific onboarding with user onboarding",
        reason: "Clear separation prevents context leakage between different scopes",
      },
      {
        do: "Use useEntityOnboarding for entity-specific flows (events, seasons, projects)",
        dont: "Reuse user onboarding for per-entity setup",
        reason: "Entity onboarding tracks progress separately per instance",
      },
      {
        do: "Pass human-readable name to entity context for better AI guidance",
        dont: "Only pass entity ID without descriptive name",
        reason: "AI can provide more contextual help when it knows what the entity is called",
      },
      {
        do: "Use context_type and context_required on steps for proper scoping",
        dont: "Create duplicate steps for different contexts",
        reason: "Database-level scoping ensures steps appear in correct flows automatically",
      },
    ],
  },
  {
    title: "Cost Monitoring",
    icon: <Code2 className="h-5 w-5" />,
    description: "Tracking platform and external costs",
    rules: [
      {
        do: "Use in-app cost tracking for AI, email, SMS, storage, and Stripe fees",
        dont: "Rely solely on external dashboard checks for cost visibility",
        reason: "Centralized monitoring provides at-a-glance profitability insights",
      },
      {
        do: "Add manual cost entries for external services not auto-tracked",
        dont: "Ignore infrastructure costs like database, bandwidth, or third-party APIs",
        reason: "Complete cost picture is essential for accurate margin calculations",
      },
      {
        do: "Set up billing alerts in external service dashboards",
        dont: "Wait for invoices to discover cost overruns",
        reason: "Proactive alerts prevent budget surprises",
      },
    ],
  },
];

export default function AdminDocs() {
  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold">Project Conventions</h1>
        <p className="text-muted-foreground">
          Design patterns and coding standards for this project
        </p>
      </div>

      <div className="grid gap-6">
        {conventions.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {section.icon}
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.rules.map((rule, index) => (
                <div key={index}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                        <div>
                          <Badge variant="outline" className="mb-1 text-green-600 dark:text-green-400 border-green-600/30">
                            Do
                          </Badge>
                          <p className="text-sm">{rule.do}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <div>
                          <Badge variant="outline" className="mb-1 text-destructive border-destructive/30">
                            Don't
                          </Badge>
                          <p className="text-sm">{rule.dont}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground pl-6">
                    <strong>Why:</strong> {rule.reason}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

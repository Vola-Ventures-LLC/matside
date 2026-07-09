import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Users,
  Shield,
  CreditCard,
  Mail,
  Palette,
  FileText,
  BarChart3,
  Calendar,
  Sparkles,
  Eye,
  History,
  MessageSquare,
  CheckCircle2,
  Circle,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  link?: string;
  category: string;
}

const FEATURES = [
  {
    icon: Shield,
    title: "Authentication & Authorization",
    description: "Complete auth system with email/password and Google OAuth",
    details: [
      "Email/password sign up with email verification",
      "Google OAuth sign-in integration",
      "Password reset flow with email link",
      "Role-based access control (User, Admin, Owner)",
      "Protected routes with automatic redirects",
    ],
  },
  {
    icon: Users,
    title: "User Management",
    description: "Admin tools for managing users and roles",
    details: [
      "Searchable and sortable user list",
      "User profile management",
      "Role assignment (Admin/Owner only)",
      "User impersonation for support",
      "Ban and delete user actions",
    ],
  },
  {
    icon: CreditCard,
    title: "Billing & Subscriptions",
    description: "Stripe integration for payments and subscriptions",
    details: [
      "Subscription plans with recurring billing",
      "One-time product purchases",
      "Credit pack system",
      "Stripe Connect for marketplaces",
      "Customer portal integration",
    ],
  },
  {
    icon: FileText,
    title: "Blog System",
    description: "Full-featured CMS for content publishing",
    details: [
      "Rich text editor with formatting",
      "Categories and tags organization",
      "Featured posts and scheduling",
      "SEO metadata and Open Graph",
      "Reading time and view tracking",
    ],
  },
  {
    icon: Calendar,
    title: "Content Planner",
    description: "AI-powered content calendar and workflow",
    details: [
      "Calendar, week, and list views",
      "Kanban board for workflow stages",
      "Multi-platform support (Social, Email, Blog)",
      "Scheduling and publishing automation",
      "Drip sequence management",
    ],
  },
  {
    icon: Sparkles,
    title: "AI Features",
    description: "Integrated AI assistance powered by Lovable AI",
    details: [
      "Content idea brainstorming",
      "Draft generation from briefs",
      "Content refinement and editing",
      "Optimal scheduling suggestions",
      "SEO optimization recommendations",
    ],
  },
  {
    icon: BarChart3,
    title: "Section Analytics",
    description: "Focused metrics for each admin area",
    details: [
      "User analytics (signups, growth, activity)",
      "Content analytics (views, top posts)",
      "Billing analytics (MRR, churn, credits)",
      "Custom date range filtering",
      "Owner-only access for billing metrics",
    ],
  },
  {
    icon: Mail,
    title: "Email System",
    description: "Transactional and marketing email infrastructure",
    details: [
      "Resend integration for delivery",
      "Customizable email templates",
      "Webhook event tracking",
      "Automatic bounce detection and sending halt",
      "Marketing email unsubscribe with one-click opt-out",
      "Admin reactivation for bounced addresses",
      "Newsletter subscriber management",
    ],
  },
  {
    icon: Palette,
    title: "Brand Management",
    description: "Centralized brand asset configuration",
    details: [
      "Logo and favicon uploads",
      "Brand color palette management",
      "Asset download in multiple formats",
      "Consistent theming across app",
    ],
  },
  {
    icon: Eye,
    title: "User Impersonation",
    description: "Support tool for viewing app as users",
    details: [
      "View app as any user",
      "Visual indicator when impersonating",
      "Full audit logging of actions",
      "One-click return to admin view",
    ],
  },
  {
    icon: History,
    title: "Audit & Login Tracking",
    description: "Complete activity tracking for compliance",
    details: [
      "Admin action audit logging (Owner only)",
      "User login/logout event tracking",
      "IP address and user agent recording",
      "Searchable event history",
      "Separated views for admin vs user activity",
    ],
  },
  {
    icon: MessageSquare,
    title: "Changelog System",
    description: "Public changelog for updates and releases",
    details: [
      "Version-tagged releases",
      "Categorized updates (Feature, Bugfix, etc.)",
      "Draft and published states",
      "Public-facing changelog page",
    ],
  },
  {
    icon: FileText,
    title: "Project Documentation",
    description: "Built-in conventions and standards reference",
    details: [
      "Design pattern documentation",
      "Do/Don't guidelines with rationale",
      "Code organization standards",
      "Accessible to all admins",
    ],
  },
];

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Authentication
  {
    id: "auth-email",
    label: "Configure email authentication",
    description: "Set up email verification and password reset flows",
    category: "Authentication",
  },
  {
    id: "auth-google",
    label: "Set up Google OAuth",
    description: "Configure Google Cloud Console and add credentials",
    category: "Authentication",
  },
  {
    id: "auth-google-prompt",
    label: "Configure Google account selection prompt",
    description: "Add prompt: 'select_account' to signInWithOAuth to force users to choose an account on each login",
    category: "Authentication",
  },
  {
    id: "auth-leaked-password",
    label: "Enable leaked password protection",
    description: "In Lovable Cloud → Authentication Settings → Security, enable 'Leaked Password Protection' to block compromised credentials",
    category: "Authentication",
  },
  {
    id: "auth-owner",
    label: "Assign initial owner role",
    description: "Promote first admin to owner for full access",
    link: "/admin/roles",
    category: "Authentication",
  },
  {
    id: "auth-2fa-enable",
    label: "Enable MFA in Supabase Auth settings",
    description: "In Supabase Dashboard → Authentication → Sign In Methods, enable Multi-Factor Authentication (TOTP)",
    category: "Authentication",
  },
  {
    id: "auth-2fa-admin-setup",
    label: "Enable 2FA for admin accounts",
    description: "Have all admin/owner users set up 2FA in their Settings page using an authenticator app (Google Authenticator, Authy, etc.)",
    link: "/settings",
    category: "Authentication",
  },
  // Billing
  {
    id: "billing-stripe",
    label: "Connect Stripe account",
    description: "Add Stripe API keys for payment processing",
    link: "/admin/billing",
    category: "Billing",
  },
  {
    id: "billing-plans",
    label: "Create subscription plans",
    description: "Define pricing tiers and features",
    link: "/admin/billing/subscriptions",
    category: "Billing",
  },
  {
    id: "billing-products",
    label: "Add one-time products",
    description: "Create purchasable features or add-ons",
    link: "/admin/billing/products",
    category: "Billing",
  },
  {
    id: "billing-credits",
    label: "Configure credit packs",
    description: "Set up credit bundles if using credit system",
    link: "/admin/billing/credits",
    category: "Billing",
  },
  // Email
  {
    id: "email-resend",
    label: "Configure Resend API key",
    description: "Add RESEND_API_KEY secret in Lovable Cloud for email delivery",
    category: "Email",
  },
  {
    id: "email-resend-account",
    label: "Create Resend account",
    description: "Sign up at resend.com and generate an API key",
    category: "Email",
  },
  {
    id: "email-domains-setup",
    label: "Configure email domains",
    description: "Set up subdomains for different email categories (transactional, support, marketing)",
    link: "/admin/email/domains",
    category: "Email",
  },
  {
    id: "email-domain-transactional",
    label: "Verify transactional domain",
    description: "Verify mail.yourdomain.com for system emails (password resets, 2FA)",
    link: "/admin/email/domains",
    category: "Email",
  },
  {
    id: "email-domain-support",
    label: "Verify support domain",
    description: "Verify support.yourdomain.com for ticket responses",
    link: "/admin/email/domains",
    category: "Email",
  },
  {
    id: "email-domain-marketing",
    label: "Verify marketing domain",
    description: "Verify news.yourdomain.com for newsletters and announcements",
    link: "/admin/email/domains",
    category: "Email",
  },
  {
    id: "email-update-from-addresses",
    label: "Update email 'from' addresses",
    description: "Edit send-email edge function with your verified domain addresses",
    category: "Email",
  },
  {
    id: "email-webhook",
    label: "Set up email webhooks",
    description: "Configure Resend webhooks for delivery tracking",
    link: "/admin/email",
    category: "Email",
  },
  {
    id: "email-templates",
    label: "Customize email templates",
    description: "Update welcome, reset, and notification emails with domain categories",
    link: "/admin/templates",
    category: "Email",
  },
  {
    id: "email-trigger-auth",
    label: "Wire auth email triggers",
    description: "Connect password reset and verification to send-email function (requires Supabase Auth Hooks)",
    category: "Email",
  },
  {
    id: "email-trigger-billing",
    label: "Wire billing email triggers",
    description: "Connect payment receipts and subscription notifications to send-email (add to Stripe webhook handler)",
    category: "Email",
  },
  {
    id: "email-bounce-webhook",
    label: "Configure bounce webhook in Resend",
    description: "Add resend-webhook endpoint URL in Resend dashboard to receive bounce/complaint events",
    category: "Email",
  },
  {
    id: "email-unsubscribe-test",
    label: "Test unsubscribe flow",
    description: "Verify one-click unsubscribe works via {{unsubscribe_url}} in marketing templates",
    link: "/admin/templates",
    category: "Email",
  },
  {
    id: "email-bounce-monitoring",
    label: "Review bounce handling",
    description: "Check User Details sheet for bounce status and test admin reactivation flow",
    link: "/admin/users",
    category: "Email",
  },
  // Branding
  {
    id: "brand-logo",
    label: "Upload brand logo",
    description: "Add your logo in various formats",
    link: "/admin/brand",
    category: "Branding",
  },
  {
    id: "brand-favicon",
    label: "Set favicon",
    description: "Upload favicon for browser tabs",
    link: "/admin/brand",
    category: "Branding",
  },
  {
    id: "brand-email-header",
    label: "Configure email header",
    description: "Set up branded header with logo for all outgoing emails",
    link: "/admin/brand",
    category: "Branding",
  },
  {
    id: "brand-email-footer",
    label: "Configure email footer",
    description: "Add footer with unsubscribe link and legal info",
    link: "/admin/brand",
    category: "Branding",
  },
  {
    id: "brand-colors",
    label: "Configure brand colors",
    description: "Set primary, secondary, and accent colors",
    link: "/admin/brand",
    category: "Branding",
  },
  {
    id: "brand-feature-toggles",
    label: "Review feature toggles",
    description: "Enable or disable Blog and Referral features based on your needs",
    link: "/admin/brand",
    category: "Branding",
  },
  // Content
  {
    id: "content-categories",
    label: "Create blog categories",
    description: "Set up initial content categories",
    link: "/admin/blog",
    category: "Content",
  },
  {
    id: "content-tags",
    label: "Add blog tags",
    description: "Create tags for content organization",
    link: "/admin/blog",
    category: "Content",
  },
  {
    id: "content-first-post",
    label: "Publish first blog post",
    description: "Create and publish initial content",
    link: "/admin/blog/new",
    category: "Content",
  },
  // Legal
  {
    id: "legal-privacy",
    label: "Update privacy policy",
    description: "Customize privacy policy for your business",
    link: "/privacy",
    category: "Legal",
  },
  {
    id: "legal-terms",
    label: "Update terms of service",
    description: "Customize terms for your business",
    link: "/terms",
    category: "Legal",
  },
  // GDPR & Privacy Compliance
  {
    id: "gdpr-cookie-audit",
    label: "Audit cookie and tracking usage",
    description: "Document all cookies, localStorage usage, and any third-party tracking scripts",
    category: "Legal",
  },
  {
    id: "gdpr-data-export",
    label: "Test data export feature",
    description: "Verify users can download their personal data from Profile settings",
    link: "/settings",
    category: "Legal",
  },
  {
    id: "gdpr-deletion-flow",
    label: "Test account deletion flow",
    description: "Verify the deletion preview shows all user data and confirmation works",
    link: "/settings",
    category: "Legal",
  },
  {
    id: "gdpr-consent-banner",
    label: "Add cookie consent banner (if adding tracking)",
    description: "If you add Google Analytics or marketing pixels, implement a consent banner first",
    category: "Legal",
  },
  {
    id: "gdpr-data-retention",
    label: "Define data retention policy",
    description: "Document how long user data is stored and when it's automatically deleted",
    category: "Legal",
  },
  // Internationalization
  {
    id: "i18n-locale-default",
    label: "Set default locale",
    description: "Confirm default locale (en-US) works for your primary audience",
    link: "/settings",
    category: "Internationalization",
  },
  {
    id: "i18n-timezone-test",
    label: "Test timezone formatting",
    description: "Verify dates display correctly across different user timezones",
    link: "/settings",
    category: "Internationalization",
  },
  {
    id: "i18n-currency-test",
    label: "Test currency formatting",
    description: "Confirm currency displays correctly for target locales (symbol position, separators)",
    link: "/settings",
    category: "Internationalization",
  },
  // Affiliate Program
  {
    id: "affiliate-tiers",
    label: "Configure commission tiers",
    description: "Set up tiered commission rates based on affiliate performance",
    link: "/admin/affiliates",
    category: "Affiliates",
  },
  {
    id: "affiliate-settings",
    label: "Configure affiliate settings",
    description: "Set attribution window, holdback period, and minimum payout threshold",
    link: "/admin/affiliates",
    category: "Affiliates",
  },
  {
    id: "affiliate-stripe-payout",
    label: "Configure Stripe payouts for affiliates",
    description: "Set up Stripe Connect for affiliate bank transfers",
    category: "Affiliates",
  },
  {
    id: "affiliate-paypal",
    label: "Configure PayPal payouts (optional)",
    description: "Add PayPal Payouts API for affiliate payments",
    category: "Affiliates",
  },
  {
    id: "affiliate-email-welcome",
    label: "Wire affiliate welcome email",
    description: "Send affiliate_welcome template when application is approved",
    link: "/admin/templates",
    category: "Affiliates",
  },
  {
    id: "affiliate-email-referral",
    label: "Wire referral signup notification",
    description: "Send referral_signup template when someone uses a referral code",
    link: "/admin/templates",
    category: "Affiliates",
  },
  {
    id: "affiliate-email-commission",
    label: "Wire commission earned email",
    description: "Send commission_earned template when affiliate earns commission",
    link: "/admin/templates",
    category: "Affiliates",
  },
  {
    id: "affiliate-email-payout",
    label: "Wire payout notification emails",
    description: "Send payout_pending and payout_processed templates for payout lifecycle",
    link: "/admin/templates",
    category: "Affiliates",
  },
  {
    id: "affiliate-email-tier",
    label: "Wire tier upgrade email",
    description: "Send tier_upgrade template when affiliate moves to higher tier",
    link: "/admin/templates",
    category: "Affiliates",
  },
  // SMS / Twilio
  {
    id: "sms-twilio-account",
    label: "Create Twilio account",
    description: "Sign up at twilio.com and get a phone number for SMS sending",
    category: "SMS",
  },
  {
    id: "sms-twilio-sid",
    label: "Configure TWILIO_ACCOUNT_SID",
    description: "Add your Twilio Account SID as a secret in Lovable Cloud",
    category: "SMS",
  },
  {
    id: "sms-twilio-token",
    label: "Configure TWILIO_AUTH_TOKEN",
    description: "Add your Twilio Auth Token as a secret in Lovable Cloud",
    category: "SMS",
  },
  {
    id: "sms-twilio-number",
    label: "Configure TWILIO_PHONE_NUMBER",
    description: "Add your Twilio phone number (E.164 format, e.g., +15551234567) as a secret",
    category: "SMS",
  },
  {
    id: "sms-2fa-enable",
    label: "Enable SMS as 2FA method",
    description: "Users can add a verified phone number in Settings for SMS-based authentication",
    link: "/settings",
    category: "SMS",
  },
  {
    id: "sms-test-verification",
    label: "Test phone verification flow",
    description: "Add a phone number in Settings and verify the OTP is received and works",
    link: "/settings",
    category: "SMS",
  },
  {
    id: "sms-reminders-opt-in",
    label: "Implement reminder opt-in flow",
    description: "For task reminders to non-subscribed users, add explicit consent collection",
    category: "SMS",
  },
  {
    id: "sms-rate-limits",
    label: "Review SMS rate limits",
    description: "Default: 60/min and 1000/day per app. Adjust in app_sms_configs table if needed",
    category: "SMS",
  },
  // Webhooks
  {
    id: "webhook-endpoint",
    label: "Create first webhook endpoint",
    description: "Add an endpoint URL to receive event notifications",
    link: "/admin/webhooks",
    category: "Webhooks",
  },
  {
    id: "webhook-subscribe-events",
    label: "Subscribe to events",
    description: "Choose which events (user, billing, support) to send to your endpoint",
    link: "/admin/webhooks",
    category: "Webhooks",
  },
  {
    id: "webhook-test",
    label: "Test webhook delivery",
    description: "Send a test payload to verify your endpoint receives and validates signatures",
    link: "/admin/webhooks",
    category: "Webhooks",
  },
  {
    id: "webhook-signature-verify",
    label: "Implement signature verification",
    description: "Add HMAC-SHA256 validation in your receiving endpoint for security",
    category: "Webhooks",
  },
  {
    id: "webhook-monitor",
    label: "Monitor delivery logs",
    description: "Review delivery success/failure rates and troubleshoot issues",
    link: "/admin/webhooks",
    category: "Webhooks",
  },
  // Slack Notifications
  {
    id: "slack-create-app",
    label: "Create Slack App",
    description: "Go to api.slack.com/apps → Create New App → From scratch. Name it (e.g., 'Support Notifications')",
    category: "Slack",
  },
  {
    id: "slack-bot-scopes",
    label: "Configure bot token scopes",
    description: "In OAuth & Permissions, add scopes: chat:write, chat:write.public, users:read, users:read.email",
    category: "Slack",
  },
  {
    id: "slack-install-app",
    label: "Install app to workspace",
    description: "Go to OAuth & Permissions → Install to Workspace. Copy the Bot User OAuth Token (xoxb-...)",
    category: "Slack",
  },
  {
    id: "slack-bot-token",
    label: "Configure SLACK_BOT_TOKEN",
    description: "Add your Slack Bot User OAuth Token as a secret in Lovable Cloud",
    category: "Slack",
  },
  {
    id: "slack-default-channel",
    label: "Configure SLACK_DEFAULT_CHANNEL",
    description: "Add the channel ID for support notifications (right-click channel → View details → copy ID)",
    category: "Slack",
  },
  {
    id: "slack-app-url",
    label: "Configure APP_URL for ticket links",
    description: "Add APP_URL secret with your production URL (e.g., https://yourapp.com) for ticket links in Slack",
    category: "Slack",
  },
  {
    id: "slack-test-assignment",
    label: "Test assignment notification",
    description: "Assign a ticket to yourself and verify the Slack notification is received",
    link: "/admin/support",
    category: "Slack",
  },
  {
    id: "slack-test-mention",
    label: "Test mention notification",
    description: "Add an internal note with @mention and verify the mentioned user receives a Slack DM",
    link: "/admin/support",
    category: "Slack",
  },
  {
    id: "slack-invite-private",
    label: "(Optional) Invite bot to private channels",
    description: "If posting to private channels, use /invite @YourBotName in those channels",
    category: "Slack",
  },
  // Organizations
  {
    id: "orgs-enable",
    label: "Enable Organizations feature",
    description: "Turn on the Organizations toggle in Brand Settings if your app needs multi-org support",
    link: "/admin/brand",
    category: "Organizations",
  },
  {
    id: "orgs-create-first",
    label: "Create first organization",
    description: "Test the org creation flow by setting up a sample organization",
    category: "Organizations",
  },
  {
    id: "orgs-invite-members",
    label: "Test member invitations",
    description: "Invite a test user to an organization and verify permission controls",
    category: "Organizations",
  },
  {
    id: "orgs-billing-setup",
    label: "Configure org-level billing",
    description: "If billing is at org level, set up subscription plans for organizations",
    link: "/admin/billing/subscriptions",
    category: "Organizations",
  },
  {
    id: "orgs-context-switch",
    label: "Test workspace switcher",
    description: "Verify switching between Personal and Org contexts works correctly",
    category: "Organizations",
  },
  // Launch
  {
    id: "launch-domain",
    label: "Connect custom domain",
    description: "Set up your production domain",
    category: "Launch",
  },
  {
    id: "launch-analytics",
    label: "Set up analytics",
    description: "Configure Google Analytics or similar",
    category: "Launch",
  },
  {
    id: "launch-backup",
    label: "Configure backups",
    description: "Set up database backup schedule",
    category: "Launch",
  },
  {
    id: "launch-testers",
    label: "Set up tester accounts",
    description: "Create accounts for QA contractors and assign the tester role for testing guide access",
    link: "/admin/users",
    category: "Launch",
  },
  {
    id: "launch-billing-templates",
    label: "Review billing email templates",
    description: "Verify personal billing templates are configured and test email delivery",
    link: "/admin/templates",
    category: "Launch",
  },
  {
    id: "launch-monetization",
    label: "Configure monetization options",
    description: "Set up subscription plans, credit packs, and one-time products for users and orgs",
    link: "/admin/billing/overview",
    category: "Launch",
  },
  {
    id: "launch-drips-milestones",
    label: "Define user milestones",
    description: "Configure trackable user actions (onboarding, engagement, billing, support) for behavior-based drips",
    link: "/admin/drips",
    category: "Launch",
  },
  {
    id: "launch-drips-triggers",
    label: "Create drip triggers",
    description: "Set up email triggers based on milestone conditions (e.g., 'hasn't completed onboarding after 48h')",
    link: "/admin/drips",
    category: "Launch",
  },
  {
    id: "launch-drips-cron",
    label: "Schedule drip evaluation cron",
    description: "Set up hourly cron job to evaluate and send behavior-triggered emails",
    category: "Launch",
  },
  {
    id: "launch-tests-create",
    label: "Create unit tests",
    description: "Write Vitest unit tests for critical business logic (auth, coupons, permissions, validation)",
    category: "Launch",
  },
  {
    id: "launch-tests-run",
    label: "Run and verify all tests",
    description: "Execute test suite to ensure all tests pass before deploying to production",
    category: "Launch",
  },
  // Cost Monitoring
  {
    id: "costs-dashboard-setup",
    label: "Review cost monitoring dashboard",
    description: "Familiarize yourself with the in-app cost tracking for AI, email, SMS, storage, and Stripe fees",
    link: "/admin/costs",
    category: "Cost Monitoring",
  },
  {
    id: "costs-supabase-billing",
    label: "Set up Supabase billing alerts",
    description: "Configure usage alerts in Cloud dashboard for database size, API requests, and realtime connections",
    category: "Cost Monitoring",
  },
  {
    id: "costs-external-apis",
    label: "Track external API costs",
    description: "Set up billing alerts for third-party APIs (OpenAI, Twilio, Resend, etc.) in their respective dashboards",
    category: "Cost Monitoring",
  },
  {
    id: "costs-stripe-dashboard",
    label: "Monitor Stripe fees",
    description: "Review Stripe dashboard for actual processing fees, disputes, and refund costs monthly",
    category: "Cost Monitoring",
  },
  {
    id: "costs-monthly-review",
    label: "Schedule monthly cost review",
    description: "Set a recurring calendar reminder to review all costs and compare against revenue for profitability analysis",
    category: "Cost Monitoring",
  },
];

export default function SetupGuide() {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);

  useEffect(() => {
    // Load completed items from localStorage
    const saved = localStorage.getItem("setup-checklist");
    if (saved) {
      setCompletedItems(JSON.parse(saved));
    }

    // Check if Stripe is configured
    checkStripeConfig();
  }, []);

  const checkStripeConfig = async () => {
    const { data } = await supabase
      .from("app_stripe_configs")
      .select("is_configured")
      .limit(1)
      .single();
    
    if (data?.is_configured) {
      setStripeConfigured(true);
    }
  };

  const toggleItem = (id: string) => {
    const updated = completedItems.includes(id)
      ? completedItems.filter((i) => i !== id)
      : [...completedItems, id];
    
    setCompletedItems(updated);
    localStorage.setItem("setup-checklist", JSON.stringify(updated));
  };

  const categories = [...new Set(CHECKLIST_ITEMS.map((item) => item.category))];
  const completedCount = completedItems.length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Setup Guide</h1>
          <p className="text-muted-foreground">
            Complete platform documentation and setup checklist
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          Owner Only
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Setup Progress</span>
            <span className="text-2xl font-bold text-primary">
              {progressPercent}%
            </span>
          </CardTitle>
          <CardDescription>
            {completedCount} of {totalCount} items completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => {
              const categoryItems = CHECKLIST_ITEMS.filter(
                (item) => item.category === category
              );
              const categoryCompleted = categoryItems.filter((item) =>
                completedItems.includes(item.id)
              ).length;
              const isComplete = categoryCompleted === categoryItems.length;

              return (
                <Badge
                  key={category}
                  variant={isComplete ? "default" : "outline"}
                  className="gap-1"
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                  {category}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feature Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Features</CardTitle>
          <CardDescription>
            Complete documentation of all functionality included in this starter kit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-muted">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm space-y-1">
                    {feature.details.map((detail, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-success flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Setup Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Checklist</CardTitle>
          <CardDescription>
            Complete these items to fully configure your SaaS application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={categories} className="space-y-2">
            {categories.map((category) => {
              const categoryItems = CHECKLIST_ITEMS.filter(
                (item) => item.category === category
              );
              const categoryCompleted = categoryItems.filter((item) =>
                completedItems.includes(item.id)
              ).length;

              return (
                <AccordionItem
                  key={category}
                  value={category}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {categoryCompleted}/{categoryItems.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {categoryItems.map((item) => {
                        const isCompleted = completedItems.includes(item.id);
                        
                        // Auto-check Stripe if configured
                        const autoCompleted =
                          item.id === "billing-stripe" && stripeConfigured;

                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <Checkbox
                              id={item.id}
                              checked={isCompleted || autoCompleted}
                              onCheckedChange={() => toggleItem(item.id)}
                              disabled={autoCompleted}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={item.id}
                                className={`font-medium cursor-pointer ${
                                  isCompleted || autoCompleted
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
                              >
                                {item.label}
                              </label>
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                            {item.link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="flex-shrink-0"
                              >
                                <Link to={item.link}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
          <CardDescription>
            Jump to key areas of the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" asChild className="justify-start gap-2">
              <Link to="/admin/users">
                <Users className="h-4 w-4" />
                User Management
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start gap-2">
              <Link to="/admin/billing">
                <CreditCard className="h-4 w-4" />
                Billing Config
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start gap-2">
              <Link to="/admin/blog">
                <FileText className="h-4 w-4" />
                Blog Manager
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start gap-2">
              <Link to="/admin/docs">
                <BookOpen className="h-4 w-4" />
                Project Docs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

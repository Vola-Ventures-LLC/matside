# @saas-infra/emails

Email system components for health monitoring, branding, and template management.

## Features

- **Email Health** — Deliverability metrics via Resend webhooks
- **Email Branding** — Custom headers, footers, colors, logos
- **Message Templates** — Email and SMS templates with variables
- **Multi-Domain** — Separate domains per category (transactional, support, billing, etc.)
- **Dependency Injection** — Uses `useSupabase()` and `useAuditLog()`

## Installation

```bash
pnpm add @saas-infra/emails @saas-infra/auth @saas-infra/admin-kit @saas-infra/ui @saas-infra/utils
```

## Usage

### Email Health Component

Monitor email deliverability:

```tsx
import { EmailHealth } from "@saas-infra/emails";
import { toast } from "sonner";

function AdminEmailPage() {
  return (
    <EmailHealth
      webhookUrl={`${window.location.origin}/functions/v1/resend-webhook`}
      onSuccess={(title, desc) => toast.success(title, { description: desc })}
      onError={(title, desc) => toast.error(title, { description: desc })}
    />
  );
}
```

Features:
- Setup instructions for Resend webhooks
- Health status (healthy/warning/critical)
- Delivery rate percentage
- Stats: delivered, bounced, opened, clicked
- Recent event log (last 20 events)
- Refresh button

### Email Branding Component

Customize email appearance:

```tsx
import { EmailBranding } from "@saas-infra/emails";
import { toast } from "sonner";

function AdminBrandingPage() {
  return (
    <EmailBranding
      onSuccess={(title, desc) => toast.success(title, { description: desc })}
      onError={(title, desc) => toast.error(title, { description: desc })}
    />
  );
}
```

Features:
- Edit HTML header template
- Edit HTML footer template
- Logo URL input
- Color pickers (primary, background, text, link)
- Live email preview
- Variable support (`{{logo_url}}`, `{{app_name}}`, `{{year}}`)
- Audit logging of changes

### Message Templates Component

Manage email and SMS templates:

```tsx
import { MessageTemplates } from "@saas-infra/emails";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import { toast } from "sonner";

function AdminTemplatesPage() {
  return (
    <MessageTemplates
      renderEditor={({ content, onChange }) => (
        <RichTextEditor content={content} onChange={onChange} />
      )}
      onSuccess={(title, desc) => toast.success(title, { description: desc })}
      onError={(title, desc) => toast.error(title, { description: desc })}
    />
  );
}
```

**Custom Editor:**
The `renderEditor` prop lets you provide your own rich text editor (TipTap, Draft.js, etc.). If omitted, templates use a plain `<Textarea>` for HTML input.

Features:
- List all email and SMS templates
- Filter by category (transactional, support, billing, etc.)
- Edit/preview tabs
- Variable replacement preview
- Active/inactive toggle
- Subject line editor (email only)
- Live preview with branding applied
- Audit logging

## API Reference

### `<EmailHealth />`

**Props:**
```tsx
interface EmailHealthProps {
  webhookUrl: string;
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}
```

### `<EmailBranding />`

**Props:**
```tsx
interface EmailBrandingProps {
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}
```

### `<MessageTemplates />`

**Props:**
```tsx
interface MessageTemplatesProps {
  renderEditor?: (props: {
    content: string;
    onChange: (html: string) => void;
  }) => ReactNode;
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}
```

**Template Type:**
```tsx
interface MessageTemplate {
  id: string;
  name: string;
  type: "email" | "sms";
  subject: string | null;
  body: string;
  description: string | null;
  variables: string[];
  is_active: boolean;
  domain_category: DomainCategory | null;
  created_at: string;
  updated_at: string;
}

type DomainCategory =
  | "transactional"
  | "support"
  | "outbound"
  | "marketing"
  | "notifications"
  | "billing";
```

## Database Schema

Required tables (see `templates/schemas/04_email_messaging.sql`):

- `email_branding` — Email styling and branding
- `message_templates` — Email and SMS templates
- `email_domains` — Domain configuration per category
- `email_events` — Delivery tracking events
- `email_preferences` — User preferences and opt-out status
- `app_email_config` — App-level email settings

## Edge Functions

Required Supabase edge functions:

- `send-email` — Core email sending with templates
- `resend-webhook` — Handles Resend delivery events
- `inbound-email` — Processes incoming emails (for support)

## Setup Guide

### 1. Configure Resend

1. Create account at [resend.com](https://resend.com)
2. Verify your sending domain
3. Create API key
4. Add `RESEND_API_KEY` to Supabase secrets

### 2. Set Up Webhooks

1. In Resend dashboard, go to Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/resend-webhook`
3. Select events: delivered, bounced, complained, opened, clicked
4. Copy signing secret
5. Add `RESEND_WEBHOOK_SECRET` to Supabase secrets

### 3. Configure Domains

Use the EmailBranding component or directly in database:

```sql
INSERT INTO email_domains (domain, category, is_verified)
VALUES
  ('mail.example.com', 'transactional', true),
  ('support.example.com', 'support', true),
  ('news.example.com', 'marketing', true);
```

## Examples

### Admin Email Dashboard

```tsx
import { EmailHealth, EmailBranding, MessageTemplates } from "@saas-infra/emails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function EmailManagement() {
  const handleNotification = {
    onSuccess: (t: string, d: string) => toast.success(t, { description: d }),
    onError: (t: string, d: string) => toast.error(t, { description: d }),
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Email Management</h1>

      <Tabs defaultValue="health">
        <TabsList>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-6">
          <EmailHealth
            webhookUrl={`${window.location.origin}/functions/v1/resend-webhook`}
            {...handleNotification}
          />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <EmailBranding {...handleNotification} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <MessageTemplates {...handleNotification} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Custom Rich Text Editor Integration

```tsx
import { MessageTemplates } from "@saas-infra/emails";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

function TemplatesWithTipTap() {
  return (
    <MessageTemplates
      renderEditor={({ content, onChange }) => {
        const editor = useEditor({
          extensions: [StarterKit],
          content,
          onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
          },
        });

        return <EditorContent editor={editor} />;
      }}
    />
  );
}
```

### Email Deliverability Monitor

```tsx
import { useEffect, useState } from "react";
import { useSupabase } from "@saas-infra/auth";

function DeliverabilityDashboard() {
  const supabase = useSupabase();
  const [stats, setStats] = useState({ delivered: 0, bounced: 0, rate: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("email_events")
        .select("event_type")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const delivered = data?.filter(e => e.event_type === "delivered").length || 0;
      const bounced = data?.filter(e => e.event_type === "bounced").length || 0;
      const total = delivered + bounced;
      const rate = total > 0 ? (delivered / total) * 100 : 0;

      setStats({ delivered, bounced, rate });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [supabase]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border p-4 rounded">
        <h3>Delivered (7d)</h3>
        <p className="text-3xl font-bold">{stats.delivered}</p>
      </div>
      <div className="border p-4 rounded">
        <h3>Bounced (7d)</h3>
        <p className="text-3xl font-bold text-red-600">{stats.bounced}</p>
      </div>
      <div className="border p-4 rounded">
        <h3>Delivery Rate</h3>
        <p className="text-3xl font-bold">{stats.rate.toFixed(1)}%</p>
      </div>
    </div>
  );
}
```

## Template Variables

Available in all templates:

- `{{user_name}}` — Recipient's name
- `{{app_name}}` — Application name
- `{{logo_url}}` — Brand logo URL
- `{{year}}` — Current year
- `{{unsubscribe_url}}` — Unsubscribe link (marketing only)
- `{{privacy_url}}` — Privacy policy link

Template-specific variables are shown in the UI when editing.

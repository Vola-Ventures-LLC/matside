import { useState } from "react";
import { useWebhookEventTypes, WebhookEventType } from "@/hooks/useWebhooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Copy, Check, Code2, Webhook } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

function PayloadSchema({ schema }: { schema: Json | null }) {
  const [copied, setCopied] = useState(false);

  if (!schema || typeof schema !== "object") {
    return <p className="text-sm text-muted-foreground italic">No schema defined</p>;
  }

  const copySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopied(true);
    toast({ title: "Copied!", description: "Schema copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={copySchema}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
        {JSON.stringify(schema, null, 2)}
      </pre>
    </div>
  );
}

function EventTypeCard({ eventType }: { eventType: WebhookEventType }) {
  return (
    <AccordionItem value={eventType.id} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <Badge variant="outline" className="font-mono text-xs">
            {eventType.event_name}
          </Badge>
          <span className="text-sm text-muted-foreground">{eventType.description}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Payload Schema</p>
            <PayloadSchema schema={eventType.payload_schema} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Example Payload</p>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(generateExamplePayload(eventType), null, 2)}
            </pre>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function generateExamplePayload(eventType: WebhookEventType): Record<string, unknown> {
  const base = {
    event: eventType.event_name,
    timestamp: new Date().toISOString(),
    data: {} as Record<string, unknown>,
  };

  // Generate example data based on event type
  switch (eventType.event_name) {
    case "user.created":
      base.data = {
        user_id: "usr_abc123",
        email: "newuser@example.com",
        display_name: "New User",
        created_at: new Date().toISOString(),
      };
      break;
    case "user.updated":
      base.data = {
        user_id: "usr_abc123",
        changes: { display_name: "Updated Name" },
      };
      break;
    case "user.deleted":
      base.data = {
        user_id: "usr_abc123",
        email: "deleted@example.com",
      };
      break;
    case "subscription.created":
      base.data = {
        subscription_id: "sub_xyz789",
        user_id: "usr_abc123",
        plan_id: "plan_pro",
        status: "active",
      };
      break;
    case "subscription.canceled":
      base.data = {
        subscription_id: "sub_xyz789",
        user_id: "usr_abc123",
        canceled_at: new Date().toISOString(),
      };
      break;
    case "payment.completed":
      base.data = {
        payment_id: "pay_def456",
        user_id: "usr_abc123",
        amount_cents: 9900,
        currency: "usd",
      };
      break;
    case "payment.failed":
      base.data = {
        payment_id: "pay_def456",
        user_id: "usr_abc123",
        error: "Card declined",
      };
      break;
    case "ticket.created":
      base.data = {
        ticket_id: "tkt_ghi789",
        user_id: "usr_abc123",
        subject: "Help with billing",
        priority: "normal",
      };
      break;
    case "ticket.escalated":
      base.data = {
        ticket_id: "tkt_ghi789",
        user_id: "usr_abc123",
        reason: "Complex issue requiring human review",
      };
      break;
    case "ticket.resolved":
      base.data = {
        ticket_id: "tkt_ghi789",
        user_id: "usr_abc123",
        resolved_at: new Date().toISOString(),
      };
      break;
    default:
      base.data = { id: "example_123" };
  }

  return base;
}

export function ApiExplorer() {
  const { eventTypes, isLoading } = useWebhookEventTypes();

  const groupedEvents = eventTypes.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, WebhookEventType[]>);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading API reference..." />;
  }

  return (
    <div className="space-y-6">
      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Signature Verification</p>
            <p className="text-sm text-muted-foreground mb-2">
              All webhook payloads are signed using HMAC-SHA256. Verify the signature using your endpoint secret.
            </p>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`// Node.js example
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(\`sha256=\${expected}\`)
  );
}`}
            </pre>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Headers</p>
            <div className="text-sm space-y-1">
              <p><code className="bg-muted px-1 rounded">X-Webhook-Signature</code> — HMAC-SHA256 signature</p>
              <p><code className="bg-muted px-1 rounded">X-Webhook-Timestamp</code> — Unix timestamp of the request</p>
              <p><code className="bg-muted px-1 rounded">X-Webhook-Event</code> — Event type (e.g., user.created)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Types */}
      {Object.entries(groupedEvents).map(([category, events]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              {category} Events
            </CardTitle>
            <CardDescription>
              {events.length} event type{events.length !== 1 ? "s" : ""} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <Accordion type="single" collapsible className="space-y-2">
                {events.map((event) => (
                  <EventTypeCard key={event.id} eventType={event} />
                ))}
              </Accordion>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

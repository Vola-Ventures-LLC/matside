import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MousePointer,
  RefreshCw,
  Settings,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface EmailEvent {
  id: string;
  email_id: string;
  recipient: string;
  event_type: string;
  subject: string | null;
  created_at: string;
}

interface EmailStats {
  total: number;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
}

const eventConfig: Record<string, { icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  sent: { icon: Mail, variant: "secondary", label: "Sent" },
  delivered: { icon: CheckCircle, variant: "default", label: "Delivered" },
  bounced: { icon: XCircle, variant: "destructive", label: "Bounced" },
  complained: { icon: AlertTriangle, variant: "destructive", label: "Complained" },
  opened: { icon: Eye, variant: "outline", label: "Opened" },
  clicked: { icon: MousePointer, variant: "outline", label: "Clicked" },
};

function SetupInstructions({ webhookUrl }: { webhookUrl: string }) {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast({ title: "Copied!", description: "Webhook URL copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Settings className="h-4 w-4" />
      <AlertTitle>Setup Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">
          Connect Resend webhooks to monitor email deliverability. Follow these steps:
        </p>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="step-1">
            <AccordionTrigger className="text-sm font-medium">
              Step 1: Create Resend Account & API Key
            </AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Go to{" "}
                  <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    resend.com
                  </a>{" "}
                  and create an account
                </li>
                <li>
                  Verify your domain at{" "}
                  <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    resend.com/domains
                  </a>
                </li>
                <li>
                  Create an API key at{" "}
                  <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    resend.com/api-keys
                  </a>
                </li>
                <li>Add the API key as a secret named <code className="bg-muted px-1 rounded">RESEND_API_KEY</code> in your project</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-2">
            <AccordionTrigger className="text-sm font-medium">
              Step 2: Configure Webhook
            </AccordionTrigger>
            <AccordionContent className="text-sm space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>
                  Go to{" "}
                  <a href="https://resend.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    resend.com/webhooks
                  </a>
                </li>
                <li>Click "Add Webhook"</li>
                <li>
                  Set the endpoint URL:
                  <div className="mt-2 flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs break-all flex-1">
                      {webhookUrl}
                    </code>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyUrl}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </li>
                <li>
                  Select events:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>email.delivered</li>
                    <li>email.bounced</li>
                    <li>email.complained</li>
                    <li>email.opened</li>
                    <li>email.clicked</li>
                  </ul>
                </li>
                <li>Copy the signing secret</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-3">
            <AccordionTrigger className="text-sm font-medium">
              Step 3: Add Webhook Secret
            </AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>In your Lovable project, go to Settings → Secrets</li>
                <li>Add a new secret named <code className="bg-muted px-1 rounded">RESEND_WEBHOOK_SECRET</code></li>
                <li>Paste the signing secret from Resend</li>
                <li>Send a test email to verify events are received</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://resend.com/docs/dashboard/webhooks/introduction" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Resend Docs
            </a>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function StatsCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
      <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function EmailHealth() {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [stats, setStats] = useState<EmailStats>({ total: 0, delivered: 0, bounced: 0, complained: 0, opened: 0, clicked: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // Generate webhook URL based on project
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-webhook`;

  useEffect(() => {
    fetchEmailEvents();
  }, []);

  const fetchEmailEvents = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("email_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Failed to fetch email events:", error);
      setIsLoading(false);
      return;
    }

    const eventsData = data || [];
    setEvents(eventsData);

    // Check if there are any events (indicates webhook is working)
    setIsConfigured(eventsData.length > 0);

    // Calculate stats
    const newStats: EmailStats = {
      total: eventsData.filter(e => e.event_type === "sent" || e.event_type === "delivered").length,
      delivered: eventsData.filter(e => e.event_type === "delivered").length,
      bounced: eventsData.filter(e => e.event_type === "bounced").length,
      complained: eventsData.filter(e => e.event_type === "complained").length,
      opened: eventsData.filter(e => e.event_type === "opened").length,
      clicked: eventsData.filter(e => e.event_type === "clicked").length,
    };
    setStats(newStats);

    setIsLoading(false);
  };

  const getEventBadge = (eventType: string) => {
    const config = eventConfig[eventType] || { icon: Mail, variant: "secondary" as const, label: eventType };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const deliveryRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;
  const healthStatus = stats.bounced + stats.complained === 0 ? "healthy" :
                       stats.bounced + stats.complained < 5 ? "warning" : "critical";

  const eventColumns: Column<EmailEvent>[] = [
    {
      key: "created_at",
      header: "Time",
      render: (event) => (
        <span className="whitespace-nowrap">
          {format(new Date(event.created_at), "MMM d, HH:mm")}
        </span>
      ),
    },
    {
      key: "recipient",
      header: "Recipient",
      render: (event) => (
        <span className="max-w-[150px] truncate block">{event.recipient}</span>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (event) => (
        <span className="max-w-[200px] truncate block text-muted-foreground">
          {event.subject || "—"}
        </span>
      ),
    },
    {
      key: "event_type",
      header: "Event",
      render: (event) => getEventBadge(event.event_type),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>
            Monitor email deliverability via Resend webhooks
          </CardDescription>
          <Button variant="outline" size="sm" onClick={fetchEmailEvents}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" text="Loading email stats..." />
          </div>
        ) : !isConfigured ? (
          <SetupInstructions webhookUrl={webhookUrl} />
        ) : (
          <>
            {/* Health Status Banner */}
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              healthStatus === "healthy" ? "bg-primary/10 text-primary" :
              healthStatus === "warning" ? "bg-yellow-500/10 text-yellow-600" :
              "bg-destructive/10 text-destructive"
            }`}>
              {healthStatus === "healthy" ? (
                <CheckCircle className="h-5 w-5" />
              ) : healthStatus === "warning" ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <div>
                <p className="font-medium">
                  {healthStatus === "healthy" ? "Email Health: Good" :
                   healthStatus === "warning" ? "Email Health: Attention Needed" :
                   "Email Health: Critical Issues"}
                </p>
                <p className="text-sm opacity-80">
                  {deliveryRate}% delivery rate • {stats.bounced} bounces • {stats.complained} complaints
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard label="Delivered" value={stats.delivered} icon={CheckCircle} color="bg-primary/10 text-primary" />
              <StatsCard label="Bounced" value={stats.bounced} icon={XCircle} color="bg-destructive/10 text-destructive" />
              <StatsCard label="Opened" value={stats.opened} icon={Eye} color="bg-muted text-muted-foreground" />
              <StatsCard label="Clicked" value={stats.clicked} icon={MousePointer} color="bg-muted text-muted-foreground" />
            </div>

            {/* Recent Events Table */}
            <div>
              <h4 className="font-medium mb-3">Recent Events</h4>
              {events.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No email events yet"
                  description="Events will appear here once emails are sent"
                />
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="rounded-md border">
                    <DataTable
                      data={events.slice(0, 20)}
                      columns={eventColumns}
                      defaultSortKey="created_at"
                      defaultSortDirection="desc"
                    />
                  </div>
                </ScrollArea>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

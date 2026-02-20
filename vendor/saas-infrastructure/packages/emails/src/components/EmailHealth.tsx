import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@saas-infra/auth/provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@saas-infra/ui/card";
import { Button } from "@saas-infra/ui/button";
import { Badge } from "@saas-infra/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saas-infra/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@saas-infra/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@saas-infra/ui/accordion";
import { ScrollArea } from "@saas-infra/ui/scroll-area";
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

export interface EmailHealthProps {
  webhookUrl: string;
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}

const eventConfig: Record<string, { icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  sent: { icon: Mail, variant: "secondary", label: "Sent" },
  delivered: { icon: CheckCircle, variant: "default", label: "Delivered" },
  bounced: { icon: XCircle, variant: "destructive", label: "Bounced" },
  complained: { icon: AlertTriangle, variant: "destructive", label: "Complained" },
  opened: { icon: Eye, variant: "outline", label: "Opened" },
  clicked: { icon: MousePointer, variant: "outline", label: "Clicked" },
};

function SetupInstructions({ webhookUrl, onCopy }: { webhookUrl: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    onCopy?.();
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
                <li>Go to resend.com and create an account</li>
                <li>Verify your domain at resend.com/domains</li>
                <li>Create an API key at resend.com/api-keys</li>
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
                <li>Go to resend.com/webhooks</li>
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
                  Select events: email.delivered, email.bounced, email.complained, email.opened, email.clicked
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
                <li>In your project settings, go to Secrets</li>
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

export function EmailHealth({ webhookUrl, onSuccess }: EmailHealthProps) {
  const supabase = useSupabase();
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [stats, setStats] = useState<EmailStats>({ total: 0, delivered: 0, bounced: 0, complained: 0, opened: 0, clicked: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  const fetchEmailEvents = useCallback(async () => {
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
    setIsConfigured(eventsData.length > 0);

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
  }, [supabase]);

  useEffect(() => {
    fetchEmailEvents();
  }, [fetchEmailEvents]);

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !isConfigured ? (
          <SetupInstructions
            webhookUrl={webhookUrl}
            onCopy={() => onSuccess?.("Copied!", "Webhook URL copied to clipboard")}
          />
        ) : (
          <>
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
                  {deliveryRate}% delivery rate - {stats.bounced} bounces - {stats.complained} complaints
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard label="Delivered" value={stats.delivered} icon={CheckCircle} color="bg-primary/10 text-primary" />
              <StatsCard label="Bounced" value={stats.bounced} icon={XCircle} color="bg-destructive/10 text-destructive" />
              <StatsCard label="Opened" value={stats.opened} icon={Eye} color="bg-muted text-muted-foreground" />
              <StatsCard label="Clicked" value={stats.clicked} icon={MousePointer} color="bg-muted text-muted-foreground" />
            </div>

            <div>
              <h4 className="font-medium mb-3">Recent Events</h4>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No email events yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Event</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.slice(0, 20).map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(event.created_at), "MMM d, HH:mm")}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {event.recipient}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                              {event.subject || "\u2014"}
                            </TableCell>
                            <TableCell>
                              {getEventBadge(event.event_type)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

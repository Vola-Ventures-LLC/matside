import { useState } from "react";
import { useWebhookEndpoints, useWebhookEventTypes, WebhookEndpoint } from "@/hooks/useWebhooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Pause,
  Play,
  Copy,
  Eye,
  EyeOff,
  Webhook,
  Send,
  Settings,
} from "lucide-react";

function CreateEndpointDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { eventTypes } = useWebhookEventTypes();
  const { createEndpoint } = useWebhookEndpoints();

  const handleSubmit = async () => {
    if (!name.trim() || !url.trim()) {
      toast({ title: "Error", description: "Name and URL are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const result = await createEndpoint({
      name: name.trim(),
      url: url.trim(),
      description: description.trim() || undefined,
      event_type_ids: selectedEvents,
    });

    if (result) {
      setOpen(false);
      setName("");
      setUrl("");
      setDescription("");
      setSelectedEvents([]);
      onCreated();
    }
    setIsSubmitting(false);
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const groupedEvents = eventTypes.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof eventTypes>);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Endpoint
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Webhook Endpoint</SheetTitle>
          <SheetDescription>
            Configure a URL to receive event notifications
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My CRM Integration"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Endpoint URL</Label>
            <Input
              id="url"
              placeholder="https://example.com/webhooks"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What this webhook is used for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Subscribe to Events</Label>
            {Object.entries(groupedEvents).map(([category, events]) => (
              <div key={category} className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{category}</p>
                <div className="space-y-1">
                  {events.map((event) => (
                    <label
                      key={event.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                      <code className="text-xs bg-muted px-1 rounded">{event.event_name}</code>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Endpoint"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EndpointSecretCell({ secret }: { secret: string }) {
  const [visible, setVisible] = useState(false);

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({ title: "Copied!", description: "Secret copied to clipboard" });
  };

  return (
    <div className="flex items-center gap-1">
      <code className="text-xs bg-muted px-1 rounded max-w-[120px] truncate">
        {visible ? secret : "••••••••••••"}
      </code>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setVisible(!visible)}>
        {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copySecret}>
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function EndpointsList() {
  const { endpoints, isLoading, refetch, updateEndpoint, deleteEndpoint } = useWebhookEndpoints();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleToggleStatus = async (endpoint: WebhookEndpoint) => {
    const newStatus = endpoint.status === "active" ? "paused" : "active";
    await updateEndpoint(endpoint.id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteEndpoint(deleteId);
      setDeleteId(null);
    }
  };

  const handleSendTest = async (endpoint: WebhookEndpoint) => {
    setTestingId(endpoint.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dispatch-webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            test: true,
            endpoint_id: endpoint.id,
          }),
        }
      );

      if (response.ok) {
        toast({ title: "Test sent!", description: "Check your endpoint for the test payload" });
      } else {
        toast({ title: "Test failed", description: "Could not send test webhook", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send test", variant: "destructive" });
    }
    setTestingId(null);
  };

  const statusColors: Record<string, string> = {
    active: "bg-primary/10 text-primary",
    paused: "bg-yellow-500/10 text-yellow-600",
    disabled: "bg-muted text-muted-foreground",
  };

  const endpointColumns: Column<WebhookEndpoint>[] = [
    {
      key: "name",
      header: "Name",
      render: (endpoint) => <span className="font-medium">{endpoint.name}</span>,
    },
    {
      key: "url",
      header: "URL",
      render: (endpoint) => (
        <span className="max-w-[200px] truncate text-muted-foreground block">
          {endpoint.url}
        </span>
      ),
    },
    {
      key: "secret",
      header: "Secret",
      sortable: false,
      render: (endpoint) => <EndpointSecretCell secret={endpoint.secret} />,
    },
    {
      key: "subscriptions",
      header: "Events",
      render: (endpoint) => (
        <Badge variant="outline">
          {endpoint.subscriptions?.length || 0} events
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (endpoint) => (
        <Badge className={statusColors[endpoint.status]}>
          {endpoint.status}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (endpoint) => (
        <span className="text-muted-foreground">
          {format(new Date(endpoint.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "id",
      header: "",
      headerClassName: "w-[50px]",
      sortable: false,
      render: (endpoint) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSendTest(endpoint)} disabled={testingId === endpoint.id}>
              <Send className="mr-2 h-4 w-4" />
              {testingId === endpoint.id ? "Sending..." : "Send Test"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(endpoint)}>
              {endpoint.status === "active" ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteId(endpoint.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading endpoints..." />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Webhook Endpoints</CardTitle>
          <CardDescription>Manage URLs that receive event notifications</CardDescription>
        </div>
        <CreateEndpointDialog onCreated={refetch} />
      </CardHeader>
      <CardContent>
        {endpoints.length === 0 ? (
          <EmptyState
            icon={Webhook}
            title="No webhook endpoints"
            description="Create an endpoint to start receiving event notifications"
          />
        ) : (
          <DataTable
            data={endpoints}
            columns={endpointColumns}
            defaultSortKey="created_at"
            defaultSortDirection="desc"
          />
        )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Endpoint</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this webhook endpoint and all its delivery history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

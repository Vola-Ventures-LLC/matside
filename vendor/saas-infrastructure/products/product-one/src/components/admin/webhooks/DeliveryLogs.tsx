import { useState } from "react";
import { useWebhookDeliveries, WebhookDelivery } from "@/hooks/useWebhooks";
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";
import { RefreshCw, FileText, CheckCircle, XCircle, Clock, RotateCw } from "lucide-react";

function DeliveryDetailDialog({
  delivery,
  open,
  onOpenChange,
}: {
  delivery: WebhookDelivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!delivery) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Delivery Details</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Event</p>
              <code className="text-xs bg-muted px-1 rounded">{delivery.event_type}</code>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <StatusBadge status={delivery.status} />
            </div>
            <div>
              <p className="text-muted-foreground">Response Status</p>
              <p>{delivery.response_status || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p>{delivery.duration_ms ? `${delivery.duration_ms}ms` : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Retries</p>
              <p>{delivery.retry_count} / {delivery.max_retries}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{format(new Date(delivery.created_at), "MMM d, HH:mm:ss")}</p>
            </div>
          </div>

          {delivery.error_message && (
            <div>
              <p className="text-sm font-medium text-destructive mb-1">Error</p>
              <pre className="text-xs bg-destructive/10 text-destructive p-2 rounded overflow-x-auto">
                {delivery.error_message}
              </pre>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-1">Payload</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(delivery.payload, null, 2)}
            </pre>
          </div>

          {delivery.response_body && (
            <div>
              <p className="text-sm font-medium mb-1">Response Body</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-[200px]">
                {delivery.response_body}
              </pre>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusBadge({ status }: { status: WebhookDelivery["status"] }) {
  const config = {
    pending: { icon: Clock, className: "bg-yellow-500/10 text-yellow-600" },
    success: { icon: CheckCircle, className: "bg-primary/10 text-primary" },
    failed: { icon: XCircle, className: "bg-destructive/10 text-destructive" },
    retrying: { icon: RotateCw, className: "bg-blue-500/10 text-blue-600" },
  };

  const { icon: Icon, className } = config[status];

  return (
    <Badge className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {status}
    </Badge>
  );
}

export function DeliveryLogs() {
  const { deliveries, isLoading, refetch } = useWebhookDeliveries();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);

  const filteredDeliveries = deliveries.filter((d) =>
    statusFilter === "all" ? true : d.status === statusFilter
  );

  const deliveryColumns: Column<WebhookDelivery>[] = [
    {
      key: "created_at",
      header: "Time",
      render: (delivery) => (
        <span className="whitespace-nowrap">
          {format(new Date(delivery.created_at), "MMM d, HH:mm:ss")}
        </span>
      ),
    },
    {
      key: "endpoint",
      header: "Endpoint",
      render: (delivery) => (
        <span className="max-w-[150px] truncate block">
          {delivery.endpoint?.name || "Unknown"}
        </span>
      ),
    },
    {
      key: "event_type",
      header: "Event",
      render: (delivery) => (
        <code className="text-xs bg-muted px-1 rounded">{delivery.event_type}</code>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (delivery) => <StatusBadge status={delivery.status} />,
    },
    {
      key: "response_status",
      header: "Response",
      render: (delivery) =>
        delivery.response_status ? (
          <Badge variant={delivery.response_status < 300 ? "outline" : "destructive"}>
            {delivery.response_status}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "duration_ms",
      header: "Duration",
      render: (delivery) => (
        <span className="text-muted-foreground">
          {delivery.duration_ms ? `${delivery.duration_ms}ms` : "—"}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading deliveries..." />;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Delivery Logs</CardTitle>
            <CardDescription>Recent webhook delivery attempts</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="retrying">Retrying</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDeliveries.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No deliveries"
              description={statusFilter === "all" ? "Webhook deliveries will appear here" : `No ${statusFilter} deliveries found`}
            />
          ) : (
            <DataTable
              data={filteredDeliveries}
              columns={deliveryColumns}
              onRowClick={(delivery) => setSelectedDelivery(delivery)}
              defaultSortKey="created_at"
              defaultSortDirection="desc"
            />
          )}
        </CardContent>
      </Card>

      <DeliveryDetailDialog
        delivery={selectedDelivery}
        open={!!selectedDelivery}
        onOpenChange={(open) => !open && setSelectedDelivery(null)}
      />
    </>
  );
}

import { useDripSends } from "@/hooks/useDrips";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { ExportButton } from "@/components/admin/ExportButton";
import { RefreshCw, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatDistanceToNow, format } from "date-fns";

interface DripSendsLogProps {
  triggerId?: string;
}

interface DripSend {
  id: string;
  trigger?: { name: string };
  template_name: string;
  user_id: string;
  sent_at: string;
  evaluation_result: any;
}

export function DripSendsLog({ triggerId }: DripSendsLogProps) {
  const { sends, isLoading, refetch } = useDripSends(triggerId);

  const columns: Column<DripSend>[] = [
    {
      key: "trigger",
      header: "Trigger",
      render: (send) => (
        <span className="font-medium">{send.trigger?.name || "Unknown"}</span>
      ),
    },
    {
      key: "template_name",
      header: "Template",
      render: (send) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
          {send.template_name}
        </code>
      ),
    },
    {
      key: "user_id",
      header: "User",
      render: (send) => (
        <span className="font-mono text-xs">{send.user_id.slice(0, 8)}...</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      render: (send) => {
        const result = send.evaluation_result as { triggered?: boolean; reason?: string; email_response?: { success?: boolean; skipped?: boolean } };
        const emailResponse = result?.email_response;
        const wasSkipped = emailResponse?.skipped === true;
        const wasSuccessful = emailResponse?.success === true && !wasSkipped;

        if (wasSkipped) {
          return (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Skipped
            </Badge>
          );
        }
        if (wasSuccessful) {
          return (
            <Badge className="bg-green-500/10 text-green-500 gap-1">
              <CheckCircle className="h-3 w-3" />
              Sent
            </Badge>
          );
        }
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      },
    },
    {
      key: "sent_at",
      header: "Sent",
      render: (send) => (
        <span className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(send.sent_at), { addSuffix: true })}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Drip Send Log</h2>
          <p className="text-muted-foreground">
            Audit trail of all behavior-triggered emails
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={sends.map(s => {
              const result = s.evaluation_result as { email_response?: { success?: boolean; skipped?: boolean } };
              const status = result?.email_response?.skipped ? "skipped" : result?.email_response?.success ? "sent" : "failed";
              return {
                trigger: s.trigger?.name || "Unknown",
                template: s.template_name,
                user_id: s.user_id,
                status,
                sent_at: s.sent_at,
              };
            })}
            filename="drip_sends"
          />
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {sends.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No emails sent yet</h3>
            <p className="text-muted-foreground">
              Behavior-triggered emails will appear here once sent
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sends</CardTitle>
            <CardDescription>
              Showing the last 100 drip emails sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={sends}
              columns={columns}
              defaultSortKey="sent_at"
              defaultSortDirection="desc"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

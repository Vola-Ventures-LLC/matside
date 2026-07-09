import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EndpointsList } from "@/components/admin/webhooks/EndpointsList";
import { DeliveryLogs } from "@/components/admin/webhooks/DeliveryLogs";
import { ApiExplorer } from "@/components/admin/webhooks/ApiExplorer";
import { Webhook, FileText, Code2 } from "lucide-react";

export default function AdminWebhooks() {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Webhook className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure endpoints to receive real-time event notifications
          </p>
        </div>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints" className="gap-2">
            <Webhook className="h-4 w-4" />
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Delivery Logs
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Code2 className="h-4 w-4" />
            API Explorer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints">
          <EndpointsList />
        </TabsContent>

        <TabsContent value="logs">
          <DeliveryLogs />
        </TabsContent>

        <TabsContent value="api">
          <ApiExplorer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilestoneManager } from "@/components/admin/drips/MilestoneManager";
import { DripTriggerManager } from "@/components/admin/drips/DripTriggerManager";
import { DripSendsLog } from "@/components/admin/drips/DripSendsLog";
import { Workflow, Flag, GitBranch, Mail } from "lucide-react";

export default function AdminDrips() {
  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Workflow className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Behavior-Based Drips</h1>
          <p className="text-muted-foreground">
            Personalized email campaigns triggered by user actions and milestones
          </p>
        </div>
      </div>

      <Tabs defaultValue="triggers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="triggers" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Triggers
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2">
            <Flag className="h-4 w-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-2">
            <Mail className="h-4 w-4" />
            Send Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="triggers">
          <DripTriggerManager />
        </TabsContent>

        <TabsContent value="milestones">
          <MilestoneManager />
        </TabsContent>

        <TabsContent value="log">
          <DripSendsLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}

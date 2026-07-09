import { MessageTemplates } from "@/components/admin/MessageTemplates";
import { FileText } from "lucide-react";

export default function AdminTemplates() {
  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            System email templates grouped by sending domain with trigger descriptions
          </p>
        </div>
      </div>

      <MessageTemplates />
    </div>
  );
}

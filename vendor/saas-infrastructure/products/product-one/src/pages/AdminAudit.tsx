import { AuditTrail } from "@/components/admin/AuditTrail";
import { FileSearch } from "lucide-react";

export default function AdminAudit() {
  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <FileSearch className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">
            Review all administrative actions and system events
          </p>
        </div>
      </div>

      <AuditTrail />
    </div>
  );
}

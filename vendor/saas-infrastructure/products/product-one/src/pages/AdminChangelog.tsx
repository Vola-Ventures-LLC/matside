import { Changelog } from "@/components/admin/Changelog";
import { History } from "lucide-react";

export default function AdminChangelog() {
  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <History className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Changelog</h1>
          <p className="text-muted-foreground">
            Document and publish platform updates and releases
          </p>
        </div>
      </div>

      <Changelog />
    </div>
  );
}

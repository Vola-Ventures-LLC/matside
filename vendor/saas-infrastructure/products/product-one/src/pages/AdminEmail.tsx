import { EmailHealth } from "@/components/admin/EmailHealth";
import { MailCheck } from "lucide-react";

export default function AdminEmail() {
  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <MailCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Email Health</h1>
          <p className="text-muted-foreground">
            Monitor email delivery rates and troubleshoot issues
          </p>
        </div>
      </div>

      <EmailHealth />
    </div>
  );
}

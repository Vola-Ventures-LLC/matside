import { useAuth } from "@/hooks/useAuth";
import { AppBillingConfig } from "@/components/admin/billing/AppBillingConfig";
import { Settings } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function AdminBilling() {
  const { isOwner } = useAuth();

  // Only owners can access billing
  if (!isOwner) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Billing Configuration</h1>
          <p className="text-muted-foreground">
            Configure Stripe keys and billing features per app
          </p>
        </div>
      </div>

      <AppBillingConfig />
    </div>
  );
}

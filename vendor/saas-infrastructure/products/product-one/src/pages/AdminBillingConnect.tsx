import { useAuth } from "@/hooks/useAuth";
import { ConnectDashboard } from "@/components/admin/billing/ConnectDashboard";
import { Building2 } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function AdminBillingConnect() {
  const { isOwner } = useAuth();

  if (!isOwner) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Stripe Connect</h1>
          <p className="text-muted-foreground">
            Manage vendor accounts and platform transactions
          </p>
        </div>
      </div>

      <ConnectDashboard />
    </div>
  );
}

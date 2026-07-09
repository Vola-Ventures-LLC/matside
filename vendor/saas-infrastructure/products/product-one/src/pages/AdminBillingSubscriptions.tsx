import { useAuth } from "@/hooks/useAuth";
import { SubscriptionPlans } from "@/components/admin/billing/SubscriptionPlans";
import { CreditCard } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function AdminBillingSubscriptions() {
  const { isOwner } = useAuth();

  if (!isOwner) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">
            Create and manage recurring subscription plans
          </p>
        </div>
      </div>

      <SubscriptionPlans />
    </div>
  );
}

import { useAuth } from "@/hooks/useAuth";
import { CreditPacks } from "@/components/admin/billing/CreditPacks";
import { Coins } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function AdminBillingCredits() {
  const { isOwner } = useAuth();

  if (!isOwner) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Credit Packs</h1>
          <p className="text-muted-foreground">
            Configure credit bundles for users to purchase
          </p>
        </div>
      </div>

      <CreditPacks />
    </div>
  );
}

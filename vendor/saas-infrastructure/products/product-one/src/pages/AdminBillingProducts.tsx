import { useAuth } from "@/hooks/useAuth";
import { OneTimeProducts } from "@/components/admin/billing/OneTimeProducts";
import { Unlock } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function AdminBillingProducts() {
  const { isOwner } = useAuth();

  if (!isOwner) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Unlock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">One-Time Products</h1>
          <p className="text-muted-foreground">
            Feature unlocks and single-purchase products
          </p>
        </div>
      </div>

      <OneTimeProducts />
    </div>
  );
}

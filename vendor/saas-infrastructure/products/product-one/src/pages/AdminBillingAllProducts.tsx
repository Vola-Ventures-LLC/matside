import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import {
  CreditCard,
  Coins,
  Unlock,
  Settings,
  ExternalLink,
  Package,
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price_cents: number;
  interval: string;
  is_active: boolean;
  app_id: string;
  app?: { name: string };
}

interface CreditPack {
  id: string;
  name: string;
  credits_amount: number;
  price_cents: number;
  is_active: boolean;
  app_id: string;
  app?: { name: string };
}

interface OneTimeProduct {
  id: string;
  name: string;
  feature_key: string;
  price_cents: number;
  is_active: boolean;
  app_id: string;
  app?: { name: string };
}

export default function AdminBillingAllProducts() {
  const { isOwner } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [oneTimeProducts, setOneTimeProducts] = useState<OneTimeProduct[]>([]);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    setIsLoading(true);

    const [plansResult, creditsResult, productsResult] = await Promise.all([
      supabase
        .from("subscription_plans")
        .select("*, app:apps(name)")
        .order("name"),
      supabase
        .from("credit_packs")
        .select("*, app:apps(name)")
        .order("name"),
      supabase
        .from("one_time_products")
        .select("*, app:apps(name)")
        .order("name"),
    ]);

    setPlans(plansResult.data || []);
    setCreditPacks(creditsResult.data || []);
    setOneTimeProducts(productsResult.data || []);
    setIsLoading(false);
  };

  if (!isOwner) {
    return <Navigate to="/admin" replace />;
  }

  const formatPrice = (cents: number, interval?: string) => {
    const price = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
    return interval ? `${price}/${interval}` : price;
  };

  const ProductCard = ({
    name,
    price,
    status,
    appName,
    details,
    editLink,
  }: {
    name: string;
    price: string;
    status: boolean;
    appName?: string;
    details?: string;
    editLink: string;
  }) => (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          {appName && (
            <Badge variant="outline" className="text-xs">
              {appName}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {price}
          {details && ` • ${details}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={status ? "default" : "secondary"}>
          {status ? "Active" : "Inactive"}
        </Badge>
        <Button variant="ghost" size="sm" asChild>
          <Link to={editLink}>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">All Products</h1>
            <p className="text-muted-foreground">
              Consolidated view of all billing products across apps
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/billing">
            <Settings className="mr-2 h-4 w-4" />
            Configuration
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading products..." />
        </div>
      ) : (
        <Tabs defaultValue="subscriptions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Subscriptions ({plans.length})
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-2">
              <Coins className="h-4 w-4" />
              Credit Packs ({creditPacks.length})
            </TabsTrigger>
            <TabsTrigger value="onetime" className="gap-2">
              <Unlock className="h-4 w-4" />
              One-Time ({oneTimeProducts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>
                      Recurring billing plans for users and organizations
                    </CardDescription>
                  </div>
                  <Button asChild>
                    <Link to="/admin/billing/subscriptions">Manage Plans</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {plans.length === 0 ? (
                  <EmptyState
                    icon={CreditCard}
                    title="No subscription plans"
                    description="Create your first subscription plan"
                  />
                ) : (
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <ProductCard
                        key={plan.id}
                        name={plan.name}
                        price={formatPrice(plan.price_cents, plan.interval)}
                        status={plan.is_active}
                        appName={plan.app?.name}
                        editLink="/admin/billing/subscriptions"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Credit Packs</CardTitle>
                    <CardDescription>
                      Pre-paid credit bundles for consumption-based features
                    </CardDescription>
                  </div>
                  <Button asChild>
                    <Link to="/admin/billing/credits">Manage Packs</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {creditPacks.length === 0 ? (
                  <EmptyState
                    icon={Coins}
                    title="No credit packs"
                    description="Create your first credit pack"
                  />
                ) : (
                  <div className="space-y-3">
                    {creditPacks.map((pack) => (
                      <ProductCard
                        key={pack.id}
                        name={pack.name}
                        price={formatPrice(pack.price_cents)}
                        status={pack.is_active}
                        appName={pack.app?.name}
                        details={`${pack.credits_amount} credits`}
                        editLink="/admin/billing/credits"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="onetime">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>One-Time Products</CardTitle>
                    <CardDescription>
                      Feature unlocks and single-purchase products
                    </CardDescription>
                  </div>
                  <Button asChild>
                    <Link to="/admin/billing/products">Manage Products</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {oneTimeProducts.length === 0 ? (
                  <EmptyState
                    icon={Unlock}
                    title="No one-time products"
                    description="Create your first feature unlock"
                  />
                ) : (
                  <div className="space-y-3">
                    {oneTimeProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        name={product.name}
                        price={formatPrice(product.price_cents)}
                        status={product.is_active}
                        appName={product.app?.name}
                        details={product.feature_key}
                        editLink="/admin/billing/products"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

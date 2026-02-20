import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@saas-infra/auth/provider";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@saas-infra/ui/card";
import { Button } from "@saas-infra/ui/button";
import { Input } from "@saas-infra/ui/input";
import { Label } from "@saas-infra/ui/label";
import { Switch } from "@saas-infra/ui/switch";
import { Badge } from "@saas-infra/ui/badge";
import { Textarea } from "@saas-infra/ui/textarea";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@saas-infra/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@saas-infra/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@saas-infra/ui/table";
import {
  CreditCard, Plus, Pencil, Users, Building2,
} from "lucide-react";

interface App {
  id: string;
  name: string;
  slug: string;
}

interface SubscriptionPlan {
  id: string;
  app_id: string;
  name: string;
  description: string | null;
  entity_type: "user" | "organization";
  billing_type: "seat_based" | "flat_rate";
  price_cents: number;
  currency: string;
  interval: string;
  trial_days: number;
  seat_minimum: number;
  seat_price_cents: number | null;
  features: unknown;
  is_active: boolean;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
}

interface SubscriptionPlansProps {
  emptyState?: React.ReactNode;
  loadingSpinner?: React.ReactNode;
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string) => void;
}

export function SubscriptionPlans({
  emptyState,
  loadingSpinner,
  onError,
  onSuccess,
}: SubscriptionPlansProps) {
  const supabase = useSupabase();
  const [apps, setApps] = useState<App[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    entity_type: "user" as "user" | "organization",
    billing_type: "flat_rate" as "seat_based" | "flat_rate",
    price_cents: 0,
    currency: "usd",
    interval: "month",
    trial_days: 0,
    seat_minimum: 1,
    seat_price_cents: 0,
    features: "",
    is_active: true,
  });

  const fetchApps = useCallback(async () => {
    const { data } = await supabase
      .from("apps")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name");

    if (data && data.length > 0) {
      setApps(data);
      setSelectedAppId(data[0].id);
    }
    setIsLoading(false);
  }, [supabase]);

  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("app_id", selectedAppId)
      .order("sort_order");

    if (error) {
      onError?.("Failed to fetch plans", error.message);
    } else {
      setPlans(data || []);
    }
  }, [supabase, selectedAppId, onError]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    if (selectedAppId) {
      fetchPlans();
    }
  }, [selectedAppId, fetchPlans]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      entity_type: "user",
      billing_type: "flat_rate",
      price_cents: 0,
      currency: "usd",
      interval: "month",
      trial_days: 0,
      seat_minimum: 1,
      seat_price_cents: 0,
      features: "",
      is_active: true,
    });
    setEditingPlan(null);
  };

  const handleOpenDialog = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || "",
        entity_type: plan.entity_type,
        billing_type: plan.billing_type,
        price_cents: plan.price_cents,
        currency: plan.currency,
        interval: plan.interval,
        trial_days: plan.trial_days || 0,
        seat_minimum: plan.seat_minimum || 1,
        seat_price_cents: plan.seat_price_cents || 0,
        features: Array.isArray(plan.features) ? (plan.features as string[]).join("\n") : "",
        is_active: plan.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!formData.name.trim()) {
      onError?.("Validation Error", "Plan name is required");
      return;
    }

    const features = formData.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const planData = {
      app_id: selectedAppId,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      entity_type: formData.entity_type,
      billing_type: formData.billing_type,
      price_cents: formData.price_cents,
      currency: formData.currency,
      interval: formData.interval,
      trial_days: formData.trial_days,
      seat_minimum: formData.seat_minimum,
      seat_price_cents:
        formData.billing_type === "seat_based" ? formData.seat_price_cents : null,
      features,
      is_active: formData.is_active,
    };

    if (editingPlan) {
      const { error } = await supabase
        .from("subscription_plans")
        .update(planData)
        .eq("id", editingPlan.id);

      if (error) {
        onError?.("Failed to update plan", error.message);
      } else {
        onSuccess?.("Plan updated successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchPlans();
      }
    } else {
      const { error } = await supabase.from("subscription_plans").insert(planData);

      if (error) {
        onError?.("Failed to create plan", error.message);
      } else {
        onSuccess?.("Plan created successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchPlans();
      }
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          {loadingSpinner || <div className="text-center text-muted-foreground">Loading plans...</div>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>
                Create and manage subscription plans for users and organizations
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {apps.length > 0 && (
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select app" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <SheetTrigger asChild>
                <Button onClick={() => handleOpenDialog()} disabled={!selectedAppId}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Plan
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    {editingPlan ? "Edit Plan" : "Create Subscription Plan"}
                  </SheetTitle>
                  <SheetDescription>
                    Configure the subscription plan details
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plan Name</Label>
                      <Input
                        placeholder="Pro Plan"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Entity Type</Label>
                      <Select
                        value={formData.entity_type}
                        onValueChange={(value: "user" | "organization") =>
                          setFormData({ ...formData, entity_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="organization">Organization</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Best for growing teams"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Billing Type</Label>
                      <Select
                        value={formData.billing_type}
                        onValueChange={(value: "seat_based" | "flat_rate") =>
                          setFormData({ ...formData, billing_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat_rate">Flat Rate</SelectItem>
                          <SelectItem value="seat_based">Per Seat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Billing Interval</Label>
                      <Select
                        value={formData.interval}
                        onValueChange={(value) =>
                          setFormData({ ...formData, interval: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Monthly</SelectItem>
                          <SelectItem value="year">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (cents)</Label>
                      <Input
                        type="number"
                        placeholder="2999"
                        value={formData.price_cents || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price_cents: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(formData.price_cents, formData.currency)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Trial Days</Label>
                      <Input
                        type="number"
                        placeholder="14"
                        value={formData.trial_days || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            trial_days: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  {formData.billing_type === "seat_based" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Seats</Label>
                        <Input
                          type="number"
                          value={formData.seat_minimum || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              seat_minimum: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price Per Seat (cents)</Label>
                        <Input
                          type="number"
                          value={formData.seat_price_cents || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              seat_price_cents: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Features (one per line)</Label>
                    <Textarea
                      placeholder={"Unlimited projects\nPriority support\nAdvanced analytics"}
                      value={formData.features}
                      onChange={(e) =>
                        setFormData({ ...formData, features: e.target.value })
                      }
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <SheetFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePlan}>
                    {editingPlan ? "Update Plan" : "Create Plan"}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {apps.length === 0 ? (
          emptyState || <div className="text-center py-8 text-muted-foreground">No apps configured. Create an app first to add subscription plans.</div>
        ) : plans.length === 0 ? (
          emptyState || <div className="text-center py-8 text-muted-foreground">No subscription plans. Create your first subscription plan to start monetizing.</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Trial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stripe</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        {plan.description && (
                          <p className="text-xs text-muted-foreground">
                            {plan.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {plan.entity_type === "user" ? (
                          <Users className="mr-1 h-3 w-3" />
                        ) : (
                          <Building2 className="mr-1 h-3 w-3" />
                        )}
                        {plan.entity_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{plan.billing_type.replace("_", " ")}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatPrice(plan.price_cents, plan.currency)}
                      </span>
                      <span className="text-muted-foreground">/{plan.interval}</span>
                    </TableCell>
                    <TableCell>
                      {plan.trial_days > 0 ? `${plan.trial_days} days` : "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {plan.stripe_price_id ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          Synced
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not synced</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { StripeSetupBanner } from "./StripeSetupBanner";
import {
  Settings,
  Plus,
  CreditCard,
  CheckCircle2,
  XCircle,
  Pencil,
} from "lucide-react";

interface App {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

interface AppStripeConfig {
  id: string;
  app_id: string;
  stripe_publishable_key: string | null;
  is_configured: boolean;
  platform_fee_percent: number;
  subscriptions_enabled: boolean;
  credits_enabled: boolean;
  one_time_enabled: boolean;
  connect_enabled: boolean;
}

export function AppBillingConfig() {
  const [apps, setApps] = useState<App[]>([]);
  const [configs, setConfigs] = useState<Record<string, AppStripeConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewAppDialogOpen, setIsNewAppDialogOpen] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppSlug, setNewAppSlug] = useState("");
  const [newAppDescription, setNewAppDescription] = useState("");

  useEffect(() => {
    fetchAppsAndConfigs();
  }, []);

  const fetchAppsAndConfigs = async () => {
    setIsLoading(true);

    const [appsResult, configsResult] = await Promise.all([
      supabase.from("apps").select("*").order("name"),
      supabase.from("app_stripe_configs").select("*"),
    ]);

    if (appsResult.error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch apps",
        description: appsResult.error.message,
      });
    } else {
      setApps(appsResult.data || []);
    }

    if (configsResult.data) {
      const configMap: Record<string, AppStripeConfig> = {};
      configsResult.data.forEach((config) => {
        configMap[config.app_id] = config;
      });
      setConfigs(configMap);
    }

    setIsLoading(false);
  };

  const handleCreateApp = async () => {
    if (!newAppName.trim() || !newAppSlug.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "App name and slug are required",
      });
      return;
    }

    const { data, error } = await supabase
      .from("apps")
      .insert({
        name: newAppName.trim(),
        slug: newAppSlug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: newAppDescription.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to create app",
        description: error.message,
      });
    } else {
      // Create empty stripe config for the app
      await supabase.from("app_stripe_configs").insert({
        app_id: data.id,
      });

      toast({
        title: "App created",
        description: `${newAppName} has been created successfully`,
      });
      setIsNewAppDialogOpen(false);
      setNewAppName("");
      setNewAppSlug("");
      setNewAppDescription("");
      fetchAppsAndConfigs();
    }
  };

  const handleToggleFeature = async (
    appId: string,
    feature: keyof Pick<
      AppStripeConfig,
      "subscriptions_enabled" | "credits_enabled" | "one_time_enabled" | "connect_enabled"
    >,
    value: boolean
  ) => {
    const config = configs[appId];
    if (!config) return;

    const { error } = await supabase
      .from("app_stripe_configs")
      .update({ [feature]: value })
      .eq("id", config.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: error.message,
      });
    } else {
      setConfigs((prev) => ({
        ...prev,
        [appId]: { ...prev[appId], [feature]: value },
      }));
    }
  };

  const handleUpdatePlatformFee = async (appId: string, feePercent: number) => {
    const config = configs[appId];
    if (!config) return;

    const { error } = await supabase
      .from("app_stripe_configs")
      .update({ platform_fee_percent: feePercent })
      .eq("id", config.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: error.message,
      });
    } else {
      setConfigs((prev) => ({
        ...prev,
        [appId]: { ...prev[appId], platform_fee_percent: feePercent },
      }));
      toast({
        title: "Platform fee updated",
        description: `Fee set to ${feePercent}%`,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingSpinner size="lg" text="Loading apps..." />
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
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>App Billing Configuration</CardTitle>
              <CardDescription>
                Configure Stripe keys and billing features per app
              </CardDescription>
            </div>
          </div>
          <Sheet open={isNewAppDialogOpen} onOpenChange={setIsNewAppDialogOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add App
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create New App</SheetTitle>
                <SheetDescription>
                  Add a new app to configure its billing settings
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name">App Name</Label>
                  <Input
                    id="app-name"
                    placeholder="My SaaS App"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-slug">Slug</Label>
                  <Input
                    id="app-slug"
                    placeholder="my-saas-app"
                    value={newAppSlug}
                    onChange={(e) => setNewAppSlug(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-description">Description (optional)</Label>
                  <Input
                    id="app-description"
                    placeholder="A brief description of your app"
                    value={newAppDescription}
                    onChange={(e) => setNewAppDescription(e.target.value)}
                  />
                </div>
              </div>
              <SheetFooter>
                <Button variant="outline" onClick={() => setIsNewAppDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateApp}>Create App</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {apps.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No apps configured"
            description="Create your first app to start configuring billing"
          />
        ) : (
          apps.map((app) => {
            const config = configs[app.id];
            const isConfigured = config?.is_configured ?? false;

            return (
              <div
                key={app.id}
                className="rounded-lg border bg-card p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{app.name}</h3>
                      <Badge variant="outline">{app.slug}</Badge>
                    </div>
                    {isConfigured ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Stripe Configured
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-amber-600">
                        <XCircle className="mr-1 h-3 w-3" />
                        Needs Setup
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

                {!isConfigured && <StripeSetupBanner isConfigured={isConfigured} appName={app.name} />}

                {config && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">Subscriptions</p>
                        <p className="text-xs text-muted-foreground">
                          Recurring billing
                        </p>
                      </div>
                      <Switch
                        checked={config.subscriptions_enabled}
                        onCheckedChange={(checked) =>
                          handleToggleFeature(app.id, "subscriptions_enabled", checked)
                        }
                        disabled={!isConfigured}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">Credits</p>
                        <p className="text-xs text-muted-foreground">
                          Credit packs
                        </p>
                      </div>
                      <Switch
                        checked={config.credits_enabled}
                        onCheckedChange={(checked) =>
                          handleToggleFeature(app.id, "credits_enabled", checked)
                        }
                        disabled={!isConfigured}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">One-Time</p>
                        <p className="text-xs text-muted-foreground">
                          Feature unlocks
                        </p>
                      </div>
                      <Switch
                        checked={config.one_time_enabled}
                        onCheckedChange={(checked) =>
                          handleToggleFeature(app.id, "one_time_enabled", checked)
                        }
                        disabled={!isConfigured}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">Connect</p>
                        <p className="text-xs text-muted-foreground">
                          Platform fees
                        </p>
                      </div>
                      <Switch
                        checked={config.connect_enabled}
                        onCheckedChange={(checked) =>
                          handleToggleFeature(app.id, "connect_enabled", checked)
                        }
                        disabled={!isConfigured}
                      />
                    </div>
                  </div>
                )}

                {config?.connect_enabled && (
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <Label htmlFor={`fee-${app.id}`} className="text-sm">
                      Platform Fee %
                    </Label>
                    <Select
                      value={String(config.platform_fee_percent)}
                      onValueChange={(value) =>
                        handleUpdatePlatformFee(app.id, parseFloat(value))
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 30].map((fee) => (
                          <SelectItem key={fee} value={String(fee)}>
                            {fee}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect, useCallback } from "react";
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
import { Coins, Plus, Pencil, Trash2 } from "lucide-react";

interface App {
  id: string;
  name: string;
  slug: string;
}

interface CreditPack {
  id: string;
  app_id: string;
  name: string;
  description: string | null;
  credits_amount: number;
  price_cents: number;
  currency: string;
  expiry_days: number | null;
  is_active: boolean;
  stripe_price_id: string | null;
}

export function CreditPacks() {
  const [apps, setApps] = useState<App[]>([]);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<CreditPack | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    credits_amount: 100,
    price_cents: 999,
    currency: "usd",
    expiry_days: null as number | null,
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
  }, []);

  const fetchPacks = useCallback(async () => {
    const { data, error } = await supabase
      .from("credit_packs")
      .select("*")
      .eq("app_id", selectedAppId)
      .order("sort_order");

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch credit packs",
        description: error.message,
      });
    } else {
      setPacks(data || []);
    }
  }, [selectedAppId]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    if (selectedAppId) {
      fetchPacks();
    }
  }, [selectedAppId, fetchPacks]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      credits_amount: 100,
      price_cents: 999,
      currency: "usd",
      expiry_days: null,
      is_active: true,
    });
    setEditingPack(null);
  };

  const handleOpenDialog = (pack?: CreditPack) => {
    if (pack) {
      setEditingPack(pack);
      setFormData({
        name: pack.name,
        description: pack.description || "",
        credits_amount: pack.credits_amount,
        price_cents: pack.price_cents,
        currency: pack.currency,
        expiry_days: pack.expiry_days,
        is_active: pack.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSavePack = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Pack name is required",
      });
      return;
    }

    const packData = {
      app_id: selectedAppId,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      credits_amount: formData.credits_amount,
      price_cents: formData.price_cents,
      currency: formData.currency,
      expiry_days: formData.expiry_days,
      is_active: formData.is_active,
    };

    if (editingPack) {
      const { error } = await supabase
        .from("credit_packs")
        .update(packData)
        .eq("id", editingPack.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to update pack",
          description: error.message,
        });
      } else {
        toast({ title: "Credit pack updated" });
        setIsDialogOpen(false);
        resetForm();
        fetchPacks();
      }
    } else {
      const { error } = await supabase.from("credit_packs").insert(packData);

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to create pack",
          description: error.message,
        });
      } else {
        toast({ title: "Credit pack created" });
        setIsDialogOpen(false);
        resetForm();
        fetchPacks();
      }
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const calculateCostPerCredit = (price: number, credits: number) => {
    return (price / credits).toFixed(2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingSpinner size="lg" text="Loading credit packs..." />
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
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Credit Packs</CardTitle>
              <CardDescription>
                Configure credit bundles for users to purchase
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
                  Add Pack
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    {editingPack ? "Edit Credit Pack" : "Create Credit Pack"}
                  </SheetTitle>
                  <SheetDescription>
                    Configure the credit pack details
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Pack Name</Label>
                    <Input
                      placeholder="Starter Pack"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Perfect for getting started"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Credits Amount</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={formData.credits_amount || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            credits_amount: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (cents)</Label>
                      <Input
                        type="number"
                        placeholder="999"
                        value={formData.price_cents || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price_cents: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(formData.price_cents, formData.currency)} (
                        {calculateCostPerCredit(
                          formData.price_cents,
                          formData.credits_amount
                        )}
                        ¢ per credit)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Expiry (days after purchase, leave empty for no expiry)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={formData.expiry_days ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expiry_days: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
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
                  <Button onClick={handleSavePack}>
                    {editingPack ? "Update Pack" : "Create Pack"}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {apps.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No apps configured"
            description="Create an app first to add credit packs"
          />
        ) : packs.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No credit packs"
            description="Create your first credit pack"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{pack.name}</h3>
                    {pack.description && (
                      <p className="text-sm text-muted-foreground">
                        {pack.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={pack.is_active ? "default" : "secondary"}>
                    {pack.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {pack.credits_amount.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">credits</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    {formatPrice(pack.price_cents, pack.currency)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {calculateCostPerCredit(pack.price_cents, pack.credits_amount)}¢
                    each
                  </span>
                </div>

                {pack.expiry_days && (
                  <p className="text-xs text-muted-foreground">
                    Expires {pack.expiry_days} days after purchase
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  {pack.stripe_price_id ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      Synced to Stripe
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not synced</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(pack)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

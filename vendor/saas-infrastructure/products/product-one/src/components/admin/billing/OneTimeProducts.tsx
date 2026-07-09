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
import { Unlock, Plus, Pencil, Infinity as InfinityIcon, Clock } from "lucide-react";

interface App {
  id: string;
  name: string;
  slug: string;
}

interface OneTimeProduct {
  id: string;
  app_id: string;
  name: string;
  description: string | null;
  feature_key: string;
  price_cents: number;
  currency: string;
  duration_days: number | null;
  is_active: boolean;
  stripe_price_id: string | null;
}

export function OneTimeProducts() {
  const [apps, setApps] = useState<App[]>([]);
  const [products, setProducts] = useState<OneTimeProduct[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<OneTimeProduct | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    feature_key: "",
    price_cents: 2999,
    currency: "usd",
    duration_days: null as number | null,
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

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("one_time_products")
      .select("*")
      .eq("app_id", selectedAppId)
      .order("created_at");

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch products",
        description: error.message,
      });
    } else {
      setProducts(data || []);
    }
  }, [selectedAppId]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    if (selectedAppId) {
      fetchProducts();
    }
  }, [selectedAppId, fetchProducts]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      feature_key: "",
      price_cents: 2999,
      currency: "usd",
      duration_days: null,
      is_active: true,
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: OneTimeProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        feature_key: product.feature_key,
        price_cents: product.price_cents,
        currency: product.currency,
        duration_days: product.duration_days,
        is_active: product.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name.trim() || !formData.feature_key.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name and feature key are required",
      });
      return;
    }

    const productData = {
      app_id: selectedAppId,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      feature_key: formData.feature_key.trim().toLowerCase().replace(/\s+/g, "_"),
      price_cents: formData.price_cents,
      currency: formData.currency,
      duration_days: formData.duration_days,
      is_active: formData.is_active,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("one_time_products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to update product",
          description: error.message,
        });
      } else {
        toast({ title: "Product updated" });
        setIsDialogOpen(false);
        resetForm();
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from("one_time_products").insert(productData);

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to create product",
          description: error.message,
        });
      } else {
        toast({ title: "Product created" });
        setIsDialogOpen(false);
        resetForm();
        fetchProducts();
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
          <LoadingSpinner size="lg" text="Loading products..." />
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
              <Unlock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>One-Time Products</CardTitle>
              <CardDescription>
                Feature unlocks and single-purchase products
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
                  Add Product
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    {editingProduct ? "Edit Product" : "Create One-Time Product"}
                  </SheetTitle>
                  <SheetDescription>
                    Configure a feature unlock or one-time purchase
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input
                      placeholder="Premium Export Feature"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Feature Key</Label>
                    <Input
                      placeholder="premium_export"
                      value={formData.feature_key}
                      onChange={(e) =>
                        setFormData({ ...formData, feature_key: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Used in code to check if feature is unlocked
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Export data in multiple formats"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
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
                      <Label>Duration (days)</Label>
                      <Input
                        type="number"
                        placeholder="Leave empty for permanent"
                        value={formData.duration_days ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration_days: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.duration_days
                          ? `Access for ${formData.duration_days} days`
                          : "Permanent access"}
                      </p>
                    </div>
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
                  <Button onClick={handleSaveProduct}>
                    {editingProduct ? "Update Product" : "Create Product"}
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
            icon={Unlock}
            title="No apps configured"
            description="Create an app first to add products"
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Unlock}
            title="No one-time products"
            description="Create your first feature unlock"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {product.feature_key}
                    </code>
                  </div>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {product.description && (
                  <p className="text-sm text-muted-foreground">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    {formatPrice(product.price_cents, product.currency)}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {product.duration_days ? (
                      <>
                        <Clock className="h-4 w-4" />
                        {product.duration_days} days
                      </>
                    ) : (
                      <>
                        <InfinityIcon className="h-4 w-4" />
                        Permanent
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  {product.stripe_price_id ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      Synced to Stripe
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not synced</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(product)}
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

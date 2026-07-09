import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Layers, Plus, Edit, Save, X, Percent } from "lucide-react";

interface AffiliateTier {
  id: string;
  name: string;
  commission_percent: number;
  min_revenue_cents: number;
  max_revenue_cents: number | null;
  is_active: boolean;
  sort_order: number | null;
}

export default function AdminAffiliateTiers() {
  const [tiers, setTiers] = useState<AffiliateTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<AffiliateTier | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    const { data, error } = await supabase
      .from("affiliate_tiers")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching tiers:", error);
    } else {
      setTiers(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedTier) return;

    setSaving(true);

    if (isNew) {
      const { error } = await supabase.from("affiliate_tiers").insert({
        name: selectedTier.name,
        commission_percent: selectedTier.commission_percent,
        min_revenue_cents: selectedTier.min_revenue_cents,
        max_revenue_cents: selectedTier.max_revenue_cents,
        is_active: selectedTier.is_active,
        sort_order: tiers.length,
      });

      if (error) {
        toast({ variant: "destructive", title: "Failed to create tier", description: error.message });
      } else {
        toast({ title: "Tier created", description: `${selectedTier.name} tier has been added.` });
        logAction({ action: "CREATE_AFFILIATE_TIER", details: { tier_name: selectedTier.name } });
        setSelectedTier(null);
        fetchTiers();
      }
    } else {
      const { error } = await supabase
        .from("affiliate_tiers")
        .update({
          name: selectedTier.name,
          commission_percent: selectedTier.commission_percent,
          min_revenue_cents: selectedTier.min_revenue_cents,
          max_revenue_cents: selectedTier.max_revenue_cents,
          is_active: selectedTier.is_active,
        })
        .eq("id", selectedTier.id);

      if (error) {
        toast({ variant: "destructive", title: "Failed to update tier", description: error.message });
      } else {
        toast({ title: "Tier updated", description: `${selectedTier.name} tier has been updated.` });
        logAction({ action: "UPDATE_AFFILIATE_TIER", details: { tier_id: selectedTier.id, tier_name: selectedTier.name } });
        setSelectedTier(null);
        fetchTiers();
      }
    }

    setSaving(false);
  };

  const openNewTier = () => {
    setIsNew(true);
    setSelectedTier({
      id: "",
      name: "",
      commission_percent: 10,
      min_revenue_cents: 0,
      max_revenue_cents: null,
      is_active: true,
      sort_order: null,
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading tiers..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/affiliates">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Commission Tiers</h1>
              <p className="text-muted-foreground">
                Define commission rates based on affiliate performance
              </p>
            </div>
          </div>
        </div>
        <Button onClick={openNewTier}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tier
        </Button>
      </div>

      {/* Tiers List */}
      <Card>
        <CardHeader>
          <CardDescription>
            Higher tiers with better commission rates unlock as affiliates generate more revenue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tiers.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No tiers configured"
              description="Create commission tiers to reward your top affiliates"
              actionLabel="Add First Tier"
              onAction={openNewTier}
            />
          ) : (
            <div className="space-y-3">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Percent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{tier.name}</p>
                        {!tier.is_active && (
                          <Badge variant="outline" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(tier.min_revenue_cents)}
                        {tier.max_revenue_cents
                          ? ` – ${formatCurrency(tier.max_revenue_cents)}`
                          : "+"} revenue
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{tier.commission_percent}%</p>
                      <p className="text-xs text-muted-foreground">commission</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsNew(false);
                        setSelectedTier(tier);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <Sheet open={!!selectedTier} onOpenChange={(open) => !open && setSelectedTier(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{isNew ? "Create Tier" : "Edit Tier"}</SheetTitle>
            <SheetDescription>
              {isNew ? "Add a new commission tier" : "Update tier settings"}
            </SheetDescription>
          </SheetHeader>
          {selectedTier && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tier Name</Label>
                <Input
                  id="name"
                  value={selectedTier.name}
                  onChange={(e) => setSelectedTier({ ...selectedTier, name: e.target.value })}
                  placeholder="e.g., Gold, Platinum"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission">Commission Rate (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min={0}
                  max={100}
                  value={selectedTier.commission_percent}
                  onChange={(e) =>
                    setSelectedTier({ ...selectedTier, commission_percent: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_revenue">Minimum Revenue ($)</Label>
                <Input
                  id="min_revenue"
                  type="number"
                  min={0}
                  value={selectedTier.min_revenue_cents / 100}
                  onChange={(e) =>
                    setSelectedTier({
                      ...selectedTier,
                      min_revenue_cents: Math.round(parseFloat(e.target.value) * 100) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Affiliate must generate at least this much to qualify
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_revenue">Maximum Revenue ($)</Label>
                <Input
                  id="max_revenue"
                  type="number"
                  min={0}
                  value={selectedTier.max_revenue_cents ? selectedTier.max_revenue_cents / 100 : ""}
                  onChange={(e) =>
                    setSelectedTier({
                      ...selectedTier,
                      max_revenue_cents: e.target.value
                        ? Math.round(parseFloat(e.target.value) * 100)
                        : null,
                    })
                  }
                  placeholder="No limit"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited (top tier)
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={selectedTier.is_active}
                  onCheckedChange={(checked) => setSelectedTier({ ...selectedTier, is_active: checked })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedTier(null)} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !selectedTier.name}>
                  {saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {isNew ? "Create" : "Save"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

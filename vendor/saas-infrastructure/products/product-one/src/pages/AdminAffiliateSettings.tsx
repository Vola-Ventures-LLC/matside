import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Settings, Save } from "lucide-react";

interface AffiliateSettings {
  id: string;
  attribution_window_days: number;
  holdback_period_days: number;
  minimum_payout_cents: number;
  auto_approve_referrers: boolean;
  allow_self_referral: boolean;
}

export default function AdminAffiliateSettings() {
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("affiliate_settings")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching settings:", error);
    }

    if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);

    const { error } = await supabase
      .from("affiliate_settings")
      .update({
        attribution_window_days: settings.attribution_window_days,
        holdback_period_days: settings.holdback_period_days,
        minimum_payout_cents: settings.minimum_payout_cents,
        auto_approve_referrers: settings.auto_approve_referrers,
        allow_self_referral: settings.allow_self_referral,
      })
      .eq("id", settings.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to save settings",
        description: error.message,
      });
    } else {
      toast({
        title: "Settings saved",
        description: "Affiliate program settings have been updated.",
      });
      logAction({
        action: "UPDATE_AFFILIATE_SETTINGS",
        details: {
          attribution_window_days: settings.attribution_window_days,
          holdback_period_days: settings.holdback_period_days,
          minimum_payout_cents: settings.minimum_payout_cents,
        },
      });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-8 animate-in">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/affiliates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Affiliates
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No affiliate settings found. Please initialize the affiliate program.</p>
          </CardContent>
        </Card>
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
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Program Settings</h1>
              <p className="text-muted-foreground">
                Configure affiliate program behavior
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attribution Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Attribution</CardTitle>
            <CardDescription>
              How long referrals are tracked after signup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attribution_window">Attribution Window (days)</Label>
              <Input
                id="attribution_window"
                type="number"
                min={1}
                max={365}
                value={settings.attribution_window_days}
                onChange={(e) =>
                  setSettings({ ...settings, attribution_window_days: parseInt(e.target.value) || 30 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Affiliates earn commissions on purchases made within this window after a referral signs up.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payout Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>
              Commission payout rules and thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="holdback_period">Holdback Period (days)</Label>
              <Input
                id="holdback_period"
                type="number"
                min={0}
                max={90}
                value={settings.holdback_period_days}
                onChange={(e) =>
                  setSettings({ ...settings, holdback_period_days: parseInt(e.target.value) || 14 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Commissions are held for this period to account for refunds before becoming payable.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum_payout">Minimum Payout ($)</Label>
              <Input
                id="minimum_payout"
                type="number"
                min={1}
                step={1}
                value={settings.minimum_payout_cents / 100}
                onChange={(e) =>
                  setSettings({ ...settings, minimum_payout_cents: Math.round(parseFloat(e.target.value) * 100) || 5000 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Affiliates must earn at least this amount before requesting a payout.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Program Rules */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Program Rules</CardTitle>
            <CardDescription>
              Control affiliate enrollment and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto_approve">Auto-Approve Referrers</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically approve affiliate applications without manual review
                </p>
              </div>
              <Switch
                id="auto_approve"
                checked={settings.auto_approve_referrers}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, auto_approve_referrers: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="self_referral">Allow Self-Referral</Label>
                <p className="text-sm text-muted-foreground">
                  Allow affiliates to use their own referral code for purchases
                </p>
              </div>
              <Switch
                id="self_referral"
                checked={settings.allow_self_referral}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allow_self_referral: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

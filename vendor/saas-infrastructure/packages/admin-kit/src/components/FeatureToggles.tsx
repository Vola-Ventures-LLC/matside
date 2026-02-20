import { useAppFeatures } from "../hooks/useAppFeatures";
import { useAuditLog } from "../hooks/useAuditLog";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@saas-infra/ui/card";
import { Switch } from "@saas-infra/ui/switch";
import { Label } from "@saas-infra/ui/label";
import { Newspaper, Gift, ToggleLeft, MessageSquare, Building2 } from "lucide-react";

import type { FeatureKey } from "../hooks/useAppFeatures";

interface FeatureTogglesProps {
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}

export function FeatureToggles({ onError, onSuccess }: FeatureTogglesProps) {
  const { features, loading, updateFeature } = useAppFeatures({ onError, onSuccess });
  const { logAction } = useAuditLog();

  const handleToggle = async (feature: FeatureKey, value: boolean) => {
    const success = await updateFeature(feature, value);
    if (success) {
      logAction({
        action: "UPDATE_FEATURE_TOGGLE",
        details: { feature, enabled: value },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        Loading features...
      </div>
    );
  }

  if (!features) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Unable to load feature settings. Please ensure an app is configured.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ToggleLeft className="h-5 w-5" />
          Feature Toggles
        </CardTitle>
        <CardDescription>
          Enable or disable major features across your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="blog-toggle" className="text-base font-medium cursor-pointer">
                Blog System
              </Label>
              <p className="text-sm text-muted-foreground">
                Public blog with categories, tags, and SEO support
              </p>
            </div>
          </div>
          <Switch
            id="blog-toggle"
            checked={features.blog_enabled}
            onCheckedChange={(checked) => handleToggle("blog_enabled", checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="referrals-toggle" className="text-base font-medium cursor-pointer">
                Referral Program
              </Label>
              <p className="text-sm text-muted-foreground">
                Affiliate system with tiered commissions and payouts
              </p>
            </div>
          </div>
          <Switch
            id="referrals-toggle"
            checked={features.referrals_enabled}
            onCheckedChange={(checked) => handleToggle("referrals_enabled", checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="sms-toggle" className="text-base font-medium cursor-pointer">
                SMS / Twilio
              </Label>
              <p className="text-sm text-muted-foreground">
                Phone verification, 2FA via SMS, and transactional messages
              </p>
            </div>
          </div>
          <Switch
            id="sms-toggle"
            checked={features.sms_enabled}
            onCheckedChange={(checked) => handleToggle("sms_enabled", checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="orgs-toggle" className="text-base font-medium cursor-pointer">
                Organizations
              </Label>
              <p className="text-sm text-muted-foreground">
                Multi-org support with role-based permissions and context switching
              </p>
            </div>
          </div>
          <Switch
            id="orgs-toggle"
            checked={features.orgs_enabled}
            onCheckedChange={(checked) => handleToggle("orgs_enabled", checked)}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Disabling a feature hides it from navigation but preserves all data. Re-enable anytime to restore access.
        </p>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DataTable, Column } from "@/components/ui/data-table";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import {
  Gift,
  Copy,
  Check,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

interface AffiliateProfile {
  id: string;
  affiliate_type: string;
  status: string;
  payout_method: string;
  created_at: string;
}

interface ReferralCode {
  id: string;
  code: string;
  description: string | null;
  is_active: boolean;
  uses_count: number;
  created_at: string;
}

interface Referral {
  id: string;
  referred_user_id: string;
  attributed_at: string;
  first_purchase_at: string | null;
  total_revenue_cents: number;
  total_commission_cents: number;
}

interface AffiliateTier {
  id: string;
  name: string;
  min_revenue_cents: number;
  max_revenue_cents: number | null;
  commission_percent: number;
}

interface CommissionEvent {
  id: string;
  gross_amount_cents: number;
  commission_percent: number;
  commission_cents: number;
  status: string;
  created_at: string;
  source_type: string;
}

export default function Referrals() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<AffiliateProfile | null>(null);
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [tiers, setTiers] = useState<AffiliateTier[]>([]);
  const [commissions, setCommissions] = useState<CommissionEvent[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [newCodeDescription, setNewCodeDescription] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Fetch affiliate profile
    const { data: affiliateData } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", user?.id)
      .maybeSingle();

    setAffiliate(affiliateData);

    // Fetch tiers (public)
    const { data: tiersData } = await supabase
      .from("affiliate_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    setTiers(tiersData || []);

    if (affiliateData) {
      // Fetch referral codes
      const { data: codesData } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("affiliate_id", affiliateData.id)
        .order("created_at", { ascending: false });

      setReferralCodes(codesData || []);

      // Fetch referrals
      const { data: referralsData } = await supabase
        .from("referrals")
        .select("*")
        .eq("affiliate_id", affiliateData.id)
        .order("attributed_at", { ascending: false });

      setReferrals(referralsData || []);

      // Fetch commissions
      const { data: commissionsData } = await supabase
        .from("commission_events")
        .select("*")
        .eq("affiliate_id", affiliateData.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setCommissions(commissionsData || []);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleApply = async () => {
    if (!user) return;
    setIsApplying(true);

    const { data, error } = await supabase
      .from("affiliates")
      .insert({
        user_id: user.id,
        affiliate_type: "referrer",
        status: "pending",
        payout_method: "platform_credits",
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to apply",
        description: error.message,
      });
    } else {
      setAffiliate(data);
      toast({
        title: "Application submitted!",
        description: "Your referral application is pending approval.",
      });
    }

    setIsApplying(false);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateCode = async () => {
    if (!affiliate) return;
    setIsCreatingCode(true);

    const code = generateCode();

    const { data, error } = await supabase
      .from("referral_codes")
      .insert({
        affiliate_id: affiliate.id,
        code,
        description: newCodeDescription || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to create code",
        description: error.message,
      });
    } else {
      setReferralCodes([data, ...referralCodes]);
      setNewCodeDescription("");
      toast({
        title: "Referral code created!",
        description: `Your new code is ${code}`,
      });
    }

    setIsCreatingCode(false);
  };

  const copyToClipboard = async (code: string) => {
    const url = `${window.location.origin}/signup?ref=${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getCurrentTier = () => {
    const totalRevenue = referrals.reduce((sum, r) => sum + r.total_revenue_cents, 0);
    return tiers.find(
      (t) =>
        totalRevenue >= t.min_revenue_cents &&
        (t.max_revenue_cents === null || totalRevenue <= t.max_revenue_cents)
    );
  };

  const referralCodeColumns: Column<ReferralCode>[] = [
    {
      key: "code",
      header: "Code",
      render: (code) => (
        <span className="font-mono font-medium">{code.code}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (code) => (
        <span className="text-muted-foreground">{code.description || "—"}</span>
      ),
    },
    {
      key: "uses_count",
      header: "Uses",
    },
    {
      key: "is_active",
      header: "Status",
      render: (code) => (
        <Badge variant={code.is_active ? "default" : "secondary"}>
          {code.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (code) => (
        <span className="text-muted-foreground">
          {format(new Date(code.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "id",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      sortable: false,
      render: (code) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(code.code);
          }}
        >
          {copiedCode === code.code ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      ),
    },
  ];

  const commissionColumns: Column<CommissionEvent>[] = [
    {
      key: "created_at",
      header: "Date",
      render: (commission) => (
        <span className="text-muted-foreground">
          {format(new Date(commission.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "source_type",
      header: "Source",
      render: (commission) => (
        <span className="capitalize">{commission.source_type.replace("_", " ")}</span>
      ),
    },
    {
      key: "gross_amount_cents",
      header: "Sale Amount",
      render: (commission) => formatCurrency(commission.gross_amount_cents),
    },
    {
      key: "commission_percent",
      header: "Rate",
      render: (commission) => `${commission.commission_percent}%`,
    },
    {
      key: "commission_cents",
      header: "Commission",
      render: (commission) => (
        <span className="font-medium">{formatCurrency(commission.commission_cents)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (commission) => (
        <Badge
          variant={
            commission.status === "paid"
              ? "default"
              : commission.status === "approved"
              ? "secondary"
              : "outline"
          }
        >
          {commission.status}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading referral data..." />
      </div>
    );
  }

  // Not an affiliate yet - show application
  if (!affiliate) {
    return (
      <div className="space-y-6 animate-in max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Referral Program</h1>
            <p className="text-muted-foreground">
              Earn rewards by referring friends and colleagues
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join Our Referral Program</CardTitle>
            <CardDescription>
              Share your unique link and earn commissions on every purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {tiers.map((tier) => (
                <Card key={tier.id} className="text-center">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">
                      {tier.commission_percent}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tier.max_revenue_cents
                        ? `Up to ${formatCurrency(tier.max_revenue_cents)} revenue`
                        : `${formatCurrency(tier.min_revenue_cents)}+ revenue`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">How it works</h3>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Apply to join the referral program</li>
                  <li>2. Get your unique referral link</li>
                  <li>3. Share with friends and colleagues</li>
                  <li>4. Earn commissions on their purchases</li>
                </ol>
              </div>
              <Button size="lg" onClick={handleApply} disabled={isApplying}>
                {isApplying ? "Applying..." : "Apply Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending approval
  if (affiliate.status === "pending") {
    return (
      <div className="space-y-6 animate-in max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Referral Program</h1>
            <p className="text-muted-foreground">Your application is under review</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Application Pending</h2>
            <p className="text-muted-foreground">
              We're reviewing your application. You'll be notified once approved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Approved affiliate dashboard
  const totalReferrals = referrals.length;
  const convertedReferrals = referrals.filter((r) => r.first_purchase_at).length;
  const totalRevenue = referrals.reduce((sum, r) => sum + r.total_revenue_cents, 0);
  const totalCommissions = referrals.reduce((sum, r) => sum + r.total_commission_cents, 0);
  const pendingCommissions = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.commission_cents, 0);
  const currentTier = getCurrentTier();

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Referral Dashboard</h1>
            <p className="text-muted-foreground">
              Track your referrals and earnings
            </p>
          </div>
        </div>
        {currentTier && (
          <Badge variant="secondary" className="text-sm">
            {currentTier.name} Tier • {currentTier.commission_percent}% Commission
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {convertedReferrals} converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingCommissions)}</div>
            <p className="text-xs text-muted-foreground">Awaiting clearance</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Codes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Referral Codes</CardTitle>
              <CardDescription>Share these links to earn commissions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Description (optional)"
                value={newCodeDescription}
                onChange={(e) => setNewCodeDescription(e.target.value)}
                className="w-48"
              />
              <Button onClick={handleCreateCode} disabled={isCreatingCode}>
                <Plus className="h-4 w-4 mr-2" />
                Create Code
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {referralCodes.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No referral codes yet"
              description="Create your first referral code to start earning"
            />
          ) : (
            <DataTable
              data={referralCodes}
              columns={referralCodeColumns}
              defaultSortKey="created_at"
              defaultSortDirection="desc"
            />
          )}
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      {commissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Commissions</CardTitle>
            <CardDescription>Your latest earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={commissions}
              columns={commissionColumns}
              defaultSortKey="created_at"
              defaultSortDirection="desc"
            />
          </CardContent>
        </Card>
      )}

      {/* Commission Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Tiers</CardTitle>
          <CardDescription>
            Earn higher rates as you generate more revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {tiers.map((tier) => {
              const isCurrentTier = currentTier?.id === tier.id;
              return (
                <Card
                  key={tier.id}
                  className={isCurrentTier ? "border-primary bg-primary/5" : ""}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      {isCurrentTier && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">
                      {tier.commission_percent}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tier.max_revenue_cents
                        ? `${formatCurrency(tier.min_revenue_cents)} – ${formatCurrency(tier.max_revenue_cents)}`
                        : `${formatCurrency(tier.min_revenue_cents)}+`}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
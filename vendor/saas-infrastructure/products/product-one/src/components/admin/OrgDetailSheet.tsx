import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";
import {
  Building2,
  Users,
  Crown,
  CreditCard,
  FileEdit,
  BarChart3,
  Shield,
  Calendar,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

interface OrgMember {
  id: string;
  user_id: string;
  role: string;
  is_owner: boolean;
  can_manage_billing: boolean;
  can_manage_members: boolean;
  can_manage_content: boolean;
  can_view_analytics: boolean;
  created_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

interface OrgSubscription {
  id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan: {
    name: string;
  } | null;
}

interface CreditBalance {
  balance: number;
  lifetime_purchased: number;
  lifetime_used: number;
}

interface OrgDetailSheetProps {
  org: Organization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrgUpdated: () => void;
}

export function OrgDetailSheet({
  org,
  open,
  onOpenChange,
}: OrgDetailSheetProps) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [subscription, setSubscription] = useState<OrgSubscription | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMembers = useCallback(async (): Promise<OrgMember[]> => {
    if (!org) return [];

    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch members",
        description: error.message,
      });
      return [];
    }

    // Fetch profiles separately
    const userIds = (data || []).map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
    return (data || []).map((m) => ({
      ...m,
      profile: profileMap.get(m.user_id) || null,
    })) as unknown as OrgMember[];
  }, [org]);

  const fetchSubscription = useCallback(async (): Promise<OrgSubscription | null> => {
    if (!org) return null;

    const { data } = await supabase
      .from("org_subscriptions")
      .select(`
        id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        plan:subscription_plans(name)
      `)
      .eq("organization_id", org.id)
      .maybeSingle();

    return data as unknown as OrgSubscription | null;
  }, [org]);

  const fetchCredits = useCallback(async (): Promise<CreditBalance | null> => {
    if (!org) return null;

    const { data } = await supabase
      .from("org_credit_balances")
      .select("balance, lifetime_purchased, lifetime_used")
      .eq("organization_id", org.id)
      .maybeSingle();

    return data;
  }, [org]);

  const fetchOrgData = useCallback(async () => {
    if (!org) return;
    setIsLoading(true);

    // Fetch members, subscription, and credits in parallel
    const [membersResult, subscriptionResult, creditsResult] = await Promise.all([
      fetchMembers(),
      fetchSubscription(),
      fetchCredits(),
    ]);

    setMembers(membersResult);
    setSubscription(subscriptionResult);
    setCreditBalance(creditsResult);
    setIsLoading(false);
  }, [org, fetchMembers, fetchSubscription, fetchCredits]);

  useEffect(() => {
    if (org && open) {
      fetchOrgData();
    }
  }, [org, open, fetchOrgData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "canceled":
      case "past_due":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "trialing":
        return <Clock className="h-4 w-4 text-accent-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPermissionBadges = (member: OrgMember) => {
    const permissions = [];
    if (member.can_manage_billing) permissions.push({ icon: CreditCard, label: "Billing" });
    if (member.can_manage_members) permissions.push({ icon: Shield, label: "Members" });
    if (member.can_manage_content) permissions.push({ icon: FileEdit, label: "Content" });
    if (member.can_view_analytics) permissions.push({ icon: BarChart3, label: "Analytics" });
    return permissions;
  };

  if (!org) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>{org.name}</SheetTitle>
              <SheetDescription>
                <Badge variant="secondary">{org.slug}</Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading organization details..." />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Org Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium">
                    {format(new Date(org.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-muted-foreground">Last Updated</span>
                  <p className="font-medium">
                    {format(new Date(org.updated_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Billing Summary */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Receipt className="h-4 w-4" />
                Billing Summary
              </h3>
              
              <div className="rounded-lg border p-4 space-y-4">
                {subscription ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <Badge variant="outline">{subscription.plan?.name || "Unknown"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(subscription.status)}
                        <span className="text-sm capitalize">{subscription.status}</span>
                        {subscription.cancel_at_period_end && (
                          <Badge variant="destructive" className="text-xs">Canceling</Badge>
                        )}
                      </div>
                    </div>
                    {subscription.current_period_end && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {subscription.cancel_at_period_end ? "Ends" : "Renews"}
                        </span>
                        <span className="text-sm">
                          {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active subscription</p>
                )}

                {creditBalance && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Credit Balance</span>
                        <span className="font-medium">{creditBalance.balance.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Lifetime Purchased</span>
                        <span className="text-sm">{creditBalance.lifetime_purchased.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Lifetime Used</span>
                        <span className="text-sm">{creditBalance.lifetime_used.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Members Section (Read-only) */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </h3>

              {members.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No members"
                  description="This organization has no members yet"
                />
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-muted p-2">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {member.profile?.display_name || "Unknown User"}
                              {member.is_owner && (
                                <Crown className="h-4 w-4 text-primary" />
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.profile?.email || "No email"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>

                      {/* Permission badges (read-only display) */}
                      {!member.is_owner && getPermissionBadges(member).length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {getPermissionBadges(member).map(({ icon: Icon, label }) => (
                            <Badge key={label} variant="secondary" className="gap-1">
                              <Icon className="h-3 w-3" />
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {member.is_owner && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Owner has full access to all features
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCoupons, Coupon, CouponFormData, CouponType, CouponScope } from "@/hooks/useCoupons";
import { Navigate } from "react-router-dom";
import { Ticket, Plus, MoreHorizontal, Percent, DollarSign, Gift, Clock, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { format } from "date-fns";

const COUPON_TYPE_LABELS: Record<CouponType, { label: string; icon: React.ReactNode }> = {
  percent_off: { label: "Percent Off", icon: <Percent className="h-4 w-4" /> },
  fixed_amount_off: { label: "Fixed Amount Off", icon: <DollarSign className="h-4 w-4" /> },
  credit_bonus: { label: "Credit Bonus", icon: <Gift className="h-4 w-4" /> },
  subscription_percent: { label: "Subscription Discount", icon: <Percent className="h-4 w-4" /> },
  trial_extension: { label: "Trial Extension", icon: <Clock className="h-4 w-4" /> },
  free_upgrade: { label: "Free Upgrade", icon: <ArrowUp className="h-4 w-4" /> },
};

const SCOPE_LABELS: Record<CouponScope, string> = {
  all: "All Products",
  subscriptions: "Subscriptions Only",
  credit_packs: "Credit Packs Only",
  one_time_products: "One-Time Products Only",
};

export default function AdminBillingCoupons() {
  const { isOwner } = useAuth();
  const { coupons, loading, createCoupon, updateCoupon, toggleCouponActive, deleteCoupon } = useCoupons();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Coupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    name: "",
    description: "",
    coupon_type: "percent_off",
    value: 10,
    applies_to: "all",
    max_per_user: 1,
    is_active: true,
  });

  if (!isOwner) {
    return <Navigate to="/admin" replace />;
  }

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      coupon_type: "percent_off",
      value: 10,
      applies_to: "all",
      max_per_user: 1,
      is_active: true,
    });
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || "",
      coupon_type: coupon.coupon_type,
      value: coupon.value,
      duration_months: coupon.duration_months || undefined,
      applies_to: coupon.applies_to,
      min_purchase_cents: coupon.min_purchase_cents,
      max_redemptions: coupon.max_redemptions || undefined,
      max_per_user: coupon.max_per_user,
      is_first_purchase_only: coupon.is_first_purchase_only,
      is_stackable: coupon.is_stackable,
      is_referral_only: coupon.is_referral_only,
      referrer_reward_type: coupon.referrer_reward_type || undefined,
      referrer_reward_value: coupon.referrer_reward_value || undefined,
      starts_at: coupon.starts_at,
      expires_at: coupon.expires_at || undefined,
      is_active: coupon.is_active,
    });
    setEditingCoupon(coupon);
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (editingCoupon) {
      await updateCoupon(editingCoupon.id, formData);
      setEditingCoupon(null);
    } else {
      await createCoupon(formData);
      setIsCreateOpen(false);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteCoupon(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const getValueDisplay = (coupon: Coupon) => {
    switch (coupon.coupon_type) {
      case "percent_off":
      case "subscription_percent":
        return `${coupon.value}% off`;
      case "fixed_amount_off":
        return `$${coupon.value} off`;
      case "credit_bonus":
        return `+${coupon.value} credits`;
      case "trial_extension":
        return `+${coupon.value} days`;
      case "free_upgrade":
        return "Free upgrade";
      default:
        return coupon.value.toString();
    }
  };

  const CouponForm = () => (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Code *</Label>
          <Input
            id="code"
            placeholder="SAVE20"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="Summer Sale"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional description..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Discount Type *</Label>
          <Select
            value={formData.coupon_type}
            onValueChange={(v) => setFormData({ ...formData, coupon_type: v as CouponType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COUPON_TYPE_LABELS).map(([value, { label, icon }]) => (
                <SelectItem key={value} value={value}>
                  <span className="flex items-center gap-2">
                    {icon} {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="value">
            Value * {formData.coupon_type.includes("percent") ? "(%)" : formData.coupon_type === "credit_bonus" ? "(credits)" : formData.coupon_type === "trial_extension" ? "(days)" : "($)"}
          </Label>
          <Input
            id="value"
            type="number"
            min={0}
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      {formData.coupon_type === "subscription_percent" && (
        <div className="space-y-2">
          <Label htmlFor="duration_months">Duration (months)</Label>
          <Input
            id="duration_months"
            type="number"
            min={1}
            placeholder="e.g., 3 for 3 months"
            value={formData.duration_months || ""}
            onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) || undefined })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Applies To</Label>
        <Select
          value={formData.applies_to}
          onValueChange={(v) => setFormData({ ...formData, applies_to: v as CouponScope })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SCOPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_redemptions">Max Total Uses</Label>
          <Input
            id="max_redemptions"
            type="number"
            min={1}
            placeholder="Unlimited"
            value={formData.max_redemptions || ""}
            onChange={(e) => setFormData({ ...formData, max_redemptions: parseInt(e.target.value) || undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_per_user">Max Per User</Label>
          <Input
            id="max_per_user"
            type="number"
            min={1}
            value={formData.max_per_user || 1}
            onChange={(e) => setFormData({ ...formData, max_per_user: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_purchase">Min Purchase ($)</Label>
          <Input
            id="min_purchase"
            type="number"
            min={0}
            step={0.01}
            placeholder="0.00"
            value={(formData.min_purchase_cents || 0) / 100}
            onChange={(e) => setFormData({ ...formData, min_purchase_cents: Math.round(parseFloat(e.target.value || "0") * 100) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expires_at">Expires At</Label>
          <Input
            id="expires_at"
            type="datetime-local"
            value={formData.expires_at ? formData.expires_at.slice(0, 16) : ""}
            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h4 className="font-medium">Conditions</h4>
        <div className="flex items-center justify-between">
          <Label htmlFor="is_first_purchase_only">First Purchase Only</Label>
          <Switch
            id="is_first_purchase_only"
            checked={formData.is_first_purchase_only}
            onCheckedChange={(checked) => setFormData({ ...formData, is_first_purchase_only: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="is_stackable">Stackable with Other Coupons</Label>
          <Switch
            id="is_stackable"
            checked={formData.is_stackable}
            onCheckedChange={(checked) => setFormData({ ...formData, is_stackable: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="is_referral_only">Referral Only</Label>
          <Switch
            id="is_referral_only"
            checked={formData.is_referral_only}
            onCheckedChange={(checked) => setFormData({ ...formData, is_referral_only: checked })}
          />
        </div>
      </div>

      {formData.is_referral_only && (
        <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h4 className="font-medium">Referral Rewards</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Referrer Reward Type</Label>
              <Select
                value={formData.referrer_reward_type || ""}
                onValueChange={(v) => setFormData({ ...formData, referrer_reward_type: v as CouponType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_bonus">Credit Bonus</SelectItem>
                  <SelectItem value="percent_off">Percent Off</SelectItem>
                  <SelectItem value="fixed_amount_off">Fixed Amount Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Referrer Reward Value</Label>
              <Input
                type="number"
                min={0}
                value={formData.referrer_reward_value || ""}
                onChange={(e) => setFormData({ ...formData, referrer_reward_value: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Active</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Ticket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Coupons</h1>
            <p className="text-muted-foreground">
              Create discount codes and referral rewards
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>
            Manage discount codes for subscriptions, credits, and products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No coupons created yet</p>
              <Button variant="link" onClick={openCreate}>Create your first coupon</Button>
            </div>
          ) : (
            <DataTable
              data={coupons}
              columns={[
                {
                  key: "code",
                  header: "Code",
                  render: (coupon) => (
                    <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                      {coupon.code}
                    </code>
                  ),
                },
                {
                  key: "name",
                  header: "Name",
                  render: (coupon) => (
                    <span className="font-medium">{coupon.name}</span>
                  ),
                },
                {
                  key: "coupon_type",
                  header: "Type",
                  render: (coupon) => (
                    <span className="flex items-center gap-1.5 text-sm">
                      {COUPON_TYPE_LABELS[coupon.coupon_type]?.icon}
                      {COUPON_TYPE_LABELS[coupon.coupon_type]?.label}
                    </span>
                  ),
                },
                {
                  key: "value",
                  header: "Value",
                  render: (coupon) => getValueDisplay(coupon),
                },
                {
                  key: "applies_to",
                  header: "Scope",
                  render: (coupon) => (
                    <span className="text-sm text-muted-foreground">
                      {SCOPE_LABELS[coupon.applies_to]}
                    </span>
                  ),
                },
                {
                  key: "redemption_count",
                  header: "Uses",
                  render: (coupon) => (
                    <>
                      {coupon.redemption_count}
                      {coupon.max_redemptions && ` / ${coupon.max_redemptions}`}
                    </>
                  ),
                },
                {
                  key: "is_active",
                  header: "Status",
                  render: (coupon) => (
                    <div className="flex flex-wrap gap-1">
                      {coupon.is_active ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {coupon.is_referral_only && (
                        <Badge variant="outline">Referral</Badge>
                      )}
                      {coupon.expires_at && new Date(coupon.expires_at) < new Date() && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  sortable: false,
                  className: "w-[50px]",
                  render: (coupon) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(coupon)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleCouponActive(coupon.id, !coupon.is_active)}>
                          {coupon.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteConfirm(coupon)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ),
                },
              ]}
              defaultSortKey="created_at"
              defaultSortDirection="desc"
              emptyMessage="No coupons created yet"
            />
          )}
        </CardContent>
      </Card>

      {/* Create Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Coupon</SheetTitle>
            <SheetDescription>
              Create a new discount code
            </SheetDescription>
          </SheetHeader>
          <CouponForm />
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.code || !formData.name}>
              {isSaving ? "Creating..." : "Create Coupon"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={!!editingCoupon} onOpenChange={(open) => !open && setEditingCoupon(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Coupon</SheetTitle>
            <SheetDescription>
              Update coupon settings
            </SheetDescription>
          </SheetHeader>
          <CouponForm />
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditingCoupon(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the coupon "{deleteConfirm?.code}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

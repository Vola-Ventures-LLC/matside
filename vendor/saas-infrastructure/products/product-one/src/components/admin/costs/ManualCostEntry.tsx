import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const COST_CATEGORIES = [
  { value: "database", label: "Database (Supabase)", group: "Infrastructure" },
  { value: "realtime", label: "Realtime Connections", group: "Infrastructure" },
  { value: "bandwidth", label: "Bandwidth/CDN", group: "Infrastructure" },
  { value: "openai", label: "OpenAI API", group: "External APIs" },
  { value: "anthropic", label: "Anthropic API", group: "External APIs" },
  { value: "twilio", label: "Twilio (SMS/Voice)", group: "External APIs" },
  { value: "resend", label: "Resend (Email)", group: "External APIs" },
  { value: "other-api", label: "Other API", group: "External APIs" },
  { value: "hosting", label: "Hosting/Deployment", group: "Operations" },
  { value: "monitoring", label: "Monitoring/Logging", group: "Operations" },
  { value: "security", label: "Security Tools", group: "Operations" },
  { value: "labor", label: "Labor/Contractor", group: "Operations" },
  { value: "marketing", label: "Marketing/Ads", group: "Business" },
  { value: "legal", label: "Legal/Compliance", group: "Business" },
  { value: "other", label: "Other", group: "Misc" },
];

interface ManualCostEntryProps {
  onSuccess?: () => void;
}

export function ManualCostEntry({ onSuccess }: ManualCostEntryProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [costDate, setCostDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [vendor, setVendor] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) return;

    setLoading(true);
    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.rpc("record_usage", {
        p_user_id: user.id,
        p_resource_type: "manual",
        p_category: category,
        p_units: 1,
        p_estimated_cost_cents: amountCents,
        p_metadata: {
          description,
          vendor,
          cost_date: costDate,
          entered_by: user.id,
          is_manual: true,
        },
      });

      if (error) throw error;

      toast({
        title: "Cost recorded",
        description: `$${amount} added to ${category}`,
      });

      // Reset form
      setCategory("");
      setAmount("");
      setDescription("");
      setVendor("");
      setCostDate(new Date().toISOString().split("T")[0]);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error recording cost:", error);
      toast({
        title: "Error",
        description: "Failed to record cost",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedCategories = COST_CATEGORIES.reduce(
    (acc, cat) => {
      if (!acc[cat.group]) acc[cat.group] = [];
      acc[cat.group].push(cat);
      return acc;
    },
    {} as Record<string, typeof COST_CATEGORIES>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Manual Cost
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Manual Cost</DialogTitle>
          <DialogDescription>
            Record external costs not automatically tracked (APIs, infrastructure, etc.)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedCategories).map(([group, cats]) => (
                  <div key={group}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group}
                    </div>
                    {cats.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={costDate}
                onChange={(e) => setCostDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor/Source (optional)</Label>
            <Input
              id="vendor"
              placeholder="e.g., OpenAI, AWS, Contractor name"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              placeholder="Invoice #, billing period, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !category || !amount}>
              {loading ? "Saving..." : "Add Cost"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

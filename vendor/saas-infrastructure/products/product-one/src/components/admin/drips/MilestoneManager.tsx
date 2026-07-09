import { useState } from "react";
import { useMilestoneDefinitions, MilestoneDefinition, MilestoneCategory } from "@/hooks/useDrips";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, CheckCircle, UserPlus, CreditCard, LifeBuoy } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const CATEGORY_ICONS: Record<MilestoneCategory, React.ReactNode> = {
  onboarding: <UserPlus className="h-4 w-4" />,
  engagement: <CheckCircle className="h-4 w-4" />,
  billing: <CreditCard className="h-4 w-4" />,
  support: <LifeBuoy className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  onboarding: "bg-blue-500/10 text-blue-500",
  engagement: "bg-green-500/10 text-green-500",
  billing: "bg-amber-500/10 text-amber-500",
  support: "bg-purple-500/10 text-purple-500",
};

export function MilestoneManager() {
  const { milestones, milestonesByCategory, isLoading, createMilestone, updateMilestone, deleteMilestone } = useMilestoneDefinitions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneDefinition | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    description: "",
    category: "onboarding" as MilestoneCategory,
    is_active: true,
    auto_track: false,
    tracking_event: "",
    sort_order: 0,
  });

  const resetForm = () => {
    setFormData({
      key: "",
      name: "",
      description: "",
      category: "onboarding",
      is_active: true,
      auto_track: false,
      tracking_event: "",
      sort_order: 0,
    });
    setEditingMilestone(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (milestone: MilestoneDefinition) => {
    setEditingMilestone(milestone);
    setFormData({
      key: milestone.key,
      name: milestone.name,
      description: milestone.description || "",
      category: milestone.category,
      is_active: milestone.is_active,
      auto_track: milestone.auto_track,
      tracking_event: milestone.tracking_event || "",
      sort_order: milestone.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingMilestone) {
      await updateMilestone(editingMilestone.id, {
        ...formData,
        description: formData.description || null,
        tracking_event: formData.tracking_event || null,
      });
    } else {
      await createMilestone({
        ...formData,
        description: formData.description || null,
        tracking_event: formData.tracking_event || null,
      });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this milestone? This may affect existing drip triggers.")) {
      await deleteMilestone(id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const categories: MilestoneCategory[] = ["onboarding", "engagement", "billing", "support"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Milestone Definitions</h2>
          <p className="text-muted-foreground">
            Define trackable user milestones for behavior-based drip campaigns
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      <Tabs defaultValue="onboarding">
        <TabsList>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize gap-2">
              {CATEGORY_ICONS[cat]}
              {cat}
              <Badge variant="secondary" className="ml-1">
                {milestonesByCategory[cat]?.length || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="space-y-4">
            {milestonesByCategory[cat]?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No milestones defined for {cat}. Click "Add Milestone" to create one.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {milestonesByCategory[cat]?.map(milestone => (
                  <Card key={milestone.id} className={milestone.is_active ? "" : "opacity-60"}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {milestone.name}
                            {!milestone.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {milestone.key}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(milestone)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(milestone.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {milestone.description || "No description"}
                      </p>
                      {milestone.auto_track && milestone.tracking_event && (
                        <Badge variant="outline" className="mt-2">
                          Auto-tracks: {milestone.tracking_event}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? "Edit Milestone" : "Create Milestone"}
            </DialogTitle>
            <DialogDescription>
              Define a trackable user action or state for drip campaigns
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Key (unique identifier)</Label>
                <Input
                  value={formData.key}
                  onChange={e => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  placeholder="first_project_created"
                  disabled={!!editingMilestone}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v: MilestoneCategory) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="First Project Created"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="User created their first project or workspace"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive milestones won't trigger drips
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={v => setFormData({ ...formData, is_active: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-track</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically record when event fires
                </p>
              </div>
              <Switch
                checked={formData.auto_track}
                onCheckedChange={v => setFormData({ ...formData, auto_track: v })}
              />
            </div>

            {formData.auto_track && (
              <div className="space-y-2">
                <Label>Tracking Event Name</Label>
                <Input
                  value={formData.tracking_event}
                  onChange={e => setFormData({ ...formData, tracking_event: e.target.value })}
                  placeholder="project.created"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.key || !formData.name}>
              {editingMilestone ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

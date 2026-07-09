import { useState } from "react";
import { useDripTriggers, useMilestoneDefinitions, DripTrigger, DripConditionOperator, DripTriggerStatus } from "@/hooks/useDrips";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Pencil, Trash2, Play, MoreVertical, Pause, Sparkles, GitBranch, X } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface ConditionForm {
  milestone_key: string;
  operator: DripConditionOperator;
  duration_hours: number | null;
  sort_order: number;
}

const STATUS_COLORS: Record<DripTriggerStatus, string> = {
  active: "bg-green-500/10 text-green-500",
  paused: "bg-amber-500/10 text-amber-500",
  draft: "bg-muted text-muted-foreground",
};

export function DripTriggerManager() {
  const { triggers, isLoading, createTrigger, updateTrigger, deleteTrigger, updateConditions, runTriggerEvaluation } = useDripTriggers();
  const { milestones } = useMilestoneDefinitions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<DripTrigger | null>(null);
  const [isRunning, setIsRunning] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    template_name: "",
    eval_type: "simple" as "simple" | "ai",
    ai_prompt: "",
    status: "draft" as DripTriggerStatus,
    priority: 0,
    cooldown_hours: 24,
    max_sends_per_user: 1,
    condition_logic: "AND",
  });

  const [conditions, setConditions] = useState<ConditionForm[]>([]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      template_name: "",
      eval_type: "simple",
      ai_prompt: "",
      status: "draft",
      priority: 0,
      cooldown_hours: 24,
      max_sends_per_user: 1,
      condition_logic: "AND",
    });
    setConditions([]);
    setEditingTrigger(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (trigger: DripTrigger) => {
    setEditingTrigger(trigger);
    setFormData({
      name: trigger.name,
      description: trigger.description || "",
      template_name: trigger.template_name,
      eval_type: trigger.eval_type,
      ai_prompt: trigger.ai_prompt || "",
      status: trigger.status,
      priority: trigger.priority,
      cooldown_hours: trigger.cooldown_hours,
      max_sends_per_user: trigger.max_sends_per_user,
      condition_logic: trigger.condition_logic,
    });
    setConditions(
      trigger.conditions?.map(c => ({
        milestone_key: c.milestone_key,
        operator: c.operator,
        duration_hours: c.duration_hours,
        sort_order: c.sort_order,
      })) || []
    );
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingTrigger) {
      await updateTrigger(editingTrigger.id, {
        ...formData,
        description: formData.description || null,
        ai_prompt: formData.ai_prompt || null,
      });
      await updateConditions(editingTrigger.id, conditions);
    } else {
      await createTrigger(
        {
          ...formData,
          description: formData.description || null,
          ai_prompt: formData.ai_prompt || null,
        },
        conditions
      );
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this trigger? This cannot be undone.")) {
      await deleteTrigger(id);
    }
  };

  const handleRun = async (triggerId: string) => {
    setIsRunning(triggerId);
    await runTriggerEvaluation(triggerId);
    setIsRunning(null);
  };

  const handleToggleStatus = async (trigger: DripTrigger) => {
    const newStatus = trigger.status === "active" ? "paused" : "active";
    await updateTrigger(trigger.id, { status: newStatus });
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { milestone_key: "", operator: "has", duration_hours: null, sort_order: conditions.length },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<ConditionForm>) => {
    setConditions(conditions.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Drip Triggers</h2>
          <p className="text-muted-foreground">
            Configure behavior-based email triggers with milestone conditions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => runTriggerEvaluation()}>
            <Play className="h-4 w-4 mr-2" />
            Run All
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Trigger
          </Button>
        </div>
      </div>

      {triggers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No drip triggers yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first behavior-based email trigger
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Trigger
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {triggers.map(trigger => (
            <Card key={trigger.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {trigger.eval_type === "ai" && <Sparkles className="h-4 w-4 text-primary" />}
                      {trigger.name}
                      <Badge className={STATUS_COLORS[trigger.status]}>{trigger.status}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Template: <span className="font-mono">{trigger.template_name}</span>
                      {trigger.description && ` • ${trigger.description}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRun(trigger.id)}
                      disabled={isRunning === trigger.id}
                    >
                      {isRunning === trigger.id ? (
                        <LoadingSpinner />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(trigger)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(trigger)}>
                          {trigger.status === "active" ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(trigger.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {trigger.condition_logic}: {trigger.conditions?.length || 0} conditions
                  </Badge>
                  <Badge variant="outline">
                    Cooldown: {trigger.cooldown_hours}h
                  </Badge>
                  <Badge variant="outline">
                    Max sends: {trigger.max_sends_per_user}
                  </Badge>
                  <Badge variant="outline">
                    Priority: {trigger.priority}
                  </Badge>
                </div>
                {trigger.conditions && trigger.conditions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {trigger.conditions.map((cond, i) => (
                      <Badge key={cond.id} variant="secondary" className="text-xs">
                        {cond.operator === "has" && "✓ "}
                        {cond.operator === "not_has" && "✗ "}
                        {cond.operator === "not_has_for" && `✗ (${cond.duration_hours}h) `}
                        {cond.milestone_key}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTrigger ? "Edit Trigger" : "Create Trigger"}
            </DialogTitle>
            <DialogDescription>
              Define when to send emails based on user behavior
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger Name</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Onboarding Nudge"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Template</Label>
                  <Input
                    value={formData.template_name}
                    onChange={e => setFormData({ ...formData, template_name: e.target.value })}
                    placeholder="onboarding_nudge"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Send when user hasn't completed onboarding after 48 hours"
                  rows={2}
                />
              </div>
            </div>

            {/* Evaluation Type */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Evaluation Type</Label>
                  <Select
                    value={formData.eval_type}
                    onValueChange={(v: "simple" | "ai") => setFormData({ ...formData, eval_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple (Milestone checks)</SelectItem>
                      <SelectItem value="ai">AI (Complex evaluation)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: DripTriggerStatus) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.eval_type === "ai" && (
                <div className="space-y-2">
                  <Label>AI Evaluation Prompt</Label>
                  <Textarea
                    value={formData.ai_prompt}
                    onChange={e => setFormData({ ...formData, ai_prompt: e.target.value })}
                    placeholder="Send if user is engaged but hasn't upgraded. Consider their activity level and trial status."
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Conditions */}
            {formData.eval_type === "simple" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Conditions</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={formData.condition_logic}
                      onValueChange={v => setFormData({ ...formData, condition_logic: v })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                {conditions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No conditions. Add at least one milestone condition.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {conditions.map((cond, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                        <Select
                          value={cond.operator}
                          onValueChange={(v: DripConditionOperator) => updateCondition(index, { operator: v })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="has">Has</SelectItem>
                            <SelectItem value="not_has">Does not have</SelectItem>
                            <SelectItem value="not_has_for">Missing for X hours</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={cond.milestone_key}
                          onValueChange={v => updateCondition(index, { milestone_key: v })}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select milestone" />
                          </SelectTrigger>
                          <SelectContent>
                            {milestones.filter(m => m.is_active).map(m => (
                              <SelectItem key={m.key} value={m.key}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {cond.operator === "not_has_for" && (
                          <Input
                            type="number"
                            className="w-20"
                            placeholder="hours"
                            value={cond.duration_hours || ""}
                            onChange={e => updateCondition(index, { duration_hours: parseInt(e.target.value) || null })}
                          />
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCondition(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cooldown (hours)</Label>
                <Input
                  type="number"
                  value={formData.cooldown_hours}
                  onChange={e => setFormData({ ...formData, cooldown_hours: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max sends per user</Label>
                <Input
                  type="number"
                  value={formData.max_sends_per_user}
                  onChange={e => setFormData({ ...formData, max_sends_per_user: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.template_name}>
              {editingTrigger ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

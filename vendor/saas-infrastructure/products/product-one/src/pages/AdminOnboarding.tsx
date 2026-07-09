import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  GripVertical,
  Pencil,
  ExternalLink,
  ArrowRight,
  RotateCcw,
  FlaskConical,
  MessageSquare,
} from "lucide-react";
import { Plus, Trash2 } from "lucide-react";
import { Database } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Link } from "react-router-dom";

interface NavigationCTA {
  enabled: boolean;
  label: string;
  path: string;
  description: string;
  external: boolean;
  complete_on_return: boolean;
}

interface SettingsCheck {
  enabled?: boolean;
  table: string;
  field: string;
  check_type: "not_null" | "not_empty" | "has_rows";
  context_field?: string;
  min_count?: number;
}

interface OnboardingStep {
  id: string;
  key: string;
  title: string;
  description: string | null;
  category: string;
  sort_order: number;
  is_required: boolean;
  is_active: boolean;
  completion_type: string;
  detection_config: Record<string, unknown>;
  settings_check: SettingsCheck | null;
  prompt_hint: string | null;
  depends_on: string | null;
  navigation_cta: NavigationCTA | null;
  created_at: string;
  updated_at: string;
}

interface OnboardingStepExtended extends OnboardingStep {
  context_type: string | null;
  requires_navigation: boolean;
}

const DEFAULT_CATEGORIES = ["getting_started", "profile", "org_setup", "customization", "integrations"];
const DEFAULT_CONTEXT_TYPES = [
  { value: "", label: "Personal (no context)" },
  { value: "org", label: "Organization" },
  { value: "event", label: "Event" },
  { value: "season", label: "Season" },
  { value: "project", label: "Project" },
];

export default function AdminOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingStep, setEditingStep] = useState<OnboardingStepExtended | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetTargetEmail, setResetTargetEmail] = useState("");
  const [resetProgress, setResetProgress] = useState(true);
  const [resetConversations, setResetConversations] = useState(true);
  const [resetSelf, setResetSelf] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteStepId, setDeleteStepId] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");

  const { data: steps, isLoading } = useQuery({
    queryKey: ["onboarding-steps-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_steps")
        .select("*")
        .order("sort_order");

      if (error) throw error;
      
      // Transform to proper type with navigation_cta parsing
      return (data || []).map((step) => ({
        ...step,
        navigation_cta: step.navigation_cta as unknown as NavigationCTA | null,
        settings_check: step.settings_check as unknown as SettingsCheck | null,
        context_type: (step as any).context_type as string | null,
        requires_navigation: (step as any).requires_navigation ?? false,
      })) as OnboardingStepExtended[];
    },
  });

  // Get unique categories from existing steps
  const existingCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...(steps?.map(s => s.category) || []),
  ])).filter(Boolean).sort();

  const updateMutation = useMutation({
    mutationFn: async (step: Partial<OnboardingStep> & { id: string }) => {
      const { id, ...updates } = step;
      // Convert to database-compatible format
      const dbUpdates: Record<string, unknown> = { ...updates };
      const { error } = await supabase
        .from("onboarding_steps")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps-admin"] });
      toast.success("Step updated successfully");
      setIsSheetOpen(false);
      setEditingStep(null);
    },
    onError: (error) => {
      toast.error("Failed to update step: " + (error instanceof Error ? error.message : "Unknown error"));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (step: Partial<OnboardingStepExtended>) => {
      const { error } = await supabase
        .from("onboarding_steps")
        .insert({
          key: step.key,
          title: step.title,
          description: step.description,
          category: step.category,
          context_type: step.context_type || null,
          is_active: step.is_active ?? true,
          is_required: step.is_required ?? false,
          sort_order: (steps?.length || 0) + 1,
          completion_type: step.completion_type || "ai_verified",
          prompt_hint: step.prompt_hint,
          navigation_cta: step.navigation_cta as any,
          settings_check: step.settings_check as any,
          requires_navigation: step.requires_navigation ?? false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps-admin"] });
      toast.success("Step created successfully");
      setIsSheetOpen(false);
      setEditingStep(null);
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error("Failed to create step: " + (error instanceof Error ? error.message : "Unknown error"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase
        .from("onboarding_steps")
        .delete()
        .eq("id", stepId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps-admin"] });
      toast.success("Step deleted");
      setDeleteStepId(null);
    },
    onError: (error) => {
      toast.error("Failed to delete step: " + (error instanceof Error ? error.message : "Unknown error"));
    },
  });

  const resetMutation = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => {
      const { data, error } = await supabase.rpc("reset_user_onboarding", {
        p_admin_user_id: user?.id,
        p_target_user_id: targetUserId,
        p_reset_progress: resetProgress,
        p_reset_conversations: resetConversations,
      });

      if (error) throw error;
      
      // The function returns JSON, check for error in result
      const result = data as { error?: string; success?: boolean; progress_deleted?: number; conversations_deleted?: number; messages_deleted?: number };
      if (result.error) throw new Error(result.error);
      
      return result;
    },
    onSuccess: (data) => {
      toast.success(
        `Onboarding reset: ${data.progress_deleted || 0} progress records, ${data.conversations_deleted || 0} conversations, ${data.messages_deleted || 0} messages deleted`
      );
      setIsResetDialogOpen(false);
      setResetTargetEmail("");
      setResetSelf(false);
      // Also clear localStorage for current user if resetting self
      if (resetSelf && user) {
        // Clear all onboarding dismissed keys
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("onboarding_dismissed_") || key.startsWith("entity_onboarding_")) {
            localStorage.removeItem(key);
          }
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to reset onboarding: " + (error instanceof Error ? error.message : "Unknown error"));
    },
  });

  const handleResetOnboarding = async () => {
    if (!user) return;
    
    let targetUserId = user.id;
    
    if (!resetSelf && resetTargetEmail) {
      // Look up user by email
      const { data: targetProfile, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", resetTargetEmail.toLowerCase().trim())
        .single();
      
      if (error || !targetProfile) {
        toast.error("User not found with that email");
        return;
      }
      targetUserId = targetProfile.user_id;
    }
    
    resetMutation.mutate({ targetUserId });
  };

  const handleEditStep = (step: OnboardingStep) => {
    const extendedStep = step as OnboardingStepExtended;
    setEditingStep({
      ...step,
      navigation_cta: step.navigation_cta || {
        enabled: false,
        label: "",
        path: "",
        description: "",
        external: false,
        complete_on_return: false,
      },
      settings_check: step.settings_check || {
        enabled: false,
        table: "",
        field: "",
        check_type: "not_null",
        context_field: "",
        min_count: 1,
      },
      context_type: extendedStep.context_type || null,
      requires_navigation: extendedStep.requires_navigation ?? false,
    });
    setIsCreating(false);
    setCustomCategory("");
    setIsSheetOpen(true);
  };

  const handleCreateStep = () => {
    setEditingStep({
      id: "",
      key: "",
      title: "",
      description: "",
      category: "getting_started",
      sort_order: (steps?.length || 0) + 1,
      is_required: false,
      is_active: true,
      completion_type: "ai_verified",
      detection_config: {},
      settings_check: {
        enabled: false,
        table: "",
        field: "",
        check_type: "not_null",
        context_field: "",
        min_count: 1,
      },
      prompt_hint: "",
      depends_on: null,
      navigation_cta: {
        enabled: false,
        label: "",
        path: "",
        description: "",
        external: false,
        complete_on_return: false,
      },
      context_type: null,
      requires_navigation: false,
      created_at: "",
      updated_at: "",
    } as any);
    setIsCreating(true);
    setCustomCategory("");
    setIsSheetOpen(true);
  };

  const handleSaveStep = () => {
    if (!editingStep) return;

    // Handle custom category
    const finalCategory = customCategory || editingStep.category;

    const stepData: Partial<OnboardingStepExtended> = {
      key: editingStep.key,
      title: editingStep.title,
      description: editingStep.description,
      category: finalCategory,
      context_type: editingStep.context_type || null,
      prompt_hint: editingStep.prompt_hint,
      is_active: editingStep.is_active,
      is_required: editingStep.is_required,
      completion_type: editingStep.completion_type,
      requires_navigation: editingStep.requires_navigation,
      navigation_cta: editingStep.navigation_cta?.enabled ? editingStep.navigation_cta : null,
      settings_check: editingStep.settings_check?.enabled ? {
        table: editingStep.settings_check.table,
        field: editingStep.settings_check.field,
        check_type: editingStep.settings_check.check_type,
        context_field: editingStep.settings_check.context_field || undefined,
        min_count: editingStep.settings_check.min_count || undefined,
      } : null,
    };

    if (isCreating) {
      if (!editingStep.key || !editingStep.title) {
        toast.error("Key and title are required");
        return;
      }
      createMutation.mutate(stepData);
    } else {
      updateMutation.mutate({ ...stepData, id: editingStep.id } as any);
    }
  };

  const groupedSteps = steps?.reduce((acc, step) => {
    if (!acc[step.category]) acc[step.category] = [];
    acc[step.category].push(step);
    return acc;
  }, {} as Record<string, OnboardingStep[]>);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 w-fit">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Onboarding Steps</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configure the conversational onboarding flow and navigation CTAs
          </p>
        </div>
      </div>

      {/* Testing Tools Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Testing Tools</CardTitle>
          </div>
          <CardDescription>
            Reset onboarding progress and conversations for testing purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setIsResetDialogOpen(true)}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Onboarding
          </Button>
        </CardContent>
      </Card>

      {/* AI Prompt Configuration Link */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <CardTitle>AI Chat Prompts</CardTitle>
          </div>
          <CardDescription>
            Configure the system prompts that control the onboarding AI assistant's behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/admin/brand#ai-prompts">
              <Pencil className="h-4 w-4" />
              Edit AI Prompts
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Step Configuration</CardTitle>
              <CardDescription>
                Edit steps, set navigation CTAs to guide users to specific screens, and configure completion behavior.
              </CardDescription>
            </div>
            <Button onClick={handleCreateStep} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedSteps || {}).map(([category, categorySteps]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {category.replace(/_/g, " ")}
              </h3>
              <div className="space-y-2">
                {categorySteps.map((step) => (
                  <div
                    key={step.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="hidden sm:block">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <span className="font-medium text-sm sm:text-base">{step.title}</span>
                        {step.is_required && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">Required</Badge>
                        )}
                        {step.navigation_cta?.enabled && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs gap-1">
                            <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            CTA
                          </Badge>
                        )}
                        {step.settings_check && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs text-primary">
                            Auto-check
                          </Badge>
                        )}
                        {!step.is_active && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs text-muted-foreground">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {step.description || step.prompt_hint || "No description"}
                      </p>
                      {step.navigation_cta?.enabled && (
                        <p className="text-[10px] sm:text-xs text-primary mt-1 flex items-center gap-1">
                          <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="truncate">{step.navigation_cta.label} → {step.navigation_cta.path}</span>
                        </p>
                      )}
                      {(step as OnboardingStepExtended).context_type && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs mt-1">
                          {(step as OnboardingStepExtended).context_type}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditStep(step)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteStepId(step.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit Sheet (Slide-out Panel) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle>{isCreating ? "Create Onboarding Step" : "Edit Onboarding Step"}</SheetTitle>
            <SheetDescription>
              {isCreating ? "Add a new step to the onboarding flow" : "Configure step details and optional navigation CTA"}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {editingStep && (
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  {isCreating && (
                    <div className="space-y-2">
                      <Label>Key *</Label>
                      <Input
                        value={editingStep.key}
                        onChange={(e) => setEditingStep({ ...editingStep, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                        placeholder="e.g., setup_profile, invite_team"
                      />
                      <p className="text-xs text-muted-foreground">
                        Unique identifier (lowercase, underscores only)
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title {isCreating && "*"}</Label>
                      <Input
                        value={editingStep.title}
                        onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={customCategory ? "__custom__" : editingStep.category}
                        onValueChange={(value) => {
                          if (value === "__custom__") {
                            setCustomCategory(editingStep.category || "");
                          } else {
                            setEditingStep({ ...editingStep, category: value });
                            setCustomCategory("");
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                          <SelectItem value="__custom__">+ Add new category</SelectItem>
                        </SelectContent>
                      </Select>
                      {customCategory !== "" && (
                        <Input
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                          placeholder="new_category_name"
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>

                  {!isCreating && (
                    <div className="space-y-2">
                      <Label>Key (read-only)</Label>
                      <Input value={editingStep.key} disabled className="bg-muted text-xs" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Context Type</Label>
                    <Select
                      value={editingStep.context_type || ""}
                      onValueChange={(value) => setEditingStep({ ...editingStep, context_type: value || null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select context" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_CONTEXT_TYPES.map((ctx) => (
                          <SelectItem key={ctx.value} value={ctx.value}>
                            {ctx.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      When this step appears (personal account, org, or entity-specific)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editingStep.description || ""}
                      onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>AI Prompt Hint</Label>
                    <Textarea
                      value={editingStep.prompt_hint || ""}
                      onChange={(e) => setEditingStep({ ...editingStep, prompt_hint: e.target.value })}
                      rows={3}
                      placeholder="Instructions for the AI on how to guide the user through this step..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingStep.is_required}
                        onCheckedChange={(checked) => setEditingStep({ ...editingStep, is_required: checked })}
                      />
                      <Label>Required step</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingStep.is_active}
                        onCheckedChange={(checked) => setEditingStep({ ...editingStep, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Navigation CTA Section */}
                <div className="space-y-4">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm sm:text-base">Navigation CTA</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Guide users to a specific screen to complete this step
                      </p>
                    </div>
                    <Switch
                      checked={editingStep.navigation_cta?.enabled || false}
                      onCheckedChange={(checked) =>
                        setEditingStep({
                          ...editingStep,
                          navigation_cta: {
                            ...editingStep.navigation_cta!,
                            enabled: checked,
                          },
                        })
                      }
                    />
                  </div>

                  {editingStep.navigation_cta?.enabled && (
                    <div className="space-y-4 p-3 sm:p-4 rounded-lg border bg-muted/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Button Label</Label>
                          <Input
                            value={editingStep.navigation_cta.label}
                            onChange={(e) =>
                              setEditingStep({
                                ...editingStep,
                                navigation_cta: {
                                  ...editingStep.navigation_cta!,
                                  label: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., Set up Stripe Connect"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Path / URL</Label>
                          <Input
                            value={editingStep.navigation_cta.path}
                            onChange={(e) =>
                              setEditingStep({
                                ...editingStep,
                                navigation_cta: {
                                  ...editingStep.navigation_cta!,
                                  path: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., /admin/billing/connect"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">CTA Description</Label>
                        <Textarea
                          value={editingStep.navigation_cta.description}
                          onChange={(e) =>
                            setEditingStep({
                              ...editingStep,
                              navigation_cta: {
                                ...editingStep.navigation_cta!,
                                description: e.target.value,
                              },
                            })
                          }
                          placeholder="Instructions shown to the user about what to do..."
                          rows={2}
                        />
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={editingStep.navigation_cta.external}
                            onCheckedChange={(checked) =>
                              setEditingStep({
                                ...editingStep,
                                navigation_cta: {
                                  ...editingStep.navigation_cta!,
                                  external: checked,
                                },
                              })
                            }
                          />
                          <Label className="flex items-center gap-1 text-sm">
                            External URL
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={editingStep.navigation_cta.complete_on_return}
                            onCheckedChange={(checked) =>
                              setEditingStep({
                                ...editingStep,
                                navigation_cta: {
                                  ...editingStep.navigation_cta!,
                                  complete_on_return: checked,
                                },
                              })
                            }
                          />
                          <Label className="text-sm">Auto-complete when user returns</Label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Settings Check Section */}
                <div className="space-y-4">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm sm:text-base flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Auto-Completion Check
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Automatically complete this step when settings are already filled
                      </p>
                    </div>
                    <Switch
                      checked={editingStep.settings_check?.enabled || false}
                      onCheckedChange={(checked) =>
                        setEditingStep({
                          ...editingStep,
                          settings_check: {
                            ...editingStep.settings_check!,
                            enabled: checked,
                          },
                        })
                      }
                    />
                  </div>

                  {editingStep.settings_check?.enabled && (
                    <div className="space-y-4 p-3 sm:p-4 rounded-lg border bg-muted/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Table</Label>
                          <Input
                            value={editingStep.settings_check.table || ""}
                            onChange={(e) =>
                              setEditingStep({
                                ...editingStep,
                                settings_check: {
                                  ...editingStep.settings_check!,
                                  table: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., profiles, organizations"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Field</Label>
                          <Input
                            value={editingStep.settings_check.field || ""}
                            onChange={(e) =>
                              setEditingStep({
                                ...editingStep,
                                settings_check: {
                                  ...editingStep.settings_check!,
                                  field: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., display_name, avatar_url"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Check Type</Label>
                          <Select
                            value={editingStep.settings_check.check_type || "not_null"}
                            onValueChange={(value: "not_null" | "not_empty" | "has_rows") =>
                              setEditingStep({
                                ...editingStep,
                                settings_check: {
                                  ...editingStep.settings_check!,
                                  check_type: value,
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_null">Field is not null</SelectItem>
                              <SelectItem value="not_empty">Field is not empty</SelectItem>
                              <SelectItem value="has_rows">Table has rows</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Context Field (optional)</Label>
                          <Input
                            value={editingStep.settings_check.context_field || ""}
                            onChange={(e) =>
                              setEditingStep({
                                ...editingStep,
                                settings_check: {
                                  ...editingStep.settings_check!,
                                  context_field: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., org_id for org context"
                          />
                        </div>
                      </div>

                      {editingStep.settings_check.check_type === "has_rows" && (
                        <div className="space-y-2">
                          <Label className="text-sm">Minimum Row Count</Label>
                          <Input
                            type="number"
                            min={1}
                            value={editingStep.settings_check.min_count || 1}
                            onChange={(e) =>
                              setEditingStep({
                                ...editingStep,
                                settings_check: {
                                  ...editingStep.settings_check!,
                                  min_count: parseInt(e.target.value) || 1,
                                },
                              })
                            }
                          />
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        When this check passes, the step will be auto-completed when the onboarding chat starts.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>

          <SheetFooter className="flex-row gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleSaveStep} disabled={updateMutation.isPending || createMutation.isPending} className="flex-1 sm:flex-none">
              {isCreating ? "Create Step" : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Reset Onboarding Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Onboarding</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear onboarding progress and/or conversation history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="resetSelf"
                checked={resetSelf}
                onCheckedChange={(checked) => {
                  setResetSelf(checked === true);
                  if (checked) setResetTargetEmail("");
                }}
              />
              <Label htmlFor="resetSelf">Reset my own onboarding</Label>
            </div>

            {!resetSelf && (
              <div className="space-y-2">
                <Label>Target User Email</Label>
                <Input
                  placeholder="user@example.com"
                  value={resetTargetEmail}
                  onChange={(e) => setResetTargetEmail(e.target.value)}
                />
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">What to reset:</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="resetProgress"
                  checked={resetProgress}
                  onCheckedChange={(checked) => setResetProgress(checked === true)}
                />
                <Label htmlFor="resetProgress" className="font-normal">
                  Progress (step completion status)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="resetConversations"
                  checked={resetConversations}
                  onCheckedChange={(checked) => setResetConversations(checked === true)}
                />
                <Label htmlFor="resetConversations" className="font-normal">
                  Conversations (chat history with assistant)
                </Label>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetOnboarding}
              disabled={resetMutation.isPending || (!resetSelf && !resetTargetEmail)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetMutation.isPending ? "Resetting..." : "Reset Onboarding"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Step Confirmation Dialog */}
      <AlertDialog open={!!deleteStepId} onOpenChange={(open) => !open && setDeleteStepId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Onboarding Step</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this step and any associated progress data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStepId && deleteMutation.mutate(deleteStepId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Step"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

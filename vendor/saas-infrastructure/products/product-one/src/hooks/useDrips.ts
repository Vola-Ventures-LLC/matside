import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type MilestoneCategory = "onboarding" | "engagement" | "billing" | "support";
export type DripEvalType = "simple" | "ai";
export type DripTriggerStatus = "active" | "paused" | "draft";
export type DripConditionOperator = "has" | "not_has" | "not_has_for";

export interface MilestoneDefinition {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: MilestoneCategory;
  is_active: boolean;
  auto_track: boolean;
  tracking_event: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserMilestone {
  id: string;
  user_id: string;
  milestone_key: string;
  completed_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DripTrigger {
  id: string;
  name: string;
  description: string | null;
  template_name: string;
  eval_type: DripEvalType;
  ai_prompt: string | null;
  status: DripTriggerStatus;
  priority: number;
  cooldown_hours: number;
  max_sends_per_user: number;
  condition_logic: string;
  created_at: string;
  updated_at: string;
  conditions?: DripTriggerCondition[];
}

export interface DripTriggerCondition {
  id: string;
  trigger_id: string;
  milestone_key: string;
  operator: DripConditionOperator;
  duration_hours: number | null;
  sort_order: number;
  created_at: string;
}

export interface DripSend {
  id: string;
  user_id: string;
  trigger_id: string;
  template_name: string;
  sent_at: string;
  email_message_id: string | null;
  evaluation_result: Record<string, unknown>;
  created_at: string;
  trigger?: DripTrigger;
}

// Hook for managing milestone definitions
export function useMilestoneDefinitions() {
  const [milestones, setMilestones] = useState<MilestoneDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMilestones = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("milestone_definitions")
      .select("*")
      .order("category")
      .order("sort_order");

    if (error) {
      console.error("Error fetching milestones:", error);
    } else {
      setMilestones((data as MilestoneDefinition[]) || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const createMilestone = async (milestone: Omit<MilestoneDefinition, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase
      .from("milestone_definitions")
      .insert(milestone)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    toast({ title: "Success", description: "Milestone created" });
    fetchMilestones();
    return data;
  };

  const updateMilestone = async (id: string, updates: Partial<MilestoneDefinition>) => {
    const { error } = await supabase
      .from("milestone_definitions")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Success", description: "Milestone updated" });
    fetchMilestones();
    return true;
  };

  const deleteMilestone = async (id: string) => {
    const { error } = await supabase
      .from("milestone_definitions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Success", description: "Milestone deleted" });
    fetchMilestones();
    return true;
  };

  const milestonesByCategory = milestones.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<MilestoneCategory, MilestoneDefinition[]>);

  return {
    milestones,
    milestonesByCategory,
    isLoading,
    refetch: fetchMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  };
}

// Hook for managing drip triggers
export function useDripTriggers() {
  const [triggers, setTriggers] = useState<DripTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTriggers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("drip_triggers")
      .select(`
        *,
        conditions:drip_trigger_conditions(*)
      `)
      .order("priority", { ascending: false });

    if (error) {
      console.error("Error fetching triggers:", error);
    } else {
      setTriggers((data as unknown as DripTrigger[]) || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTriggers();
  }, [fetchTriggers]);

  const createTrigger = async (
    trigger: Omit<DripTrigger, "id" | "created_at" | "updated_at" | "conditions">,
    conditions: Omit<DripTriggerCondition, "id" | "trigger_id" | "created_at">[]
  ) => {
    const { data, error } = await supabase
      .from("drip_triggers")
      .insert(trigger)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    // Add conditions
    if (conditions.length > 0) {
      const { error: condError } = await supabase
        .from("drip_trigger_conditions")
        .insert(conditions.map(c => ({ ...c, trigger_id: data.id })));

      if (condError) {
        console.error("Error adding conditions:", condError);
      }
    }

    toast({ title: "Success", description: "Drip trigger created" });
    fetchTriggers();
    return data;
  };

  const updateTrigger = async (id: string, updates: Partial<DripTrigger>) => {
    const { error } = await supabase
      .from("drip_triggers")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Success", description: "Trigger updated" });
    fetchTriggers();
    return true;
  };

  const deleteTrigger = async (id: string) => {
    const { error } = await supabase
      .from("drip_triggers")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Success", description: "Trigger deleted" });
    fetchTriggers();
    return true;
  };

  const updateConditions = async (
    triggerId: string,
    conditions: Omit<DripTriggerCondition, "id" | "trigger_id" | "created_at">[]
  ) => {
    // Delete existing conditions
    await supabase
      .from("drip_trigger_conditions")
      .delete()
      .eq("trigger_id", triggerId);

    // Add new conditions
    if (conditions.length > 0) {
      const { error } = await supabase
        .from("drip_trigger_conditions")
        .insert(conditions.map(c => ({ ...c, trigger_id: triggerId })));

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return false;
      }
    }

    toast({ title: "Success", description: "Conditions updated" });
    fetchTriggers();
    return true;
  };

  const runTriggerEvaluation = async (triggerId?: string, userId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-drip-triggers", {
        body: { trigger_id: triggerId, user_id: userId },
      });

      if (error) throw error;

      toast({
        title: "Evaluation Complete",
        description: `Triggered: ${data.triggered}, Skipped: ${data.skipped}`,
      });
      return data;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Evaluation failed",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    triggers,
    isLoading,
    refetch: fetchTriggers,
    createTrigger,
    updateTrigger,
    deleteTrigger,
    updateConditions,
    runTriggerEvaluation,
  };
}

// Hook for viewing drip sends (audit log)
export function useDripSends(triggerId?: string) {
  const [sends, setSends] = useState<DripSend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSends = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from("drip_sends")
      .select(`
        *,
        trigger:drip_triggers(id, name, template_name)
      `)
      .order("sent_at", { ascending: false })
      .limit(100);

    if (triggerId) {
      query = query.eq("trigger_id", triggerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching drip sends:", error);
    } else {
      setSends((data as unknown as DripSend[]) || []);
    }
    setIsLoading(false);
  }, [triggerId]);

  useEffect(() => {
    fetchSends();
  }, [fetchSends]);

  return { sends, isLoading, refetch: fetchSends };
}

// Hook for tracking user milestones (for current user)
export function useUserMilestones(userId?: string) {
  const [milestones, setMilestones] = useState<UserMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserMilestones = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("user_milestones")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Error fetching user milestones:", error);
    } else {
      setMilestones((data as UserMilestone[]) || []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchUserMilestones();
  }, [fetchUserMilestones]);

  const completedKeys = milestones.map(m => m.milestone_key);

  return {
    milestones,
    completedKeys,
    isLoading,
    refetch: fetchUserMilestones,
    hasMilestone: (key: string) => completedKeys.includes(key),
  };
}

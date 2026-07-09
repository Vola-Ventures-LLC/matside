import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GuideRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useGuideRoles() {
  const [roles, setRoles] = useState<GuideRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guide_roles")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ title: "Error loading roles", description: error.message, variant: "destructive" });
    } else {
      setRoles((data || []) as GuideRole[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = async (role: Partial<GuideRole>) => {
    const { data, error } = await supabase
      .from("guide_roles")
      .insert({
        name: role.name!,
        slug: role.slug!,
        description: role.description,
        icon: role.icon,
        color: role.color,
        sort_order: role.sort_order,
        is_active: role.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating role", description: error.message, variant: "destructive" });
      return null;
    }
    await fetchRoles();
    return data;
  };

  const updateRole = async (id: string, updates: Partial<GuideRole>) => {
    const { error } = await supabase
      .from("guide_roles")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating role", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchRoles();
    return true;
  };

  const deleteRole = async (id: string) => {
    const { error } = await supabase
      .from("guide_roles")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting role", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchRoles();
    return true;
  };

  return { roles, loading, fetchRoles, createRole, updateRole, deleteRole };
}

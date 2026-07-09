import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

export interface WebhookEventType {
  id: string;
  event_name: string;
  category: string;
  description: string | null;
  payload_schema: Json | null;
  is_active: boolean;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  status: "active" | "paused" | "disabled";
  owner_type: "admin" | "organization" | "user";
  owner_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  subscriptions?: WebhookSubscription[];
}

export interface WebhookSubscription {
  id: string;
  endpoint_id: string;
  event_type_id: string;
  is_active: boolean;
  event_type?: WebhookEventType;
}

export interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: Json;
  response_status: number | null;
  response_body: string | null;
  status: "pending" | "success" | "failed" | "retrying";
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
  completed_at: string | null;
  endpoint?: WebhookEndpoint;
}

export function useWebhookEventTypes() {
  const [eventTypes, setEventTypes] = useState<WebhookEventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    const { data, error } = await supabase
      .from("webhook_event_types")
      .select("*")
      .order("category", { ascending: true });

    if (error) {
      console.error("Failed to fetch event types:", error);
    } else {
      setEventTypes((data as WebhookEventType[]) || []);
    }
    setIsLoading(false);
  };

  return { eventTypes, isLoading, refetch: fetchEventTypes };
}

export function useWebhookEndpoints() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .select(`
        *,
        subscriptions:webhook_subscriptions(
          id,
          event_type_id,
          is_active,
          event_type:webhook_event_types(id, event_name, category)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch endpoints:", error);
    } else {
      setEndpoints((data as unknown as WebhookEndpoint[]) || []);
    }
    setIsLoading(false);
  };

  const createEndpoint = async (endpoint: {
    name: string;
    url: string;
    description?: string;
    event_type_ids: string[];
  }) => {
    // Generate a random secret
    const secret = `whsec_${crypto.randomUUID().replace(/-/g, "")}`;

    const { data, error } = await supabase
      .from("webhook_endpoints")
      .insert({
        name: endpoint.name,
        url: endpoint.url,
        secret,
        description: endpoint.description || null,
        owner_type: "admin",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    // Create subscriptions
    if (endpoint.event_type_ids.length > 0) {
      const { error: subError } = await supabase
        .from("webhook_subscriptions")
        .insert(
          endpoint.event_type_ids.map((eventTypeId) => ({
            endpoint_id: data.id,
            event_type_id: eventTypeId,
          }))
        );

      if (subError) {
        console.error("Failed to create subscriptions:", subError);
      }
    }

    toast({ title: "Success", description: "Webhook endpoint created" });
    fetchEndpoints();
    return data;
  };

  const updateEndpoint = async (
    id: string,
    updates: Partial<Pick<WebhookEndpoint, "name" | "url" | "status" | "description">>
  ) => {
    const { error } = await supabase
      .from("webhook_endpoints")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Success", description: "Endpoint updated" });
    fetchEndpoints();
    return true;
  };

  const deleteEndpoint = async (id: string) => {
    const { error } = await supabase
      .from("webhook_endpoints")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Success", description: "Endpoint deleted" });
    fetchEndpoints();
    return true;
  };

  const updateSubscriptions = async (endpointId: string, eventTypeIds: string[]) => {
    // Delete existing subscriptions
    await supabase
      .from("webhook_subscriptions")
      .delete()
      .eq("endpoint_id", endpointId);

    // Create new subscriptions
    if (eventTypeIds.length > 0) {
      const { error } = await supabase
        .from("webhook_subscriptions")
        .insert(
          eventTypeIds.map((eventTypeId) => ({
            endpoint_id: endpointId,
            event_type_id: eventTypeId,
          }))
        );

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return false;
      }
    }

    toast({ title: "Success", description: "Subscriptions updated" });
    fetchEndpoints();
    return true;
  };

  return {
    endpoints,
    isLoading,
    refetch: fetchEndpoints,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    updateSubscriptions,
  };
}

export function useWebhookDeliveries(endpointId?: string) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    let query = supabase
      .from("webhook_deliveries")
      .select(`
        *,
        endpoint:webhook_endpoints(id, name, url)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (endpointId) {
      query = query.eq("endpoint_id", endpointId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch deliveries:", error);
    } else {
      setDeliveries((data as unknown as WebhookDelivery[]) || []);
    }
    setIsLoading(false);
  }, [endpointId]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  return { deliveries, isLoading, refetch: fetchDeliveries };
}

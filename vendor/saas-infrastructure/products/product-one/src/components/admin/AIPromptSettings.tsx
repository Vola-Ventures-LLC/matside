import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, RotateCcw, Bot, MessageCircle, Sparkles, AlertCircle, ChevronDown, ChevronRight, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AIPromptConfig {
  id: string;
  prompt_key: string;
  name: string;
  description: string | null;
  prompt_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PROMPT_GROUPS: Record<string, { title: string; icon: React.ReactNode; description: string }> = {
  onboarding: {
    title: "Onboarding Prompts",
    icon: <Sparkles className="h-5 w-5" />,
    description: "Configure the conversational onboarding assistant behavior and guardrails",
  },
  chat_agent: {
    title: "Chat Agent Prompts",
    icon: <MessageCircle className="h-5 w-5" />,
    description: "Configure how the AI chat assistant behaves and responds",
  },
  chat_welcome: {
    title: "Welcome Messages",
    icon: <Sparkles className="h-5 w-5" />,
    description: "Customize the initial greeting for each category",
  },
  chat_category: {
    title: "Category Guidance",
    icon: <Bot className="h-5 w-5" />,
    description: "Category-specific instructions added to the system prompt",
  },
  ticket: {
    title: "Ticket AI Prompts",
    icon: <AlertCircle className="h-5 w-5" />,
    description: "Configure AI behavior for ticket analysis and auto-drafting",
  },
};

function getPromptGroup(key: string): string {
  if (key.startsWith("onboarding_")) return "onboarding";
  if (key.startsWith("chat_welcome_")) return "chat_welcome";
  if (key.startsWith("chat_category_")) return "chat_category";
  if (key.startsWith("chat_")) return "chat_agent";
  if (key.startsWith("ticket_")) return "ticket";
  return "other";
}

export function AIPromptSettings() {
  const queryClient = useQueryClient();
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    onboarding: true,
    chat_agent: true,
    chat_welcome: false,
    chat_category: false,
    ticket: true,
  });

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["ai-prompt-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_prompt_configs")
        .select("*")
        .order("prompt_key");
      
      if (error) throw error;
      return data as AIPromptConfig[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, prompt_template, is_active }: { id: string; prompt_template?: string; is_active?: boolean }) => {
      const updates: Partial<AIPromptConfig> = {};
      if (prompt_template !== undefined) updates.prompt_template = prompt_template;
      if (is_active !== undefined) updates.is_active = is_active;
      
      const { error } = await supabase
        .from("ai_prompt_configs")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prompt-configs"] });
      toast.success("Prompt saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save prompt: " + (error instanceof Error ? error.message : "Unknown error"));
    },
  });

  // Initialize edited prompts from database
  useEffect(() => {
    if (prompts) {
      const initial: Record<string, string> = {};
      prompts.forEach((p) => {
        initial[p.id] = p.prompt_template;
      });
      setEditedPrompts(initial);
    }
  }, [prompts]);

  const handlePromptChange = (id: string, value: string) => {
    setEditedPrompts((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = (prompt: AIPromptConfig) => {
    const newTemplate = editedPrompts[prompt.id];
    if (newTemplate !== prompt.prompt_template) {
      updateMutation.mutate({ id: prompt.id, prompt_template: newTemplate });
    }
  };

  const handleReset = (prompt: AIPromptConfig) => {
    setEditedPrompts((prev) => ({ ...prev, [prompt.id]: prompt.prompt_template }));
  };

  const handleToggleActive = (prompt: AIPromptConfig) => {
    updateMutation.mutate({ id: prompt.id, is_active: !prompt.is_active });
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const hasChanges = (prompt: AIPromptConfig) => {
    return editedPrompts[prompt.id] !== prompt.prompt_template;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  // Group prompts by category
  const groupedPrompts = prompts?.reduce((acc, prompt) => {
    const group = getPromptGroup(prompt.prompt_key);
    if (!acc[group]) acc[group] = [];
    acc[group].push(prompt);
    return acc;
  }, {} as Record<string, AIPromptConfig[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Prompt Configuration</h2>
        <p className="text-muted-foreground">
          Customize the prompts used by the AI chat assistant and ticket auto-reply system.
        </p>
      </div>

      {Object.entries(PROMPT_GROUPS).map(([groupKey, groupInfo]) => {
        const groupPrompts = groupedPrompts?.[groupKey] || [];
        if (groupPrompts.length === 0) return null;

        return (
          <Collapsible
            key={groupKey}
            open={expandedGroups[groupKey]}
            onOpenChange={() => toggleGroup(groupKey)}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-primary">{groupInfo.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{groupInfo.title}</CardTitle>
                        <CardDescription>{groupInfo.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{groupPrompts.length}</Badge>
                      {expandedGroups[groupKey] ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6 pt-0">
                  {groupPrompts.map((prompt) => (
                    <div key={prompt.id} className="space-y-3 border-t pt-4 first:border-t-0 first:pt-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{prompt.name}</h4>
                            {prompt.description && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-sm">
                                  {prompt.description}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {prompt.prompt_key}
                          </code>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`active-${prompt.id}`}
                              checked={prompt.is_active}
                              onCheckedChange={() => handleToggleActive(prompt)}
                            />
                            <Label htmlFor={`active-${prompt.id}`} className="text-sm text-muted-foreground">
                              Active
                            </Label>
                          </div>
                        </div>
                      </div>
                      
                      <Textarea
                        value={editedPrompts[prompt.id] || ""}
                        onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                        className="min-h-[150px] font-mono text-sm"
                        placeholder="Enter prompt template..."
                      />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Last updated: {new Date(prompt.updated_at).toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReset(prompt)}
                            disabled={!hasChanges(prompt)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSave(prompt)}
                            disabled={!hasChanges(prompt) || updateMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}

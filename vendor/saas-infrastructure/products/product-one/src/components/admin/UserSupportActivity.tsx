import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Ticket,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
}

interface SupportConversation {
  id: string;
  category: string;
  status: string;
  message_count: number;
  started_at: string;
}

interface ConversationInsight {
  id: string;
  conversation_id: string;
  insight_text: string;
  sentiment: string;
  category: string;
  tags: string[] | null;
  created_at: string;
}

interface UserSupportActivityProps {
  userId: string;
  onNavigateAway?: () => void;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  closed: "bg-muted text-muted-foreground",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  escalated: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const sentimentColors: Record<string, string> = {
  positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  neutral: "bg-muted text-muted-foreground",
};

export function UserSupportActivity({ userId, onNavigateAway }: UserSupportActivityProps) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [insights, setInsights] = useState<ConversationInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSupportData = async () => {
      setIsLoading(true);

      // Fetch tickets and conversations in parallel
      const [ticketsResult, conversationsResult] = await Promise.all([
        supabase
          .from("support_tickets")
          .select("id, subject, category, status, priority, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("support_conversations")
          .select("id, category, status, message_count, started_at")
          .eq("user_id", userId)
          .order("started_at", { ascending: false }),
      ]);

      if (ticketsResult.data) {
        setTickets(ticketsResult.data);
      }

      if (conversationsResult.data) {
        setConversations(conversationsResult.data);
        
        // Fetch insights for this user's conversations
        if (conversationsResult.data.length > 0) {
          const conversationIds = conversationsResult.data.map((c) => c.id);
          const { data: insightsData } = await supabase
            .from("conversation_insights")
            .select("id, conversation_id, insight_text, sentiment, category, tags, created_at")
            .in("conversation_id", conversationIds)
            .is("merged_into_id", null)
            .order("created_at", { ascending: false });
          
          if (insightsData) {
            setInsights(insightsData);
          }
        }
      }

      setIsLoading(false);
    };

    fetchSupportData();
  }, [userId]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleViewTicket = (ticketId: string) => {
    onNavigateAway?.();
    navigate(`/admin/support/tickets/${ticketId}`);
  };

  const handleViewConversation = (conversationId: string) => {
    onNavigateAway?.();
    navigate(`/admin/support?conversation=${conversationId}`);
  };

  const handleViewInsight = (insightId: string) => {
    onNavigateAway?.();
    navigate(`/admin/support/insights?highlight=${insightId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" text="Loading support activity..." />
      </div>
    );
  }

  const totalCount = tickets.length + conversations.length + insights.length;

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No support activity"
        description="This user has no tickets, conversations, or insights"
      />
    );
  }

  return (
    <Tabs defaultValue="tickets" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="tickets" className="gap-1.5">
          <Ticket className="h-3.5 w-3.5" />
          Tickets
          {tickets.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {tickets.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="conversations" className="gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          Chats
          {conversations.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {conversations.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="insights" className="gap-1.5">
          <Lightbulb className="h-3.5 w-3.5" />
          Insights
          {insights.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {insights.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tickets" className="mt-4 space-y-2">
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No support tickets
          </p>
        ) : (
          tickets.map((ticket) => (
            <Collapsible
              key={ticket.id}
              open={expandedItems.has(ticket.id)}
              onOpenChange={() => toggleExpand(ticket.id)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 text-left">
                  {expandedItems.has(ticket.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm truncate max-w-[180px]">
                    {ticket.subject}
                  </span>
                </div>
                <Badge className={statusColors[ticket.status] || ""}>
                  {ticket.status.replace("_", " ")}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                <div className="mt-2 pt-2 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="capitalize">{ticket.category.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge className={priorityColors[ticket.priority] || ""}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{format(new Date(ticket.created_at), "MMM d, yyyy")}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleViewTicket(ticket.id)}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    View Ticket
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </TabsContent>

      <TabsContent value="conversations" className="mt-4 space-y-2">
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No chat conversations
          </p>
        ) : (
          conversations.map((conv) => (
            <Collapsible
              key={conv.id}
              open={expandedItems.has(conv.id)}
              onOpenChange={() => toggleExpand(conv.id)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 text-left">
                  {expandedItems.has(conv.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm capitalize">
                    {conv.category.replace("_", " ")}
                  </span>
                </div>
                <Badge className={statusColors[conv.status] || ""}>
                  {conv.status}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                <div className="mt-2 pt-2 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages:</span>
                    <span>{conv.message_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{format(new Date(conv.started_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleViewConversation(conv.id)}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    View Conversation
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </TabsContent>

      <TabsContent value="insights" className="mt-4 space-y-2">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No AI-extracted insights
          </p>
        ) : (
          insights.map((insight) => (
            <Collapsible
              key={insight.id}
              open={expandedItems.has(insight.id)}
              onOpenChange={() => toggleExpand(insight.id)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                  {expandedItems.has(insight.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  <span className="font-medium text-sm truncate">
                    {insight.insight_text.slice(0, 50)}...
                  </span>
                </div>
                <Badge className={sentimentColors[insight.sentiment] || ""}>
                  {insight.sentiment}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                <div className="mt-2 pt-2 border-t space-y-2 text-sm">
                  <p className="text-muted-foreground">{insight.insight_text}</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="capitalize">{insight.category.replace("_", " ")}</span>
                  </div>
                  {insight.tags && insight.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {insight.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Extracted:</span>
                    <span>{format(new Date(insight.created_at), "MMM d, yyyy")}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleViewInsight(insight.id)}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    View in Insights Dashboard
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

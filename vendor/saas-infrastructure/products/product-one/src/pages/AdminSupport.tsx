import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MessageSquare, AlertCircle, CheckCircle, Clock, ChevronRight, Filter, RefreshCw, Search, MessagesSquare, Frown, Meh, Smile, AlertTriangle, TrendingUp, TrendingDown, Bot, Star, BarChart3, UserCheck, Users } from "lucide-react";
import { AIPromptSettings } from "@/components/admin/AIPromptSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  sentiment: string | null;
  urgency: string | null;
  created_at: string;
  user_id: string | null;
  guest_email: string | null;
  assigned_to: string | null;
}

interface Conversation {
  id: string;
  category: string;
  status: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  guest_email: string | null;
}

interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: <AlertCircle className="h-3 w-3" /> },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", icon: <Clock className="h-3 w-3" /> },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: <CheckCircle className="h-3 w-3" /> },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", icon: <CheckCircle className="h-3 w-3" /> },
  active: { label: "Active", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: <MessageSquare className="h-3 w-3" /> },
  ended: { label: "Ended", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", icon: <CheckCircle className="h-3 w-3" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  normal: { label: "Normal", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  high: { label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

const SENTIMENT_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  positive: { label: "Positive", icon: <Smile className="h-3.5 w-3.5" />, color: "text-green-600" },
  neutral: { label: "Neutral", icon: <Meh className="h-3.5 w-3.5" />, color: "text-gray-500" },
  negative: { label: "Negative", icon: <Frown className="h-3.5 w-3.5" />, color: "text-red-500" },
};

const URGENCY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  low: { label: "Low", icon: <TrendingDown className="h-3.5 w-3.5" />, color: "text-green-600" },
  medium: { label: "Medium", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-amber-500" },
  high: { label: "High", icon: <TrendingUp className="h-3.5 w-3.5" />, color: "text-red-500" },
};

const CATEGORY_LABELS: Record<string, string> = {
  how_to: "How-To",
  bug: "Bug",
  feature_request: "Feature",
  positive_feedback: "Feedback",
  billing: "Billing",
  other: "Other",
};

// Mobile ticket card component
function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const sentimentConfig = ticket.sentiment ? SENTIMENT_CONFIG[ticket.sentiment] : null;
  const urgencyConfig = ticket.urgency ? URGENCY_CONFIG[ticket.urgency] : null;

  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-sm line-clamp-2 flex-1">{ticket.subject}</h3>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
        
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge className={STATUS_CONFIG[ticket.status]?.color || ""} variant="secondary">
            <span className="flex items-center gap-1">
              {STATUS_CONFIG[ticket.status]?.icon}
              {STATUS_CONFIG[ticket.status]?.label || ticket.status}
            </span>
          </Badge>
          <Badge className={PRIORITY_CONFIG[ticket.priority]?.color || ""} variant="secondary">
            {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
          </Badge>
          <Badge variant="outline">{ticket.category}</Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
          <div className="flex items-center gap-3">
            {sentimentConfig && (
              <span className={cn("flex items-center gap-1", sentimentConfig.color)}>
                {sentimentConfig.icon}
              </span>
            )}
            {urgencyConfig && (
              <span className={cn("flex items-center gap-1", urgencyConfig.color)}>
                {urgencyConfig.icon}
                {urgencyConfig.label}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSupport() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Define ticket columns for DataTable
  const ticketColumns: Column<Ticket>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (ticket) => (
        <span className="font-medium max-w-[250px] truncate block">
          {ticket.subject}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (ticket) => <Badge variant="outline">{ticket.category}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (ticket) => (
        <Badge className={STATUS_CONFIG[ticket.status]?.color || ""}>
          <span className="flex items-center gap-1">
            {STATUS_CONFIG[ticket.status]?.icon}
            {STATUS_CONFIG[ticket.status]?.label || ticket.status}
          </span>
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (ticket) => (
        <Badge className={PRIORITY_CONFIG[ticket.priority]?.color || ""}>
          {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
        </Badge>
      ),
    },
    {
      key: "sentiment",
      header: "Sentiment",
      render: (ticket) => {
        const sentimentConfig = ticket.sentiment ? SENTIMENT_CONFIG[ticket.sentiment] : null;
        return sentimentConfig ? (
          <span className={cn("flex items-center gap-1.5", sentimentConfig.color)}>
            {sentimentConfig.icon}
            <span className="text-sm">{sentimentConfig.label}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      key: "urgency",
      header: "Urgency",
      render: (ticket) => {
        const urgencyConfig = ticket.urgency ? URGENCY_CONFIG[ticket.urgency] : null;
        return urgencyConfig ? (
          <span className={cn("flex items-center gap-1.5", urgencyConfig.color)}>
            {urgencyConfig.icon}
            <span className="text-sm">{urgencyConfig.label}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      key: "created_at",
      header: "Created",
      render: (ticket) => (
        <span className="text-muted-foreground">
          {format(new Date(ticket.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      sortable: false,
      render: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  const [activeTab, setActiveTab] = useState("tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("unresolved");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch tickets
      let ticketQuery = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply status filter
      if (statusFilter === "unresolved") {
        ticketQuery = ticketQuery.in("status", ["open", "in_progress"]);
      } else if (statusFilter !== "all") {
        ticketQuery = ticketQuery.eq("status", statusFilter);
      }

      // Apply sentiment filter
      if (sentimentFilter !== "all") {
        ticketQuery = ticketQuery.eq("sentiment", sentimentFilter);
      }

      // Apply urgency filter
      if (urgencyFilter !== "all") {
        ticketQuery = ticketQuery.eq("urgency", urgencyFilter);
      }

      // Apply assignment filter
      if (assignmentFilter === "mine" && user) {
        ticketQuery = ticketQuery.eq("assigned_to", user.id);
      } else if (assignmentFilter === "unassigned") {
        ticketQuery = ticketQuery.is("assigned_to", null);
      }

      const { data: ticketData } = await ticketQuery;
      setTickets(ticketData || []);

      // Fetch all conversations
      let convQuery = supabase
        .from("support_conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (statusFilter === "unresolved" && activeTab === "conversations") {
        convQuery = convQuery.eq("status", "active");
      } else if (statusFilter !== "all" && statusFilter !== "unresolved" && activeTab === "conversations") {
        convQuery = convQuery.eq("status", statusFilter);
      }

      const { data: convData } = await convQuery;
      setConversations(convData || []);
    } catch (err) {
      console.error("Failed to fetch support data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, assignmentFilter, sentimentFilter, urgencyFilter, activeTab, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadConversationMessages = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setConversationMessages(data || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Define conversation columns for DataTable (after loadConversationMessages is defined)
  const conversationColumns: Column<Conversation>[] = [
    {
      key: "category",
      header: "Category",
      render: (conv) => (
        <Badge variant="outline">
          {CATEGORY_LABELS[conv.category] || conv.category}
        </Badge>
      ),
    },
    {
      key: "guest_email",
      header: "User",
      render: (conv) => (
        <span className="text-muted-foreground">
          {conv.guest_email || (conv.user_id ? "Registered User" : "Anonymous")}
        </span>
      ),
    },
    {
      key: "message_count",
      header: "Messages",
      render: (conv) => (
        <Badge variant="secondary" className="font-mono">
          {conv.message_count}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (conv) => (
        <Badge className={STATUS_CONFIG[conv.status]?.color || ""}>
          <span className="flex items-center gap-1">
            {STATUS_CONFIG[conv.status]?.icon}
            {STATUS_CONFIG[conv.status]?.label || conv.status}
          </span>
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Started",
      render: (conv) => (
        <span className="text-muted-foreground">
          {format(new Date(conv.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "updated_at",
      header: "Last Activity",
      render: (conv) => (
        <span className="text-muted-foreground">
          {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      sortable: false,
      render: (conv) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            loadConversationMessages(conv.id);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    conv.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.guest_email && conv.guest_email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const allTickets = tickets;
  const ticketStats = {
    open: allTickets.filter(t => t.status === "open").length,
    inProgress: allTickets.filter(t => t.status === "in_progress").length,
    resolved: allTickets.filter(t => t.status === "resolved" || t.status === "closed").length,
    highUrgency: allTickets.filter(t => t.urgency === "high").length,
  };

  const convStats = {
    active: conversations.filter(c => c.status === "active").length,
    ended: conversations.filter(c => c.status === "ended" || c.status === "closed").length,
    totalMessages: conversations.reduce((sum, c) => sum + c.message_count, 0),
    total: conversations.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Support Management</h1>
          <p className="text-muted-foreground text-sm">Manage tickets and view all conversations</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/support/satisfaction">
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-2" />
              Satisfaction
            </Button>
          </Link>
          <Button variant="outline" onClick={fetchData} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="tickets" className="flex-1 sm:flex-none flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Tickets</span>
            <Badge variant="secondary" className="ml-1">{ticketStats.open + ticketStats.inProgress}</Badge>
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex-1 sm:flex-none flex items-center gap-2">
            <MessagesSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Conversations</span>
            <Badge variant="secondary" className="ml-1">{convStats.active}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ai-prompts" className="flex-1 sm:flex-none flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI Prompts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4 sm:space-y-6">
          {/* Stats - Compact on mobile */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Open</p>
                    <p className="text-xl sm:text-2xl font-bold">{ticketStats.open}</p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                    <p className="text-xl sm:text-2xl font-bold">{ticketStats.inProgress}</p>
                  </div>
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                    <p className="text-xl sm:text-2xl font-bold">{ticketStats.resolved}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">High Urgency</p>
                    <p className="text-xl sm:text-2xl font-bold">{ticketStats.highUrgency}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters - Stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      All Tickets
                    </span>
                  </SelectItem>
                  <SelectItem value="mine">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5" />
                      Assigned to Me
                    </span>
                  </SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiment</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile: Card list / Desktop: Table */}
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No tickets found
                </CardContent>
              </Card>
            ) : (
              filteredTickets.map((ticket) => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  onClick={() => navigate(`/admin/support/tickets/${ticket.id}`)}
                />
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden sm:block">
            <DataTable
              data={filteredTickets}
              columns={ticketColumns}
              onRowClick={(ticket) => navigate(`/admin/support/tickets/${ticket.id}`)}
              emptyMessage="No tickets found"
              defaultSortKey="created_at"
              defaultSortDirection="desc"
            />
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4 sm:space-y-6">
          {/* Conversation Stats */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Active Chats</p>
                    <p className="text-xl sm:text-2xl font-bold">{convStats.active}</p>
                  </div>
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Ended Chats</p>
                    <p className="text-xl sm:text-2xl font-bold">{convStats.ended}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Messages</p>
                    <p className="text-xl sm:text-2xl font-bold">{convStats.totalMessages}</p>
                  </div>
                  <MessagesSquare className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">All Conversations</p>
                    <p className="text-xl sm:text-2xl font-bold">{convStats.total}</p>
                  </div>
                  <MessagesSquare className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversation Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by category or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unresolved">Active Only</SelectItem>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conversations Table */}
          <Card>
            <DataTable
              data={filteredConversations}
              columns={conversationColumns}
              emptyMessage="No conversations found"
              defaultSortKey="updated_at"
              defaultSortDirection="desc"
            />
          </Card>
        </TabsContent>

        <TabsContent value="ai-prompts" className="space-y-4 sm:space-y-6">
          <AIPromptSettings />
        </TabsContent>
      </Tabs>

      {/* Conversation Sheet */}
      <Sheet open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Conversation</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
            {isLoadingMessages ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {conversationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "p-3 rounded-lg",
                      msg.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {msg.role === "user" ? "User" : "Assistant"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

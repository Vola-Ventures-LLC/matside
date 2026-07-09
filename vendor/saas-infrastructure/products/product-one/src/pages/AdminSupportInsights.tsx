import { useState, useEffect, useRef, useCallback } from "react";
import { Lightbulb, Filter, RefreshCw, TrendingUp, TrendingDown, Minus, MessageSquare, Merge, Check, X, Hash, StickyNote, Circle, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Insight {
  id: string;
  insight_text: string;
  sentiment: string;
  category: string;
  tags: string[] | null;
  created_at: string;
  conversation_id: string;
  report_count: number;
  merged_into_id: string | null;
  notes: string | null;
  status: string;
}

interface TeamMember {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  positive: { label: "Positive", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", icon: <TrendingUp className="h-3 w-3" /> },
  negative: { label: "Negative", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200", icon: <TrendingDown className="h-3 w-3" /> },
  neutral: { label: "Neutral", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200", icon: <Minus className="h-3 w-3" /> },
};

const CATEGORY_LABELS: Record<string, string> = {
  how_to: "How-To Questions",
  bug: "Bug Reports",
  feature_request: "Feature Requests",
  positive_feedback: "Positive Feedback",
  billing: "Billing",
  other: "Other",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: <Circle className="h-3 w-3" /> },
  reviewed: { label: "Reviewed", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200", icon: <Check className="h-3 w-3" /> },
  actionable: { label: "Actionable", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", icon: <Lightbulb className="h-3 w-3" /> },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: <RefreshCw className="h-3 w-3" /> },
  resolved: { label: "Resolved", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", icon: <Check className="h-3 w-3" /> },
  dismissed: { label: "Dismissed", color: "bg-muted text-muted-foreground", icon: <X className="h-3 w-3" /> },
};

export default function AdminSupportInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedInsights, setSelectedInsights] = useState<Set<string>>(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [editingInsight, setEditingInsight] = useState<Insight | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("conversation_insights")
        .select("id, insight_text, sentiment, category, tags, created_at, conversation_id, report_count, merged_into_id, notes, status")
        .is("merged_into_id", null)
        .order("report_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (sentimentFilter !== "all") {
        query = query.eq("sentiment", sentimentFilter);
      }

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "new" | "reviewed" | "actionable" | "in_progress" | "resolved" | "dismissed");
      }

      const { data } = await query;
      setInsights((data || []) as Insight[]);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sentimentFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch team members (admins/owners) for mentions
  useEffect(() => {
    const fetchTeamMembers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, avatar_url")
        .or("role.eq.admin,role.eq.owner");
      
      if (data) {
        setTeamMembers(data as TeamMember[]);
      }
    };
    fetchTeamMembers();
  }, []);

  const loadConversation = async (conversationId: string) => {
    if (isMergeMode) return;
    setSelectedConversation(conversationId);
    setIsLoadingConversation(true);
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setConversationMessages(data || []);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const toggleInsightSelection = (id: string) => {
    setSelectedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleMerge = async () => {
    if (selectedInsights.size < 2) {
      toast.error("Select at least 2 insights to merge");
      return;
    }

    setIsMerging(true);
    try {
      const selectedArray = Array.from(selectedInsights);
      const selectedInsightData = insights.filter(i => selectedInsights.has(i.id));
      
      // Find the primary insight (highest report count, or earliest created)
      const primary = selectedInsightData.reduce((a, b) => 
        a.report_count > b.report_count ? a : 
        a.report_count < b.report_count ? b :
        new Date(a.created_at) < new Date(b.created_at) ? a : b
      );

      const othersIds = selectedArray.filter(id => id !== primary.id);
      const totalReportCount = selectedInsightData.reduce((sum, i) => sum + i.report_count, 0);

      // Update primary with combined report count
      const { error: updateError } = await supabase
        .from("conversation_insights")
        .update({ report_count: totalReportCount })
        .eq("id", primary.id);

      if (updateError) throw updateError;

      // Mark others as merged into primary
      const { error: mergeError } = await supabase
        .from("conversation_insights")
        .update({ merged_into_id: primary.id })
        .in("id", othersIds);

      if (mergeError) throw mergeError;

      toast.success(`Merged ${selectedInsights.size} insights`);
      setSelectedInsights(new Set());
      setIsMergeMode(false);
      fetchData();
    } catch (err) {
      console.error("Failed to merge insights:", err);
      toast.error("Failed to merge insights");
    } finally {
      setIsMerging(false);
    }
  };

  const cancelMergeMode = () => {
    setIsMergeMode(false);
    setSelectedInsights(new Set());
  };

  const openEditSheet = (insight: Insight) => {
    if (isMergeMode) return;
    setEditingInsight(insight);
    setEditNotes(insight.notes || "");
    setEditStatus(insight.status);
    setShowMentions(false);
    setMentionSearch("");
  };

  // Filter team members based on search
  const filteredMembers = teamMembers.filter((member) => {
    const search = mentionSearch.toLowerCase();
    return (
      member.display_name?.toLowerCase().includes(search) ||
      member.email?.toLowerCase().includes(search)
    );
  });

  // Handle textarea changes and detect @ mentions
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setEditNotes(value);
    setCursorPosition(cursorPos);

    // Check if we're typing after an @
    const textBeforeCursor = value.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // Insert mention into textarea
  const insertMention = (member: TeamMember) => {
    const textBeforeCursor = editNotes.substring(0, cursorPosition);
    const textAfterCursor = editNotes.substring(cursorPosition);
    
    // Find the @ position
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      const beforeAt = textBeforeCursor.substring(0, textBeforeCursor.length - atMatch[0].length);
      const mentionText = `@${member.display_name || member.email?.split("@")[0]} `;
      setEditNotes(beforeAt + mentionText + textAfterCursor);
      
      // Focus and set cursor position after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = beforeAt.length + mentionText.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
    setShowMentions(false);
  };

  // Parse mentions from content and return user IDs
  const parseMentions = useCallback(
    (content: string): string[] => {
      // eslint-disable-next-line security/detect-unsafe-regex
      const mentionPattern = /@(\w+(?:\s+\w+)?)/g;
      const matches = content.matchAll(mentionPattern);
      const mentionedNames = [...matches].map((m) => m[1].toLowerCase());

      return teamMembers
        .filter((member) => {
          const displayName = member.display_name?.toLowerCase() || "";
          const emailPrefix = member.email?.split("@")[0].toLowerCase() || "";
          return mentionedNames.some(
            (name) => displayName.includes(name) || emailPrefix.includes(name)
          );
        })
        .map((m) => m.user_id);
    },
    [teamMembers]
  );

  const handleSaveInsight = async () => {
    if (!editingInsight || !user) return;
    setIsSaving(true);
    try {
      const mentions = parseMentions(editNotes);
      
      const { error } = await supabase.rpc("update_insight_with_mentions", {
        p_insight_id: editingInsight.id,
        p_notes: editNotes || null,
        p_status: editStatus,
        p_author_id: user.id,
        p_mentions: mentions,
      });

      if (error) throw error;

      toast.success(mentions.length > 0 ? `Insight updated, ${mentions.length} notified` : "Insight updated");
      setEditingInsight(null);
      fetchData();
    } catch (err) {
      console.error("Failed to save insight:", err);
      toast.error("Failed to save insight");
    } finally {
      setIsSaving(false);
    }
  };

  const stats = {
    positive: insights.filter(i => i.sentiment === "positive").length,
    negative: insights.filter(i => i.sentiment === "negative").length,
    neutral: insights.filter(i => i.sentiment === "neutral").length,
    total: insights.length,
  };

  // Group insights by category for analysis
  const categoryBreakdown = insights.reduce((acc, insight) => {
    const cat = insight.category;
    if (!acc[cat]) acc[cat] = { positive: 0, negative: 0, neutral: 0 };
    acc[cat][insight.sentiment as keyof typeof acc[typeof cat]]++;
    return acc;
  }, {} as Record<string, { positive: number; negative: number; neutral: number }>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conversation Insights</h1>
          <p className="text-muted-foreground">AI-extracted insights from support conversations</p>
        </div>
        <div className="flex items-center gap-2">
          {isMergeMode ? (
            <>
              <Button 
                variant="default" 
                onClick={handleMerge} 
                disabled={selectedInsights.size < 2 || isMerging}
              >
                <Merge className="h-4 w-4 mr-2" />
                Merge {selectedInsights.size > 0 ? `(${selectedInsights.size})` : ""}
              </Button>
              <Button variant="outline" onClick={cancelMergeMode}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsMergeMode(true)}>
                <Merge className="h-4 w-4 mr-2" />
                Merge Insights
              </Button>
              <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.positive}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{stats.negative}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-slate-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neutral</CardTitle>
            <Minus className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.neutral}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.neutral / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insights by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(categoryBreakdown).map(([category, counts]) => (
                <div key={category} className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">{CATEGORY_LABELS[category] || category}</h4>
                  <div className="flex gap-2">
                    <Badge className={SENTIMENT_CONFIG.positive.color}>
                      {counts.positive} positive
                    </Badge>
                    <Badge className={SENTIMENT_CONFIG.negative.color}>
                      {counts.negative} negative
                    </Badge>
                    <Badge className={SENTIMENT_CONFIG.neutral.color}>
                      {counts.neutral} neutral
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiments</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="how_to">How-To Questions</SelectItem>
            <SelectItem value="bug">Bug Reports</SelectItem>
            <SelectItem value="feature_request">Feature Requests</SelectItem>
            <SelectItem value="positive_feedback">Positive Feedback</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Circle className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="actionable">Actionable</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Merge Mode Banner */}
      {isMergeMode && (
        <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm">Select insights to merge. Similar insights will be combined and report counts will be summed.</span>
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-3">
        {insights.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No insights yet. Insights are automatically extracted from closed support conversations.
            </CardContent>
          </Card>
        ) : (
          insights.map((insight) => (
            <Card 
              key={insight.id} 
              className={`transition-colors ${
                isMergeMode 
                  ? selectedInsights.has(insight.id) 
                    ? "border-primary bg-primary/5" 
                    : "hover:border-primary/50 cursor-pointer"
                  : "cursor-pointer hover:bg-muted/50"
              }`}
              onClick={() => isMergeMode ? toggleInsightSelection(insight.id) : loadConversation(insight.conversation_id)}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {isMergeMode && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedInsights.has(insight.id)}
                        onCheckedChange={() => toggleInsightSelection(insight.id)}
                        className="mt-1"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{insight.insight_text}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {insight.report_count > 1 && (
                            <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                              <Hash className="h-3 w-3 mr-1" />
                              {insight.report_count} reports
                            </Badge>
                          )}
                          <Badge className={`${STATUS_CONFIG[insight.status]?.color || ""} flex items-center gap-1`}>
                            {STATUS_CONFIG[insight.status]?.icon}
                            {STATUS_CONFIG[insight.status]?.label || insight.status}
                          </Badge>
                          <Badge variant="outline">{CATEGORY_LABELS[insight.category] || insight.category}</Badge>
                          {insight.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(insight.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        {insight.notes && (
                          <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                            <StickyNote className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{insight.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!isMergeMode && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditSheet(insight);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {!isMergeMode && (
                          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        <Badge className={`${SENTIMENT_CONFIG[insight.sentiment]?.color || ""} flex items-center gap-1`}>
                          {SENTIMENT_CONFIG[insight.sentiment]?.icon}
                          {SENTIMENT_CONFIG[insight.sentiment]?.label || insight.sentiment}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Conversation Sheet */}
      <Sheet open={!!selectedConversation} onOpenChange={(open) => !open && setSelectedConversation(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Original Conversation
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-4">
            {isLoadingConversation ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversationMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No messages found.</p>
            ) : (
              <div className="space-y-4">
                {conversationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground ml-8"
                        : "bg-muted mr-8"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Edit Insight Sheet */}
      <Sheet open={!!editingInsight} onOpenChange={(open) => !open && setEditingInsight(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Insight
            </SheetTitle>
          </SheetHeader>
          {editingInsight && (
            <div className="mt-6 space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">{editingInsight.insight_text}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={`${SENTIMENT_CONFIG[editingInsight.sentiment]?.color || ""} flex items-center gap-1`}>
                    {SENTIMENT_CONFIG[editingInsight.sentiment]?.icon}
                    {SENTIMENT_CONFIG[editingInsight.sentiment]?.label}
                  </Badge>
                  <Badge variant="outline">{CATEGORY_LABELS[editingInsight.category] || editingInsight.category}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      <span className="flex items-center gap-2">
                        <Circle className="h-3 w-3" /> New
                      </span>
                    </SelectItem>
                    <SelectItem value="reviewed">
                      <span className="flex items-center gap-2">
                        <Check className="h-3 w-3" /> Reviewed
                      </span>
                    </SelectItem>
                    <SelectItem value="actionable">
                      <span className="flex items-center gap-2">
                        <Lightbulb className="h-3 w-3" /> Actionable
                      </span>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3" /> In Progress
                      </span>
                    </SelectItem>
                    <SelectItem value="resolved">
                      <span className="flex items-center gap-2">
                        <Check className="h-3 w-3" /> Resolved
                      </span>
                    </SelectItem>
                    <SelectItem value="dismissed">
                      <span className="flex items-center gap-2">
                        <X className="h-3 w-3" /> Dismissed
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (use @ to mention team members)</Label>
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    id="notes"
                    value={editNotes}
                    onChange={handleNotesChange}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setShowMentions(false);
                      }
                    }}
                    placeholder="Add notes about this insight... Use @ to mention someone"
                    rows={4}
                  />
                  
                  {/* Mentions dropdown */}
                  {showMentions && filteredMembers.length > 0 && (
                    <div className="absolute z-50 bottom-full mb-1 left-0 w-full bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                      {filteredMembers.map((member) => (
                        <button
                          key={member.user_id}
                          type="button"
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-sm"
                          onClick={() => insertMention(member)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {(member.display_name || member.email || "?").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {member.display_name || member.email?.split("@")[0]}
                            </p>
                            {member.display_name && member.email && (
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => loadConversation(editingInsight.conversation_id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Conversation
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSaveInsight}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

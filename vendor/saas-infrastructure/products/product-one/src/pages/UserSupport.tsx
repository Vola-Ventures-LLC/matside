import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageSquare, Ticket, Clock, Send, ArrowLeft, CheckCircle, AlertCircle, Loader2, Star, Paperclip, X, Image as ImageIcon, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSupportChat, ConversationSummary } from "@/hooks/useSupportChat";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";

interface UserTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user_rating: number | null;
  user_feedback: string | null;
  closed_by_user: boolean;
}

interface TicketResponse {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  source?: string;
  attachments?: { name: string; url: string; type: string }[];
  admin_profile?: {
    display_name: string | null;
  } | null;
  user_id?: string | null;
}

interface Attachment {
  name: string;
  url: string;
  type: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-amber-500",
  resolved: "bg-green-500",
  closed: "bg-muted",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const CATEGORY_LABELS: Record<string, string> = {
  how_to: "How do I...?",
  bug: "Bug Report",
  feature_request: "Feature Request",
  positive_feedback: "Positive Feedback",
  billing: "Billing",
  other: "Other",
};

export default function UserSupport() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("tickets");
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);
  const [ticketResponses, setTicketResponses] = useState<TicketResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    conversationHistory,
    fetchHistory,
    loadConversation,
    messages: chatMessages,
    conversationId: activeChatId,
    isLoading: chatLoading,
  } = useSupportChat();

  // Check URL for ticket parameter
  useEffect(() => {
    const ticketId = searchParams.get("ticket");
    if (ticketId && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
        setActiveTab("tickets");
      }
    }
  }, [searchParams, tickets]);

  // Fetch user's tickets
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("support_tickets")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setTickets((data || []) as UserTicket[]);
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
        toast.error("Failed to load tickets");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
    fetchHistory();
  }, [user, fetchHistory]);

  // Fetch responses when a ticket is selected
  useEffect(() => {
    if (!selectedTicket) {
      setTicketResponses([]);
      return;
    }

    const fetchResponses = async () => {
      setIsLoadingResponses(true);
      try {
        const { data, error } = await supabase
          .from("support_ticket_responses")
          .select("id, content, is_internal, created_at, source, attachments, user_id")
          .eq("ticket_id", selectedTicket.id)
          .eq("is_internal", false)
          .order("created_at", { ascending: true });

        if (error) throw error;

        setTicketResponses((data || []).map(r => ({
          ...r,
          attachments: (r.attachments as unknown as Attachment[]) || [],
          admin_profile: r.source === 'admin' && !r.user_id ? { display_name: 'Support Team' } : null,
        })));
      } catch (err) {
        console.error("Failed to fetch responses:", err);
      } finally {
        setIsLoadingResponses(false);
      }
    };

    fetchResponses();
  }, [selectedTicket]);

  // Scroll to bottom when responses change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticketResponses]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    const newAttachments: Attachment[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error } = await supabase.storage
          .from('support-attachments')
          .upload(fileName, file);

        if (error) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('support-attachments')
          .getPublicUrl(fileName);

        newAttachments.push({
          name: file.name,
          url: publicUrl,
          type: file.type,
        });
      }

      setAttachments(prev => [...prev, ...newAttachments]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !user || (!replyContent.trim() && attachments.length === 0)) return;

    setIsSendingReply(true);
    try {
      const insertData = {
        ticket_id: selectedTicket.id,
        user_id: user.id,
        content: replyContent.trim() || "(attachment)",
        source: 'user' as const,
        is_internal: false,
        attachments: attachments.length > 0 ? JSON.parse(JSON.stringify(attachments)) : null,
      };

      const { error } = await supabase
        .from("support_ticket_responses")
        .insert([insertData]);

      if (error) throw error;

      // Update ticket status if resolved/closed
      if (selectedTicket.status === "resolved" || selectedTicket.status === "closed") {
        await supabase
          .from("support_tickets")
          .update({ status: "open", updated_at: new Date().toISOString() })
          .eq("id", selectedTicket.id);
        
        setSelectedTicket(prev => prev ? { ...prev, status: "open" } : null);
        setTickets(prev => prev.map(t => 
          t.id === selectedTicket.id ? { ...t, status: "open" } : t
        ));
      }

      // Add to local responses
      setTicketResponses(prev => [...prev, {
        id: crypto.randomUUID(),
        content: replyContent.trim() || "(attachment)",
        is_internal: false,
        created_at: new Date().toISOString(),
        source: 'user',
        user_id: user.id,
        attachments,
      }]);

      setReplyContent("");
      setAttachments([]);
      toast.success("Reply sent!");
    } catch (err) {
      console.error("Failed to send reply:", err);
      toast.error("Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedTicket || rating === 0) return;

    setIsSubmittingRating(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          user_rating: rating,
          user_feedback: ratingFeedback || null,
          closed_by_user: true,
          user_closed_at: new Date().toISOString(),
          status: "closed",
        })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      setSelectedTicket(prev => prev ? { 
        ...prev, 
        status: "closed", 
        user_rating: rating, 
        user_feedback: ratingFeedback,
        closed_by_user: true,
      } : null);
      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id ? { ...t, status: "closed", user_rating: rating } : t
      ));

      setShowRatingDialog(false);
      setRating(0);
      setRatingFeedback("");
      toast.success("Thank you for your feedback!");
    } catch (err) {
      console.error("Failed to submit rating:", err);
      toast.error("Failed to submit rating");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleAcceptResolution = async () => {
    if (!selectedTicket) return;
    setShowRatingDialog(true);
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setSearchParams({});
    setAttachments([]);
  };

  const openChatWidget = () => {
    setSupportChatOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Help & Feedback</h1>
          <p className="text-muted-foreground mt-1">
            View your tickets and conversations
          </p>
        </div>
        <Button onClick={openChatWidget}>
          <MessageSquare className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {selectedTicket ? (
        // Ticket Detail View
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Button variant="ghost" size="sm" onClick={handleBackToList} className="mb-2 -ml-2">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to tickets
                </Button>
                <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline">{CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}</Badge>
                  <Badge className={STATUS_COLORS[selectedTicket.status]}>
                    {STATUS_LABELS[selectedTicket.status]}
                  </Badge>
                  {selectedTicket.user_rating && (
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {selectedTicket.user_rating}/5
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {selectedTicket.status === "resolved" && !selectedTicket.user_rating && (
                <Button onClick={handleAcceptResolution} className="shrink-0">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept & Rate
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Original Description */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">You</Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(selectedTicket.created_at), "MMM d 'at' h:mm a")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>

            {/* Responses */}
            {isLoadingResponses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : ticketResponses.length > 0 ? (
              <ScrollArea className="max-h-[400px]" ref={scrollRef}>
                <div className="space-y-3">
                  {ticketResponses.map((response) => (
                    <div 
                      key={response.id} 
                      className={`p-4 rounded-lg ${
                        response.user_id ? "bg-muted" : "bg-primary/5 border border-primary/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={response.user_id ? "secondary" : "outline"} 
                          className={response.user_id ? "text-xs" : "text-xs border-primary/30 text-primary"}
                        >
                          {response.user_id ? "You" : "Support Team"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(response.created_at), "MMM d 'at' h:mm a")}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-primary [&_a]:underline">
                        <ReactMarkdown>{response.content}</ReactMarkdown>
                      </div>
                      {/* Attachments */}
                      {response.attachments && response.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {response.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-background rounded border text-xs hover:bg-muted transition-colors"
                            >
                              {att.type.startsWith('image/') ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                              <span className="truncate max-w-[150px]">{att.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Our team is reviewing your request. We'll respond as soon as possible.
                </AlertDescription>
              </Alert>
            )}

            {/* Resolved Notice */}
            {selectedTicket.status === "resolved" && !selectedTicket.user_rating && (
              <Alert className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  This ticket has been marked as resolved. Please accept and rate the resolution, or reply if you need further help.
                </AlertDescription>
              </Alert>
            )}

            {/* Reply Section */}
            {selectedTicket.status !== "closed" && (
              <div className="space-y-3 pt-4 border-t">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                />
                
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-xs">
                        {att.type.startsWith('image/') ? (
                          <ImageIcon className="h-3 w-3" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}
                        <span className="truncate max-w-[100px]">{att.name}</span>
                        <button onClick={() => removeAttachment(i)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      {isUploading ? "Uploading..." : "Attach"}
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSendReply} 
                    disabled={(!replyContent.trim() && attachments.length === 0) || isSendingReply}
                  >
                    {isSendingReply ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Reply
                  </Button>
                </div>
              </div>
            )}

            {selectedTicket.status === "closed" && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This ticket has been closed
                  {selectedTicket.user_rating && ` with a rating of ${selectedTicket.user_rating}/5`}.
                  {" "}Need more help? Start a new conversation.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        // Tabs View
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              Tickets
              {tickets.filter(t => t.status !== "closed").length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tickets.filter(t => t.status !== "closed").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="mt-4">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Ticket className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-center">
                    No support tickets yet
                  </p>
                  <Button variant="outline" onClick={openChatWidget} className="mt-4">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start a conversation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <Card 
                    key={ticket.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setSearchParams({ ticket: ticket.id });
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${STATUS_COLORS[ticket.status]} text-xs`}>
                              {STATUS_LABELS[ticket.status]}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {CATEGORY_LABELS[ticket.category] || ticket.category}
                            </Badge>
                            {ticket.status === "resolved" && !ticket.user_rating && (
                              <Badge variant="outline" className="text-xs border-green-500/30 text-green-600">
                                Needs your review
                              </Badge>
                            )}
                            {ticket.user_rating && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {ticket.user_rating}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {ticket.description}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right shrink-0">
                          <div>{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="conversations" className="mt-4">
            {conversationHistory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-center">
                    No conversations yet
                  </p>
                  <Button variant="outline" onClick={openChatWidget} className="mt-4">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start a conversation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {conversationHistory.map((conv) => (
                  <Card 
                    key={conv.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      loadConversation(conv.id);
                      setSupportChatOpen(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {CATEGORY_LABELS[conv.category] || conv.category}
                            </Badge>
                            {conv.status === "closed" && (
                              <Badge variant="secondary" className="text-xs">Closed</Badge>
                            )}
                          </div>
                          <p className="text-sm truncate">{conv.preview}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {conv.message_count} messages
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right shrink-0">
                          <div>{formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Rating Dialog */}
      <Sheet open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Rate your support experience</SheetTitle>
            <SheetDescription>
              How would you rate the resolution of your support request?
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Additional feedback (optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Tell us about your experience..."
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRating} disabled={rating === 0 || isSubmittingRating}>
              {isSubmittingRating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Rating
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <SupportChatWidget open={supportChatOpen} onOpenChange={setSupportChatOpen} />
    </div>
  );
}

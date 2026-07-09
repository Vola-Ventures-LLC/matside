import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, RotateCcw, HelpCircle, Bug, Lightbulb, Heart, CreditCard, MoreHorizontal, History, ChevronLeft, Paperclip, X, Image as ImageIcon, FileText, Star } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupportChat, SupportCategory, ChatMessage, ConversationSummary } from "@/hooks/useSupportChat";
import { useAuth } from "@/hooks/useAuth";
import { FeedbackButtons } from "./FeedbackButtons";
import { ConversationRating } from "./ConversationRating";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SupportChatWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Attachment {
  name: string;
  url: string;
  type: string;
}

const CATEGORIES: { id: SupportCategory; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "how_to", label: "How do I...?", icon: <HelpCircle className="h-4 w-4" />, description: "Learn how to use features" },
  { id: "bug", label: "Report a Bug", icon: <Bug className="h-4 w-4" />, description: "Something isn't working" },
  { id: "feature_request", label: "Feature Request", icon: <Lightbulb className="h-4 w-4" />, description: "Suggest an improvement" },
  { id: "positive_feedback", label: "Positive Feedback", icon: <Heart className="h-4 w-4" />, description: "Share what you love" },
  { id: "billing", label: "Billing", icon: <CreditCard className="h-4 w-4" />, description: "Payment & subscription" },
  { id: "other", label: "Other", icon: <MoreHorizontal className="h-4 w-4" />, description: "Something else" },
];

const CATEGORY_LABELS: Record<string, string> = {
  how_to: "How do I...?",
  bug: "Bug Report",
  feature_request: "Feature Request",
  positive_feedback: "Positive Feedback",
  billing: "Billing",
  other: "Other",
};

export function SupportChatWidget({ open, onOpenChange }: SupportChatWidgetProps) {
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    error,
    conversationId,
    conversationStatus,
    conversationRating,
    isEscalated,
    awaitingFeedback,
    conversationHistory,
    startConversation,
    sendMessage,
    sendFeedback,
    rateConversation,
    resetChat,
    fetchHistory,
    loadConversation,
  } = useSupportChat();

  const [inputValue, setInputValue] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<SupportCategory | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch history immediately when user is available (not just when widget opens)
  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, fetchHistory]);

  // Re-fetch history when opening the widget
  useEffect(() => {
    if (open && user && !conversationId) {
      fetchHistory();
    }
  }, [open, user, conversationId, fetchHistory]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, awaitingFeedback]);

  // Focus input when conversation starts
  useEffect(() => {
    if (conversationId && inputRef.current && !awaitingFeedback) {
      inputRef.current.focus();
    }
  }, [conversationId, awaitingFeedback]);

  const handleCategorySelect = async (category: SupportCategory) => {
    // For non-authenticated users requesting ticket-creating categories, ask for email
    if (!user && (category === "bug" || category === "feature_request" || category === "billing")) {
      setPendingCategory(category);
      setShowEmailPrompt(true);
      return;
    }

    await startConversation(category);
  };

  const handleEmailSubmit = async () => {
    if (!pendingCategory || !guestEmail.trim()) return;
    
    await startConversation(pendingCategory, guestEmail.trim());
    setShowEmailPrompt(false);
    setPendingCategory(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: Attachment[] = [];
    const userId = user?.id || 'guest';

    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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

  const handleSend = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isLoading) return;

    let message = inputValue.trim();
    
    // If there are attachments, append them as markdown links
    if (attachments.length > 0) {
      const attachmentLinks = attachments.map(att => 
        att.type.startsWith('image/') 
          ? `![${att.name}](${att.url})`
          : `[${att.name}](${att.url})`
      ).join('\n');
      message = message ? `${message}\n\n${attachmentLinks}` : attachmentLinks;
    }

    setInputValue("");
    setAttachments([]);
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    resetChat();
    setShowEmailPrompt(false);
    setShowHistory(false);
    setPendingCategory(null);
    setGuestEmail("");
    setAttachments([]);
  };

  const handleFeedback = async (feedback: "positive" | "negative", reason?: string) => {
    await sendFeedback(feedback, reason);
  };

  const handleLoadConversation = async (convId: string) => {
    await loadConversation(convId);
    setShowHistory(false);
  };

  const isClosedConversation = conversationStatus === "closed";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {conversationId && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 -ml-1"
                  onClick={() => {
                    resetChat();
                    setShowHistory(true);
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <MessageCircle className="h-5 w-5 text-primary" />
              <SheetTitle>Help & Feedback</SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              {conversationId ? (
                <Button variant="ghost" size="sm" onClick={handleNewChat}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">New Chat</span>
                </Button>
              ) : showHistory ? (
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              ) : user ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowHistory(true)}
                  className="gap-1.5"
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                  {conversationHistory.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-0.5">
                      {conversationHistory.length}
                    </Badge>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
          <SheetDescription>
            {conversationId 
              ? isClosedConversation 
                ? "Viewing closed conversation"
                : "Chat with our support assistant" 
              : showHistory 
                ? "Select a conversation to continue"
                : "How can we help you today?"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {showHistory ? (
            // Conversation history view
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {conversationHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No previous conversations
                  </p>
                ) : (
                  conversationHistory.map((conv) => (
                    <Button
                      key={conv.id}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 px-4 text-left"
                      onClick={() => handleLoadConversation(conv.id)}
                      disabled={isLoading}
                    >
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {CATEGORY_LABELS[conv.category] || conv.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm truncate">
                          {conv.preview}
                        </p>
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{conv.message_count} messages</span>
                          <div className="flex items-center gap-1.5">
                            {conv.user_rating ? (
                              <div className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span className="text-amber-600 dark:text-amber-400">{conv.user_rating}</span>
                              </div>
                            ) : conv.status === "closed" ? (
                              <Badge variant="outline" className="text-xs h-5 px-1.5 bg-primary/10 border-primary/20 text-primary">
                                Rate
                              </Badge>
                            ) : null}
                            {conv.status === "closed" && (
                              <Badge variant="outline" className="text-xs h-5">Closed</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : !conversationId && !showEmailPrompt ? (
            // Category selection
            <div className="p-4 space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Select a category to get started:
              </p>
              <div className="grid gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    variant="outline"
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => handleCategorySelect(cat.id)}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-primary">{cat.icon}</div>
                      <div className="text-left">
                        <div className="font-medium">{cat.label}</div>
                        <div className="text-xs text-muted-foreground">{cat.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ) : showEmailPrompt ? (
            // Email prompt for guests
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                To help you better and follow up on your request, please provide your email address:
              </p>
              <Input
                type="email"
                placeholder="your@email.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setShowEmailPrompt(false);
                  setPendingCategory(null);
                }}>
                  Back
                </Button>
                <Button onClick={handleEmailSubmit} disabled={!guestEmail.trim() || isLoading}>
                  Continue
                </Button>
              </div>
            </div>
          ) : (
            // Chat interface
            <>
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={message.id}>
                      <MessageBubble message={message} />
                      {/* Show feedback buttons after the last assistant message if awaiting feedback */}
                      {message.role === "assistant" && 
                       index === messages.length - 1 && 
                       awaitingFeedback && (
                        <div className="mt-2 ml-0">
                          <FeedbackButtons 
                            onFeedback={handleFeedback} 
                            isLoading={isLoading} 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="animate-bounce delay-0">•</span>
                        <span className="animate-bounce delay-100">•</span>
                        <span className="animate-bounce delay-200">•</span>
                      </div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {error && (
                <Alert variant="destructive" className="mx-4 mb-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isEscalated && (
                <div className="mx-4 mb-2">
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    Routed to support team
                  </Badge>
                </div>
              )}

              {isClosedConversation && (
                <div className="mx-4 mb-2 space-y-2">
                  <Badge variant="secondary">
                    Conversation closed
                  </Badge>
                  <ConversationRating
                    currentRating={conversationRating}
                    onRate={rateConversation}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {!isClosedConversation && (
                <div className="p-4 border-t space-y-2">
                  {/* Attachments preview */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                          {att.type.startsWith('image/') ? (
                            <ImageIcon className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          <span className="truncate max-w-[80px]">{att.name}</span>
                          <button onClick={() => removeAttachment(i)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
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
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="shrink-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      ref={inputRef}
                      placeholder={awaitingFeedback ? "Or type a follow-up question..." : "Type your message..."}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                    />
                    <Button onClick={handleSend} disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert" : "dark:prose-invert"} [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-md [&_img]:my-2`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <div className={`text-xs mt-1 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

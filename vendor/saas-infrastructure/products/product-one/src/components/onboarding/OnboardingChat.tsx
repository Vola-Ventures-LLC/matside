import { useState, useRef, useEffect } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  X,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  Minimize2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { OnboardingProgress } from "./OnboardingProgress";
import { NavigationCTAButton } from "./NavigationCTAButton";

interface OnboardingChatProps {
  onClose: () => void;
  onComplete?: () => void;
}

export function OnboardingChat({ onClose, onComplete }: OnboardingChatProps) {
  const {
    messages,
    summary,
    isConversationLoading,
    isComplete,
    sendMessage,
    startConversation,
    conversation,
  } = useOnboarding();

  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start conversation if none exists
  useEffect(() => {
    if (!conversation && !isConversationLoading) {
      startConversation();
    }
  }, [conversation, isConversationLoading, startConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  // Notify when complete
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  const handleSend = async () => {
    if (!input.trim() || isConversationLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <Card
        className="fixed bottom-4 right-4 w-80 cursor-pointer shadow-lg hover:shadow-xl transition-shadow z-50"
        onClick={() => setIsMinimized(false)}
      >
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Setup Assistant</CardTitle>
            </div>
            {summary && (
              <span className="text-xs text-muted-foreground">
                {summary.completed_steps}/{summary.total_steps}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Setup Assistant</CardTitle>
              {summary && (
                <div className="mt-1">
                  <OnboardingProgress
                    completed={summary.completed_steps}
                    total={summary.total_steps}
                    size="sm"
                    showLabel={false}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={cn(
                    "flex gap-3",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        message.role === "assistant"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <Sparkles className="h-4 w-4" />
                      ) : (
                        "You"
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-[80%]",
                      message.role === "assistant"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    {message.step_completed && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                        <CheckCircle2 className="h-3 w-3" />
                        Step completed!
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation CTA Button */}
                {message.role === "assistant" && message.navigation_cta?.enabled && (
                  <div className="ml-11">
                    <NavigationCTAButton
                      cta={message.navigation_cta}
                      stepKey={message.current_step_key || ""}
                      onNavigate={onClose}
                    />
                  </div>
                )}
              </div>
            ))}

            {isConversationLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-3 py-2 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t p-3">
        <div className="flex w-full gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response..."
            disabled={isConversationLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isConversationLoading}
            size="icon"
          >
            {isConversationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

# @saas-infra/support

Support system with AI chat, ticketing, sentiment analysis, and satisfaction tracking.

## Features

- **AI Support Chat** — GPT-powered support conversations with context
- **Ticket Management** — Create and manage support tickets
- **Sentiment Analysis** — Automatic sentiment detection (positive/neutral/negative)
- **Urgency Classification** — Auto-classify urgency (low/medium/high)
- **Satisfaction Metrics** — Track NPS, satisfaction rate, response rate
- **Ticket Collaboration** — Internal notes, Slack notifications
- **Dependency Injection** — Uses `useSupabase()` from @saas-infra/auth

## Installation

```bash
pnpm add @saas-infra/support @saas-infra/auth
```

## Usage

### Support Chat Hook

AI-powered support chat with conversation management:

```tsx
import { useSupportChat } from "@saas-infra/support";
import type { SupportCategory } from "@saas-infra/support";

function SupportChatWidget() {
  const {
    messages,
    isLoading,
    startConversation,
    sendMessage,
    sendFeedback,
    resetChat,
  } = useSupportChat();

  const handleStart = () => {
    startConversation("how_to"); // Category: how_to, bug, feature_request, etc.
  };

  const handleSend = (text: string) => {
    sendMessage(text);
  };

  return (
    <div>
      {messages.length === 0 ? (
        <button onClick={handleStart}>Start Chat</button>
      ) : (
        <div>
          <ChatMessages messages={messages} />
          <ChatInput onSend={handleSend} disabled={isLoading} />

          {messages[messages.length - 1]?.asksFeedback && (
            <div>
              <p>Was this helpful?</p>
              <button onClick={() => sendFeedback("positive")}>Yes</button>
              <button onClick={() => sendFeedback("negative", "Not clear")}>No</button>
            </div>
          )}

          <button onClick={resetChat}>End Chat</button>
        </div>
      )}
    </div>
  );
}
```

**Categories:**
- `how_to` — How-to questions
- `bug` — Bug reports
- `feature_request` — Feature requests
- `positive_feedback` — Positive feedback
- `billing` — Billing inquiries
- `other` — General support

### Support Satisfaction Metrics

Track support performance:

```tsx
import { useSupportSatisfactionMetrics } from "@saas-infra/support";
import { subDays } from "date-fns";

function SupportAnalytics() {
  const dateRange = {
    from: subDays(new Date(), 30),
    to: new Date(),
  };

  const { data, isLoading } = useSupportSatisfactionMetrics(dateRange);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        label="Avg Rating"
        value={data.avgRating}
        change={data.avgRatingChange}
      />
      <StatCard
        label="Satisfaction Rate"
        value={`${data.satisfactionRate}%`}
      />
      <StatCard
        label="Response Rate"
        value={`${data.responseRate}%`}
      />
      <StatCard
        label="NPS"
        value={data.nps}
      />

      <RatingDistribution data={data.distribution} />
      <RecentFeedback feedback={data.recentFeedback} />
      <RatingsTrend trend={data.ratingsTrend} />
    </div>
  );
}
```

**Metrics Returned:**
- `totalRated` — Number of rated conversations
- `avgRating` — Average rating (1-5 scale)
- `avgRatingChange` — % change from previous period
- `satisfactionRate` — % of 4-5 star ratings
- `responseRate` — % of conversations that got rated
- `nps` — Net Promoter Score
- `distribution` — Rating distribution (1-5)
- `recentFeedback` — Last 10 feedback comments
- `ratingsTrend` — Daily average ratings

### Ticket Collaboration Hook

Manage tickets with internal notes and Slack notifications:

```tsx
import { useTicketCollaboration } from "@saas-infra/support";

function TicketDetail({ ticketId }: { ticketId: string }) {
  const {
    ticket,
    notes,
    collaborators,
    addNote,
    notifySlack,
    assignTicket,
  } = useTicketCollaboration(ticketId, {
    onSuccess: (title, desc) => toast.success(title, { description: desc }),
  });

  const handleAddNote = async (content: string) => {
    await addNote({
      content,
      is_internal: true,
    });
  };

  const handleNotifySlack = async () => {
    await notifySlack({
      channel: "#support",
      message: `New ticket: ${ticket?.title}`,
      ticket_url: `https://app.example.com/tickets/${ticketId}`,
    });
  };

  return (
    <div>
      <h2>{ticket?.title}</h2>

      <section>
        <h3>Internal Notes</h3>
        {notes.map(note => (
          <div key={note.id}>
            <p>{note.content}</p>
            <span>— {note.created_by_name}</span>
          </div>
        ))}

        <NoteInput onSubmit={handleAddNote} />
      </section>

      <section>
        <h3>Collaborators</h3>
        {collaborators.map(c => (
          <div key={c.user_id}>{c.user_name}</div>
        ))}
      </section>

      <button onClick={handleNotifySlack}>
        Notify Slack
      </button>
    </div>
  );
}
```

## API Reference

### `useSupportChat(options?)`

**Options:**
```tsx
interface UseSupportChatOptions {
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}
```

**Returns:**
```tsx
{
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  conversationStatus: string | null;
  conversationRating: number | null;
  isEscalated: boolean;
  awaitingFeedback: boolean;
  conversationHistory: ConversationSummary[];
  startConversation: (category: SupportCategory, guestEmail?: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  sendFeedback: (feedback: "positive" | "negative", reason?: string) => Promise<void>;
  rateConversation: (rating: number, feedback?: string) => Promise<void>;
  endConversation: () => Promise<void>;
  resetChat: () => void;
  fetchHistory: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
}
```

**ChatMessage:**
```tsx
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  guideLinks?: string[];
  asksFeedback?: boolean;
}
```

### `useSupportSatisfactionMetrics(dateRange)`

React Query hook that returns:

```tsx
{
  data: {
    totalRated: number;
    avgRating: number;
    avgRatingChange: number;
    satisfactionRate: number;
    responseRate: number;
    nps: number;
    distribution: Array<{ rating: number; count: number }>;
    recentFeedback: Array<{ id: string; rating: number; feedback: string; ratedAt: string }>;
    ratingsTrend: Array<{ date: string; avgRating: number; count: number }>;
    closedConversations: number;
  };
  isLoading: boolean;
  error: Error | null;
}
```

### `useTicketCollaboration(ticketId, options?)`

**Options:**
```tsx
interface UseTicketCollaborationOptions {
  onSuccess?: (title: string, description: string) => void;
  onError?: (title: string, description: string) => void;
}
```

**Returns:**
```tsx
{
  ticket: SupportTicket | null;
  notes: InternalNote[];
  collaborators: Collaborator[];
  teamMembers: TeamMember[];
  isLoading: boolean;
  addNote: (data: { content: string; is_internal: boolean }) => Promise<void>;
  notifySlack: (payload: SlackNotificationPayload) => Promise<void>;
  assignTicket: (userId: string) => Promise<void>;
  mentionUser: (userId: string, message: string) => Promise<void>;
}
```

## Database Schema

Required tables (see `templates/schemas/03_support.sql`):

- `support_conversations` — Chat conversations
- `support_messages` — Chat messages
- `support_tickets` — Support tickets
- `support_ticket_responses` — Ticket responses
- `support_internal_notes` — Internal notes on tickets
- `support_collaborators` — Team members working on tickets
- `conversation_insights` — Analytics data

## Edge Functions

Required Supabase edge functions:

- `support-chat` — AI chat handler (GPT integration)
- `inbound-email` — Email-to-ticket conversion

## Examples

### Full Support Chat Widget

```tsx
import { useSupportChat } from "@saas-infra/support";
import { useState } from "react";

function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    messages,
    isLoading,
    startConversation,
    sendMessage,
    sendFeedback,
    rateConversation,
    resetChat,
  } = useSupportChat();

  const categories: Array<{ value: SupportCategory; label: string }> = [
    { value: "how_to", label: "How do I..." },
    { value: "bug", label: "Something's broken" },
    { value: "feature_request", label: "Feature request" },
    { value: "billing", label: "Billing question" },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)}>
          Need Help?
        </button>
      ) : (
        <div className="w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3>Support Chat</h3>
            <button onClick={() => { resetChat(); setIsOpen(false); }}>×</button>
          </div>

          {messages.length === 0 ? (
            <div className="p-4">
              <p>What can we help you with?</p>
              <div className="space-y-2 mt-4">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => startConversation(cat.value)}
                    className="w-full text-left p-3 border rounded hover:bg-gray-50"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={msg.role === "user" ? "text-right" : "text-left"}
                  >
                    <div className={`inline-block p-3 rounded-lg ${
                      msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100"
                    }`}>
                      {msg.content}
                    </div>

                    {msg.asksFeedback && (
                      <div className="mt-2">
                        <button onClick={() => sendFeedback("positive")}>
                          👍 Helpful
                        </button>
                        <button onClick={() => sendFeedback("negative")}>
                          👎 Not helpful
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                <input
                  type="text"
                  placeholder="Type your message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      sendMessage(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  disabled={isLoading}
                  className="w-full p-2 border rounded"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

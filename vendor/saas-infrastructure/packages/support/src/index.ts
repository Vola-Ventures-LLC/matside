// Hooks
export { useSupportChat } from "./hooks/useSupportChat";
export type {
  SupportCategory,
  ChatMessage,
  ConversationSummary,
  UseSupportChatOptions,
} from "./hooks/useSupportChat";

export { useSupportSatisfactionMetrics } from "./hooks/useSupportAnalytics";
export type { DateRange } from "./hooks/useSupportAnalytics";

export { useTicketCollaboration } from "./hooks/useTicketCollaboration";
export type {
  SlackNotificationPayload,
  InternalNote,
  Collaborator,
  TeamMember,
  UseTicketCollaborationOptions,
} from "./hooks/useTicketCollaboration";

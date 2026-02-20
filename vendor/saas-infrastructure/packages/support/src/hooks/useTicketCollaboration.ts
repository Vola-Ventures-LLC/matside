import { useState, useCallback, useEffect } from "react";
import { useSupabase } from "@saas-infra/auth/provider";
import { useAuth } from "@saas-infra/auth";

export interface SlackNotificationPayload {
  type: "ticket_assigned" | "ticket_mentioned" | "ticket_escalated" | "ticket_resolved";
  ticketId: string;
  ticketSubject?: string;
  recipientEmail?: string;
  recipientUserId?: string;
  assignerName?: string;
  mentionerName?: string;
  noteContent?: string;
  channel?: string;
}

export interface InternalNote {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string | null;
    email: string | null;
  };
}

export interface Collaborator {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "assigned" | "mentioned";
  added_at: string;
  added_by: string | null;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

export interface TeamMember {
  user_id: string;
  display_name: string | null;
  email: string | null;
}

export interface UseTicketCollaborationOptions {
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}

export function useTicketCollaboration(
  ticketId: string | undefined,
  options?: UseTicketCollaborationOptions,
) {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignee, setAssignee] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fire-and-forget Slack notification (non-blocking)
  const sendSlackNotification = useCallback(async (payload: SlackNotificationPayload): Promise<void> => {
    try {
      const response = await supabase.functions.invoke("send-slack-notification", {
        body: payload,
      });

      if (response.error) {
        console.log("Slack notification skipped or failed:", response.error);
      } else if (response.data?.skipped) {
        console.log("Slack not configured - notification skipped");
      } else {
        console.log("Slack notification sent");
      }
    } catch (err) {
      console.log("Slack notification error (non-blocking):", err);
    }
  }, [supabase]);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "owner"]);

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map((r) => r.user_id);
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", userIds);

        if (profileError) throw profileError;
        setTeamMembers(profiles || []);
      }
    } catch (err) {
      console.error("Failed to fetch team members:", err);
    }
  }, [supabase]);

  const fetchInternalNotes = useCallback(async () => {
    if (!ticketId) return;

    try {
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .select("conversation_id")
        .eq("id", ticketId)
        .single();

      if (ticketError || !ticket?.conversation_id) return;

      const { data, error } = await supabase
        .from("support_internal_notes")
        .select("*")
        .eq("conversation_id", ticket.conversation_id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const authorIds = [...new Set(data.map((n) => n.author_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", authorIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
        const notesWithAuthors = data.map((note) => ({
          ...note,
          author: profileMap.get(note.author_id) || null,
        }));
        setInternalNotes(notesWithAuthors as InternalNote[]);
      } else {
        setInternalNotes([]);
      }
    } catch (err) {
      console.error("Failed to fetch internal notes:", err);
    }
  }, [ticketId, supabase]);

  const fetchCollaborators = useCallback(async () => {
    if (!ticketId) return;

    try {
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .select("conversation_id, assigned_to")
        .eq("id", ticketId)
        .single();

      if (ticketError) throw ticketError;

      setAssignee(ticket?.assigned_to || null);

      if (!ticket?.conversation_id) return;

      const { data, error } = await supabase
        .from("support_collaborators")
        .select("*")
        .eq("conversation_id", ticket.conversation_id)
        .order("added_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((c) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
        const collabsWithProfiles = data.map((collab) => ({
          ...collab,
          profile: profileMap.get(collab.user_id) || null,
        }));
        setCollaborators(collabsWithProfiles as Collaborator[]);
      } else {
        setCollaborators([]);
      }
    } catch (err) {
      console.error("Failed to fetch collaborators:", err);
    }
  }, [ticketId, supabase]);

  const assignTicket = useCallback(
    async (assigneeId: string | null) => {
      if (!ticketId || !user) return;

      setIsAssigning(true);
      try {
        const { data: ticket, error: ticketError } = await supabase
          .from("support_tickets")
          .select("conversation_id, subject")
          .eq("id", ticketId)
          .single();

        if (ticketError) throw ticketError;

        if (ticket?.conversation_id) {
          const { error } = await supabase.rpc("assign_support_ticket", {
            p_conversation_id: ticket.conversation_id,
            p_assignee_id: assigneeId,
            p_assigner_id: user.id,
          });

          if (error) throw error;

          await supabase
            .from("support_tickets")
            .update({ assigned_to: assigneeId })
            .eq("id", ticketId);

          setAssignee(assigneeId);
          await fetchCollaborators();

          const assigneeName = teamMembers.find(
            (m) => m.user_id === assigneeId
          )?.display_name;

          if (assigneeId) {
            options?.onSuccess?.("Ticket assigned", `Ticket assigned to ${assigneeName || "team member"}`);

            const assigneeEmail = teamMembers.find(
              (m) => m.user_id === assigneeId
            )?.email;

            const assignerProfile = teamMembers.find(
              (m) => m.user_id === user.id
            );

            sendSlackNotification({
              type: "ticket_assigned",
              ticketId,
              ticketSubject: ticket.subject || undefined,
              recipientEmail: assigneeEmail || undefined,
              recipientUserId: assigneeId,
              assignerName: assignerProfile?.display_name || assignerProfile?.email || "A team member",
            });
          } else {
            options?.onSuccess?.("Ticket unassigned", "Ticket has been unassigned");
          }
        }
      } catch (err) {
        console.error("Failed to assign ticket:", err);
        options?.onError?.("Assignment failed", "Failed to assign ticket");
      } finally {
        setIsAssigning(false);
      }
    },
    [ticketId, user, fetchCollaborators, teamMembers, supabase, options, sendSlackNotification]
  );

  const addInternalNote = useCallback(
    async (content: string, mentions: string[] = []) => {
      if (!ticketId || !user || !content.trim()) return;

      setIsAddingNote(true);
      try {
        const { data: ticket, error: ticketError } = await supabase
          .from("support_tickets")
          .select("conversation_id, subject")
          .eq("id", ticketId)
          .single();

        if (ticketError) throw ticketError;

        if (ticket?.conversation_id) {
          const { error } = await supabase.rpc("add_support_internal_note", {
            p_conversation_id: ticket.conversation_id,
            p_author_id: user.id,
            p_content: content.trim(),
            p_mentions: mentions,
          });

          if (error) throw error;

          await fetchInternalNotes();
          await fetchCollaborators();
          options?.onSuccess?.("Note added", "Internal note added");

          if (mentions.length > 0) {
            const mentionerProfile = teamMembers.find(
              (m) => m.user_id === user.id
            );
            const mentionerName = mentionerProfile?.display_name || mentionerProfile?.email || "A team member";

            for (const mentionedUserId of mentions) {
              const mentionedUser = teamMembers.find(
                (m) => m.user_id === mentionedUserId
              );

              if (mentionedUser) {
                sendSlackNotification({
                  type: "ticket_mentioned",
                  ticketId,
                  ticketSubject: ticket.subject || undefined,
                  recipientEmail: mentionedUser.email || undefined,
                  recipientUserId: mentionedUserId,
                  mentionerName,
                  noteContent: content.trim().substring(0, 200),
                });
              }
            }
          }

          return true;
        }
        return false;
      } catch (err) {
        console.error("Failed to add internal note:", err);
        options?.onError?.("Note failed", "Failed to add internal note");
        return false;
      } finally {
        setIsAddingNote(false);
      }
    },
    [ticketId, user, fetchInternalNotes, fetchCollaborators, teamMembers, supabase, options, sendSlackNotification]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      try {
        const { error } = await supabase
          .from("support_internal_notes")
          .delete()
          .eq("id", noteId);

        if (error) throw error;

        setInternalNotes((prev) => prev.filter((n) => n.id !== noteId));
        options?.onSuccess?.("Note deleted", "Note deleted");
      } catch (err) {
        console.error("Failed to delete note:", err);
        options?.onError?.("Delete failed", "Failed to delete note");
      }
    },
    [supabase, options]
  );

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

  // Initial fetch
  useEffect(() => {
    if (ticketId) {
      setIsLoading(true);
      Promise.all([
        fetchTeamMembers(),
        fetchInternalNotes(),
        fetchCollaborators(),
      ]).finally(() => setIsLoading(false));
    }
  }, [ticketId, fetchTeamMembers, fetchInternalNotes, fetchCollaborators]);

  return {
    internalNotes,
    collaborators,
    teamMembers,
    assignee,
    isLoading,
    isAssigning,
    isAddingNote,
    assignTicket,
    addInternalNote,
    deleteNote,
    parseMentions,
    refetch: () => {
      fetchInternalNotes();
      fetchCollaborators();
    },
  };
}

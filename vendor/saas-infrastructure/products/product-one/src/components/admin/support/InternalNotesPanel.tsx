import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Send, Trash2, AtSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { InternalNote, TeamMember } from "@/hooks/useTicketCollaboration";

interface InternalNotesPanelProps {
  notes: InternalNote[];
  teamMembers: TeamMember[];
  isAddingNote: boolean;
  onAddNote: (content: string, mentions: string[]) => Promise<boolean | undefined>;
  onDeleteNote: (noteId: string) => void;
  parseMentions: (content: string) => string[];
}

export function InternalNotesPanel({
  notes,
  teamMembers,
  isAddingNote,
  onAddNote,
  onDeleteNote,
  parseMentions,
}: InternalNotesPanelProps) {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter team members based on search
  const filteredMembers = teamMembers.filter((member) => {
    const search = mentionSearch.toLowerCase();
    return (
      member.display_name?.toLowerCase().includes(search) ||
      member.email?.toLowerCase().includes(search)
    );
  });

  // Handle textarea changes and detect @ mentions
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewNote(value);
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
    const textBeforeCursor = newNote.substring(0, cursorPosition);
    const textAfterCursor = newNote.substring(cursorPosition);
    
    // Find the @ position
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      const beforeAt = textBeforeCursor.substring(0, textBeforeCursor.length - atMatch[0].length);
      const mentionText = `@${member.display_name || member.email?.split("@")[0]} `;
      setNewNote(beforeAt + mentionText + textAfterCursor);
      
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

  // Handle sending note
  const handleSendNote = async () => {
    if (!newNote.trim()) return;
    
    const mentions = parseMentions(newNote);
    const success = await onAddNote(newNote, mentions);
    if (success) {
      setNewNote("");
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendNote();
    }
    if (e.key === "Escape") {
      setShowMentions(false);
    }
  };

  // Render content with highlighted mentions
  const renderNoteContent = (content: string) => {
    // eslint-disable-next-line security/detect-unsafe-regex
    const parts = content.split(/(@\w+(?:\s+\w+)?)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AtSign className="h-4 w-4" />
          Team Notes
          {notes.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {notes.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notes list */}
        {notes.length > 0 ? (
          <ScrollArea className="h-[200px] pr-2">
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-lg bg-muted/50 border border-border/50 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {note.author?.display_name || "Team Member"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), "MMM d, h:mm a")}
                      </span>
                      {note.author_id === user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {renderNoteContent(note.content)}
                  </p>
                  {note.mentions.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {note.mentions.map((mentionId) => {
                        const member = teamMembers.find(
                          (m) => m.user_id === mentionId
                        );
                        return member ? (
                          <Badge key={mentionId} variant="outline" className="text-xs">
                            {member.display_name || member.email?.split("@")[0]}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No team notes yet
          </p>
        )}

        {/* Add note input */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="Add a team note... Use @ to mention"
            value={newNote}
            onChange={handleNoteChange}
            onKeyDown={handleKeyDown}
            rows={2}
            className="pr-12 resize-none"
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8"
            onClick={handleSendNote}
            disabled={!newNote.trim() || isAddingNote}
          >
            <Send className="h-4 w-4" />
          </Button>

          {/* Mention autocomplete popover */}
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full mb-1 left-0 w-64 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-auto">
              {filteredMembers.map((member) => (
                <button
                  key={member.user_id}
                  className="w-full px-3 py-2 text-left hover:bg-muted flex flex-col"
                  onClick={() => insertMention(member)}
                >
                  <span className="text-sm font-medium">
                    {member.display_name || "Team Member"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Press Ctrl+Enter to send. Notes are only visible to team members.
        </p>
      </CardContent>
    </Card>
  );
}

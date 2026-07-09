import { UserPlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { TeamMember, Collaborator } from "@/hooks/useTicketCollaboration";

interface TicketAssignmentProps {
  assignee: string | null;
  teamMembers: TeamMember[];
  collaborators: Collaborator[];
  isAssigning: boolean;
  onAssign: (assigneeId: string | null) => void;
}

export function TicketAssignment({
  assignee,
  teamMembers,
  collaborators,
  isAssigning,
  onAssign,
}: TicketAssignmentProps) {
  const assignedMember = teamMembers.find((m) => m.user_id === assignee);
  const mentionedCollaborators = collaborators.filter(
    (c) => c.role === "mentioned"
  );

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "??";
  };

  return (
    <div className="space-y-4">
      {/* Assignment Selector */}
      <div>
        <Label className="text-xs text-muted-foreground">Assigned To</Label>
        <div className="flex items-center gap-2 mt-1">
          <Select
            value={assignee || "unassigned"}
            onValueChange={(value) =>
              onAssign(value === "unassigned" ? null : value)
            }
            disabled={isAssigning}
          >
            <SelectTrigger className="flex-1">
              {isAssigning ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Assigning...</span>
                </div>
              ) : (
                <SelectValue placeholder="Unassigned">
                  {assignedMember ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {getInitials(
                            assignedMember.display_name,
                            assignedMember.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span>{assignedMember.display_name || assignedMember.email}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </SelectValue>
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">
                <span className="text-muted-foreground">Unassigned</span>
              </SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.display_name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{member.display_name || "Team Member"}</span>
                      {member.display_name && (
                        <span className="text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {assignee && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => onAssign(null)}
              disabled={isAssigning}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mentioned Collaborators */}
      {mentionedCollaborators.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground">
            Mentioned In Notes
          </Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {mentionedCollaborators.map((collab) => (
              <Badge
                key={collab.id}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(
                      collab.profile?.display_name || null,
                      collab.profile?.email || null
                    )}
                  </AvatarFallback>
                </Avatar>
                {collab.profile?.display_name ||
                  collab.profile?.email?.split("@")[0]}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

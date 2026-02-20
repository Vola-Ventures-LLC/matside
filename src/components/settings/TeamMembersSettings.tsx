import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTeam } from '@/contexts/TeamContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Loader2, 
  Archive,
  Crown,
  Shield,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Link
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'manager';
  status: string;
  created_at: string;
  profile?: {
    full_name: string | null;
  };
}

interface TeamInvitation {
  id: string;
  code: string;
  created_at: string;
  expires_at: string;
  max_uses: number | null;
  use_count: number | null;
}

export function TeamMembersSettings() {
  const { currentTeam, isOwner } = useTeam();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<TeamMember | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentTeam) {
      fetchData();
    }
  }, [currentTeam]);

  const fetchData = async () => {
    if (!currentTeam) return;
    setLoading(true);
    await Promise.all([fetchMembers(), fetchInvitations()]);
    setLoading(false);
  };

  const fetchMembers = async () => {
    if (!currentTeam) return;

    const { data: membersData, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', currentTeam.id)
      .eq('status', 'active')
      .order('role', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching team members:', error);
      return;
    }

    const membersWithProfiles: TeamMember[] = [];
    for (const member of membersData || []) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', member.user_id)
        .maybeSingle();

      membersWithProfiles.push({
        ...member,
        role: member.role as 'owner' | 'manager',
        profile: profileData || undefined,
      });
    }

    setMembers(membersWithProfiles);
  };

  const fetchInvitations = async () => {
    if (!currentTeam) return;

    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', currentTeam.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return;
    }

    setInvitations(data || []);
  };

  const handleCreateInvite = async () => {
    if (!currentTeam) return;

    setCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      setCreating(false);
      return;
    }

    // Create invite that expires in 7 days, single use
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: currentTeam.id,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        max_uses: 1,
      });

    if (error) {
      console.error('Error creating invitation:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create invitation.' });
    } else {
      toast({ title: 'Invite created!', description: 'Share the code or message with your new team member.' });
      fetchInvitations();
    }

    setCreating(false);
  };

  const handleDeleteInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', inviteId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete invitation.' });
    } else {
      toast({ title: 'Invitation deleted' });
      fetchInvitations();
    }
  };

  const handleArchive = async (member: TeamMember) => {
    if (!currentTeam) return;

    setArchivingId(member.id);

    const { error } = await supabase
      .from('team_members')
      .update({ 
        status: 'archived',
        archived_at: new Date().toISOString()
      })
      .eq('id', member.id);

    if (error) {
      console.error('Error archiving member:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove team member.' });
    } else {
      toast({ title: 'Member removed', description: 'Team member has been removed successfully.' });
      fetchMembers();
    }

    setArchivingId(null);
    setConfirmArchive(null);
  };

  const copyToClipboard = async (text: string, type: 'code' | 'message', code: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      } else {
        setCopiedMessage(code);
        setTimeout(() => setCopiedMessage(null), 2000);
      }
      toast({ title: 'Copied!', description: type === 'code' ? 'Invite code copied.' : 'Message copied.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to copy to clipboard.' });
    }
  };

  const getInviteMessage = (code: string) => {
    const teamName = currentTeam?.name || 'our team';
    return `You've been invited to join ${teamName} on MatSide!

To accept this invitation:
1. Go to https://matsideapp.com
2. Create an account or log in
3. Go to Account Settings
4. Enter this invite code: ${code}

The code expires in 7 days.`;
  };

  const getRoleBadge = (role: 'owner' | 'manager') => {
    if (role === 'owner') {
      return (
        <Badge variant="default" className="bg-primary hover:bg-primary/90">
          <Crown className="w-3 h-3 mr-1" />
          Owner
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Shield className="w-3 h-3 mr-1" />
        Manager
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Members
        </CardTitle>
        <CardDescription>
          Manage who has access to your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite section - only for owners */}
        {isOwner && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Invite new member</label>
              <Button onClick={handleCreateInvite} disabled={creating} size="sm">
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Generate Invite Code
                  </>
                )}
              </Button>
            </div>

            {/* Active invitations */}
            {invitations.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Active invitations</label>
                {invitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="p-3 rounded-lg border bg-muted/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link className="w-4 h-4 text-muted-foreground" />
                        <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                          {invite.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(invite.code, 'code', invite.code)}
                          className="h-7 px-2"
                        >
                          {copiedCode === invite.code ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvite(invite.id)}
                          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getInviteMessage(invite.code), 'message', invite.code)}
                      className="w-full text-xs"
                    >
                      {copiedMessage === invite.code ? (
                        <>
                          <Check className="w-3 h-3 mr-2 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-2" />
                          Copy email message
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Generate an invite code and share it with your new team member. They can redeem it from their Account Settings.
            </p>
          </div>
        )}

        {/* Members list */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Current members</label>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>No team members found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {member.profile?.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.profile?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                    {isOwner && member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmArchive(member)}
                        disabled={archivingId === member.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {archivingId === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isOwner && (
          <p className="text-sm text-muted-foreground">
            Only team owners can invite or remove members.
          </p>
        )}
      </CardContent>

      {/* Confirm archive dialog */}
      <AlertDialog open={!!confirmArchive} onOpenChange={() => setConfirmArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {confirmArchive?.profile?.full_name || 'this member'} from the team? 
              They will lose access to all team data and meets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmArchive && handleArchive(confirmArchive)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

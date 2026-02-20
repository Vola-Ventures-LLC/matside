import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserContext } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link2, Plus, Copy, Trash2, Check, Mail } from 'lucide-react';

interface Invitation {
  id: string;
  league_id: string;
  invitation_type: 'email' | 'code';
  email: string | null;
  code: string | null;
  expires_at: string;
  max_uses: number;
  use_count: number;
  created_at: string;
}

export default function LeagueInvitations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentContext } = useUserContext();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [maxUses, setMaxUses] = useState(10);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  // Get league name for the invite message
  const [leagueName, setLeagueName] = useState<string>('');

  useEffect(() => {
    if (currentContext?.type === 'league') {
      setLeagueName(currentContext.name || 'our league');
    }
  }, [currentContext]);

  useEffect(() => {
    if (currentContext?.type !== 'league') {
      navigate('/dashboard');
      return;
    }

    fetchInvitations();
  }, [currentContext, navigate]);

  const fetchInvitations = async () => {
    if (!currentContext || currentContext.type !== 'league') return;

    setLoading(true);

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('league_id', currentContext.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
    } else {
      setInvitations((data as Invitation[]) || []);
    }

    setLoading(false);
  };

  const generateCode = () => {
    // Use cryptographically secure random generation
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    // Convert to base36 and take 8 characters for a strong code
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return parseInt(hex, 16).toString(36).toUpperCase().substring(0, 8).padStart(8, '0');
  };

  const createInvitation = async () => {
    if (!currentContext || currentContext.type !== 'league' || !user) return;

    setCreating(true);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const generatedCode = generateCode();

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        league_id: currentContext.id,
        invitation_type: 'code' as const,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses,
        created_by: user.id,
        code: generatedCode,
      })
      .select()
      .single();

    if (error) {
      setCreating(false);
      toast({
        title: 'Error',
        description: 'Failed to create invitation',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Invitation Created',
      description: `Code: ${data.code}`,
    });

    setCreating(false);
    setCreateDialogOpen(false);
    fetchInvitations();
  };

  const deleteInvitation = async (id: string) => {
    const { error } = await supabase.from('invitations').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete invitation',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: 'Invitation deleted',
      });
      fetchInvitations();
    }
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
      toast({ 
        title: 'Copied!', 
        description: type === 'code' ? 'Invite code copied.' : 'Message copied to clipboard.' 
      });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to copy to clipboard.' });
    }
  };

  const getInviteMessage = (code: string, expiresAt: string) => {
    const expirationDate = new Date(expiresAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `You've been invited to join ${leagueName} on MatSide!

To accept this invitation:
1. Go to https://matsideapp.com
2. Create an account or log in
3. Go to your Team Dashboard
4. Click "Join League" in the sidebar
5. Enter this invite code: ${code}

This code expires on ${expirationDate}.`;
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const isUsedUp = (invite: Invitation) => invite.use_count >= invite.max_uses;

  if (currentContext?.type !== 'league') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl text-foreground mb-2">Invitations</h1>
            <p className="text-muted-foreground">
              Invite team managers to join your league
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create Invitation</DialogTitle>
                <DialogDescription>
                  Invite team managers to join your league
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Max Uses</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    How many teams can use this code
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Expires In (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
                    className="bg-background"
                  />
                </div>

                <Button
                  onClick={createInvitation}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? 'Creating...' : 'Create Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Invitations Table */}
        <Card className="bg-card border-border">
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Active Invitations
            </CardTitle>
            <CardDescription>
              Manage your league invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading invitations...
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8">
                <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No invitations yet</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  Create First Invitation
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Invite Message</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invite) => {
                    const expired = isExpired(invite.expires_at);
                    const usedUp = isUsedUp(invite);

                    return (
                      <TableRow key={invite.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {invite.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(invite.code!, 'code', invite.code!)}
                            >
                              {copiedCode === invite.code ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(getInviteMessage(invite.code!, invite.expires_at), 'message', invite.code!)}
                            className="text-xs"
                            disabled={expired || usedUp}
                          >
                            {copiedMessage === invite.code ? (
                              <>
                                <Check className="w-3 h-3 mr-1 text-green-500" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Mail className="w-3 h-3 mr-1" />
                                Copy Message
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {invite.use_count} / {invite.max_uses}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(invite.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {expired ? (
                            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                              Expired
                            </Badge>
                          ) : usedUp ? (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Used
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteInvitation(invite.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

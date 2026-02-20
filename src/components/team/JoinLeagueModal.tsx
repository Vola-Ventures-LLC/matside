import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTeam } from '@/contexts/TeamContext';
import { Trophy, Loader2 } from 'lucide-react';

interface JoinLeagueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function JoinLeagueModal({ open, onOpenChange, onSuccess }: JoinLeagueModalProps) {
  const { currentTeam } = useTeam();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTeam) {
      toast({
        title: 'Error',
        description: 'No team selected',
        variant: 'destructive',
      });
      return;
    }

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      toast({
        title: 'Error',
        description: 'Please enter an invite code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Use RPC function to bypass RLS and validate code
      const { data: leagueData, error: rpcError } = await supabase
        .rpc('get_league_from_invite_code', { invite_code: trimmedCode });

      if (rpcError) {
        throw rpcError;
      }

      if (!leagueData || leagueData.length === 0) {
        toast({
          title: 'Invalid Code',
          description: 'This invite code does not exist or has expired',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const league = leagueData[0];

      // Check if team is already in the league
      const { data: existingTeam, error: checkError } = await supabase
        .from('league_teams')
        .select('id, status')
        .eq('league_id', league.league_id)
        .eq('team_id', currentTeam.id)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingTeam) {
        toast({
          title: 'Already Joined',
          description: `Your team is already ${existingTeam.status} in this league`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Atomically redeem the invite code (increments use_count and validates)
      const { data: redeemedLeagueId, error: redeemError } = await supabase
        .rpc('redeem_invite_code', { invite_code: trimmedCode });

      if (redeemError) {
        throw redeemError;
      }

      if (!redeemedLeagueId) {
        toast({
          title: 'Code Exhausted',
          description: 'This invite code has reached its usage limit or expired',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Join the league
      const { error: joinError } = await supabase
        .from('league_teams')
        .insert({
          league_id: redeemedLeagueId,
          team_id: currentTeam.id,
          status: 'pending',
        });

      if (joinError) {
        throw joinError;
      }

      toast({
        title: 'Request Sent!',
        description: 'Your team has requested to join the league. The organizer will review your request.',
      });

      setCode('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error joining league:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to join league',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Join a League
          </DialogTitle>
          <DialogDescription>
            Enter the invite code provided by the league organizer to request membership for {currentTeam?.name || 'your team'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Invite Code</Label>
            <Input
              id="code"
              placeholder="Enter 6-character code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="text-center text-lg font-mono tracking-widest uppercase"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !code.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join League'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

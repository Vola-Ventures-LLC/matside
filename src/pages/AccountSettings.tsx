import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, Loader2, UserPlus } from 'lucide-react';

export default function AccountSettings() {
  const { user } = useAuth();
  const { refetchTeams } = useTeam();
  const { toast } = useToast();

  // Profile state
  const [fullName, setFullName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Email state
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Team invite code state
  const [inviteCode, setInviteCode] = useState('');
  const [redeemingCode, setRedeemingCode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    setLoadingProfile(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setFullName(data.full_name || '');
    }
    setLoadingProfile(false);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setSavingProfile(true);

    // Upsert profile (create if doesn't exist, update if does)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    setSavingProfile(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a new email address.',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid email address.',
      });
      return;
    }

    setSavingEmail(true);

    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim(),
    });

    setSavingEmail(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Confirmation Required',
        description: 'A confirmation email has been sent to your new email address. Please check your inbox.',
      });
      setNewEmail('');
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all password fields.',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password must be at least 6 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Passwords do not match.',
      });
      return;
    }

    setSavingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSavingPassword(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Success',
        description: 'Password updated successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleRedeemTeamCode = async () => {
    if (!inviteCode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter an invite code.',
      });
      return;
    }

    setRedeemingCode(true);

    // First verify the code is valid
    const { data: teamInfo, error: verifyError } = await supabase
      .rpc('get_team_from_invite_code', { invite_code: inviteCode.trim() });

    if (verifyError || !teamInfo || teamInfo.length === 0) {
      setRedeemingCode(false);
      toast({
        variant: 'destructive',
        title: 'Invalid code',
        description: 'This invite code is invalid or has expired.',
      });
      return;
    }

    // Redeem the code
    const { data: teamId, error: redeemError } = await supabase
      .rpc('redeem_team_invite_code', { invite_code: inviteCode.trim() });

    setRedeemingCode(false);

    if (redeemError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: redeemError.message || 'Failed to redeem invite code.',
      });
      return;
    }

    toast({
      title: 'Welcome to the team!',
      description: `You've joined ${teamInfo[0].team_name}. You can now access their roster and meets.`,
    });
    setInviteCode('');
    refetchTeams();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-4xl text-foreground mb-2">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal account information
          </p>
        </div>

        {/* Profile Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your display name
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={loadingProfile}
              />
            </div>
            <Button
              onClick={handleUpdateProfile}
              disabled={savingProfile || loadingProfile}
            >
              {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Email Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Address
            </CardTitle>
            <CardDescription>
              Current email: {user?.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
              />
              <p className="text-sm text-muted-foreground">
                You'll need to confirm the change via email.
              </p>
            </div>
            <Button
              onClick={handleUpdateEmail}
              disabled={savingEmail || !newEmail.trim()}
            >
              {savingEmail && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Email
            </Button>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={savingPassword || !newPassword || !confirmPassword}
            >
              {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Team Invite Code Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Join a Team
            </CardTitle>
            <CardDescription>
              Enter an invite code to join an existing team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter invite code (e.g., ABC123XY)"
                className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleRedeemTeamCode()}
              />
              <p className="text-sm text-muted-foreground">
                Ask a team owner to share their invite code with you.
              </p>
            </div>
            <Button
              onClick={handleRedeemTeamCode}
              disabled={redeemingCode || !inviteCode.trim()}
            >
              {redeemingCode && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Join Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

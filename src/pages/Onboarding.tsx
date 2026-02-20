import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '@/contexts/TeamContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Trophy, ArrowLeft, Check, X, Palette, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const colorPresets = [
  { primary: '#DC2626', secondary: '#1F2937', name: 'Red' },
  { primary: '#2563EB', secondary: '#1E3A8A', name: 'Blue' },
  { primary: '#16A34A', secondary: '#14532D', name: 'Green' },
  { primary: '#9333EA', secondary: '#581C87', name: 'Purple' },
  { primary: '#EA580C', secondary: '#7C2D12', name: 'Orange' },
  { primary: '#0891B2', secondary: '#164E63', name: 'Teal' },
];

// Generate a darker shade for secondary color
function generateSecondaryColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const darken = (v: number) => Math.max(0, Math.floor(v * 0.4));
  return `#${darken(r).toString(16).padStart(2, '0')}${darken(g).toString(16).padStart(2, '0')}${darken(b).toString(16).padStart(2, '0')}`;
}

type OnboardingStep = 'choose' | 'create-team';

interface ValidatedLeague {
  invitationId: string;
  leagueId: string;
  leagueName: string;
  leagueColor: string | null;
  useCount: number;
}

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('choose');
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#DC2626');
  const [secondaryColor, setSecondaryColor] = useState('#1F2937');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [validatedLeague, setValidatedLeague] = useState<ValidatedLeague | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  
  const { createTeam } = useTeam();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handlePrimaryColorChange = (color: string) => {
    setPrimaryColor(color);
    setSecondaryColor(generateSecondaryColor(color));
  };

  const selectPreset = (preset: typeof colorPresets[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
  };

  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setValidatedLeague(null);
      setCodeError(null);
      return;
    }

    setValidatingCode(true);
    setCodeError(null);

    // First get invitation details
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('id, use_count')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    // Use RPC function to get league info (bypasses RLS)
    const { data: leagueData, error } = await supabase
      .rpc('get_league_from_invite_code', { invite_code: code.toUpperCase() });

    if (error || !leagueData || leagueData.length === 0) {
      setValidatedLeague(null);
      setCodeError('Invalid or expired invite code');
      setValidatingCode(false);
      return;
    }

    const league = leagueData[0];
    
    setValidatedLeague({
      invitationId: invitation?.id || '',
      leagueId: league.league_id,
      leagueName: league.league_name,
      leagueColor: league.league_color,
      useCount: invitation?.use_count || 0,
    });
    setCodeError(null);
    setValidatingCode(false);
  };

  const handleCodeChange = (value: string) => {
    const code = value.toUpperCase();
    setInviteCode(code);
    
    // Debounce validation
    if (code.length >= 4) {
      validateInviteCode(code);
    } else {
      setValidatedLeague(null);
      setCodeError(null);
    }
  };

  const clearCode = () => {
    setInviteCode('');
    setValidatedLeague(null);
    setCodeError(null);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !abbreviation.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    setLoading(true);

    const team = await createTeam({
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
      logo_url: null,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    });

    if (!team) {
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create team. Please try again.',
      });
      return;
    }

    // If there's a validated league invite, atomically redeem and join
    if (validatedLeague) {
      // Atomically redeem the invite code
      const { data: redeemedLeagueId, error: redeemError } = await supabase
        .rpc('redeem_invite_code', { invite_code: inviteCode.toUpperCase() });

      if (redeemError || !redeemedLeagueId) {
        toast({
          title: 'Team created',
          description: `${team.name} was created but the invite code was already used or expired.`,
        });
        setLoading(false);
        navigate('/dashboard');
        return;
      }

      const { error: joinError } = await supabase
        .from('league_teams')
        .insert({
          team_id: team.id,
          league_id: redeemedLeagueId,
          status: 'active',
          joined_at: new Date().toISOString(),
        });

      if (!joinError) {
        toast({
          title: 'Welcome!',
          description: `${team.name} has been created and joined ${validatedLeague.leagueName}.`,
        });
      } else {
        toast({
          title: 'Team created',
          description: `${team.name} was created but couldn't join the league.`,
        });
      }
    } else {
      toast({
        title: 'Team created!',
        description: `Welcome to ${team.name}. Let's build your roster.`,
      });
    }

    setLoading(false);
    navigate('/dashboard');
  };

  const resetForm = () => {
    setName('');
    setAbbreviation('');
    setPrimaryColor('#DC2626');
    setSecondaryColor('#1F2937');
    setInviteCode('');
    setValidatedLeague(null);
    setCodeError(null);
  };

  const handleBack = () => {
    resetForm();
    setStep('choose');
  };

  // Step 1: Choose what to do
  if (step === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        
        <Card className="w-full max-w-lg relative z-10 border-border/50 bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="absolute right-4 top-4 text-muted-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
            <div className="mx-auto mb-2">
              <h1 className="font-display text-4xl text-primary tracking-wider">MATSIDE</h1>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
            <CardDescription>
              What would you like to do?
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <button
              onClick={() => setStep('create-team')}
              className="w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left flex items-start gap-4 group"
            >
              <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Create a Team</h3>
                <p className="text-sm text-muted-foreground">
                  Start managing your wrestling team's roster, meets, and matches
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate('/league/create')}
              className="w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left flex items-start gap-4 group"
            >
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Create a League</h3>
                <p className="text-sm text-muted-foreground">
                  Organize competitions for multiple teams in your area
                </p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step: Create team
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-lg relative z-10 border-border/50 bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mx-auto mb-2">
            <h1 className="font-display text-4xl text-primary tracking-wider">MATSIDE</h1>
          </div>
          <CardTitle className="text-2xl font-bold">Create Your Team</CardTitle>
          <CardDescription>
            Set up your wrestling organization to get started
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleCreateTeam} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="Main Line Wrestling Club"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="abbreviation">Abbreviation</Label>
              <Input
                id="abbreviation"
                placeholder="MLWC"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value.slice(0, 6))}
                maxLength={6}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Max 6 characters. Used on scoreboards and brackets.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Team Color</Label>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Preset colors */}
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      primaryColor === preset.primary 
                        ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.primary }}
                    title={preset.name}
                  />
                ))}
                
                {/* Custom color picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => handlePrimaryColorChange(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    title="Pick custom color"
                  />
                  <div 
                    className={`w-10 h-10 rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center cursor-pointer hover:border-foreground transition-colors ${
                      !colorPresets.some(p => p.primary === primaryColor) 
                        ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' 
                        : ''
                    }`}
                    style={{ 
                      backgroundColor: !colorPresets.some(p => p.primary === primaryColor) ? primaryColor : 'transparent' 
                    }}
                  >
                    {colorPresets.some(p => p.primary === primaryColor) && (
                      <Palette className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a preset or click the palette icon for any color
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {abbreviation || 'ABC'}
                </div>
                <div>
                  <p className="font-semibold">{name || 'Your Team Name'}</p>
                  <p className="text-sm text-muted-foreground">{abbreviation || 'ABC'}</p>
                </div>
              </div>
            </div>

            {/* Invite Code Section */}
            <div className="space-y-2">
              <Label htmlFor="inviteCode">League Invite Code (optional)</Label>
              <div className="relative">
                <Input
                  id="inviteCode"
                  placeholder="Enter code to join a league"
                  value={inviteCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="uppercase font-mono pr-10"
                  maxLength={10}
                />
                {inviteCode && (
                  <button
                    type="button"
                    onClick={clearCode}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {validatingCode && (
                <p className="text-xs text-muted-foreground">Validating...</p>
              )}
              
              {codeError && (
                <p className="text-xs text-destructive">{codeError}</p>
              )}
              
              {validatedLeague && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/20">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    Will join{' '}
                    <span 
                      className="font-semibold"
                      style={{ color: validatedLeague.leagueColor || undefined }}
                    >
                      {validatedLeague.leagueName}
                    </span>
                  </span>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || validatingCode}
            >
              {loading 
                ? 'Creating...' 
                : validatedLeague 
                  ? 'Create Team & Join League'
                  : 'Create Team'
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

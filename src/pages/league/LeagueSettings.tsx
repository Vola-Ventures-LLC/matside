import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserContext } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save, Trash2, Globe } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LeagueSeasonsCard } from '@/components/league/LeagueSeasonsCard';

interface League {
  id: string;
  name: string;
  abbreviation: string;
  description: string | null;
  primary_color: string;
  website: string | null;
}

export default function LeagueSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentContext, refetchContexts } = useUserContext();
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');

  useEffect(() => {
    if (currentContext?.type !== 'league') {
      navigate('/dashboard');
      return;
    }

    fetchLeague();
  }, [currentContext, navigate]);

  const fetchLeague = async () => {
    if (!currentContext || currentContext.type !== 'league') return;

    setLoading(true);

    const { data, error } = await supabase
      .from('leagues')
      .select('id, name, abbreviation, description, primary_color, website')
      .eq('id', currentContext.id)
      .single();

    if (error) {
      console.error('Error fetching league:', error);
    } else if (data) {
      setLeague(data);
      setName(data.name);
      setAbbreviation(data.abbreviation);
      setDescription(data.description || '');
      setWebsite(data.website || '');
      setPrimaryColor(data.primary_color || '#3B82F6');
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!league) return;

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'League name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!abbreviation.trim() || abbreviation.length > 10) {
      toast({
        title: 'Error',
        description: 'Abbreviation is required (max 10 characters)',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('leagues')
      .update({
        name: name.trim(),
        abbreviation: abbreviation.trim().toUpperCase(),
        description: description.trim() || null,
        website: website.trim() || null,
        primary_color: primaryColor,
      })
      .eq('id', league.id);

    setSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Saved',
        description: 'League settings updated',
      });
      refetchContexts();
    }
  };

  const handleDelete = async () => {
    if (!league) return;

    const { error } = await supabase.from('leagues').delete().eq('id', league.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete league',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: 'League deleted successfully',
      });
      refetchContexts();
      navigate('/dashboard');
    }
  };

  if (currentContext?.type !== 'league') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-4xl text-foreground mb-2">League Settings</h1>
          <p className="text-muted-foreground">
            Configure your league details and preferences
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid gap-6">
            {/* Basic Info */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update your league's name and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">League Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="abbreviation">Abbreviation</Label>
                    <Input
                      id="abbreviation"
                      value={abbreviation}
                      onChange={(e) => setAbbreviation(e.target.value.slice(0, 10))}
                      className="bg-background uppercase"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-background"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yourleague.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="bg-background pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">League Color</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      id="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border border-border cursor-pointer bg-transparent"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="bg-background uppercase font-mono w-32"
                      maxLength={7}
                    />
                    <span className="text-sm text-muted-foreground">
                      Click to pick a color
                    </span>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Seasons Management */}
            <LeagueSeasonsCard leagueId={league.id} />

            {/* Danger Zone */}
            <Card className="bg-card border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for your league
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete League
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete League?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the league and all associated data.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Forever
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

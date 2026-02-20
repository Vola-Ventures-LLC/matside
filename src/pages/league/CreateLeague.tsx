import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, ArrowLeft, Globe } from 'lucide-react';

export default function CreateLeague() {
  const navigate = useNavigate();
  const { createLeague } = useUserContext();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a league name',
        variant: 'destructive',
      });
      return;
    }

    if (!abbreviation.trim() || abbreviation.length > 10) {
      toast({
        title: 'Error',
        description: 'Please enter an abbreviation (max 10 characters)',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const league = await createLeague({
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
      description: description.trim() || undefined,
      primary_color: primaryColor,
      website: website.trim() || undefined,
    });

    setLoading(false);

    if (league) {
      toast({
        title: 'League Created!',
        description: `Welcome to ${league.name}`,
      });
      navigate('/league/dashboard');
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create league. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-display text-3xl">Create a League</CardTitle>
            <CardDescription>
              Set up a new league to organize teams and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">League Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Tri-County Youth Wrestling League"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abbreviation">Abbreviation (max 10 chars)</Label>
                <Input
                  id="abbreviation"
                  placeholder="e.g., TCYWL"
                  value={abbreviation}
                  onChange={(e) => setAbbreviation(e.target.value.slice(0, 10))}
                  className="bg-background uppercase"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your league..."
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

              {/* Preview */}
              <div className="bg-background/50 rounded-lg p-4">
                <Label className="text-muted-foreground text-xs mb-2 block">Preview</Label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: primaryColor }}>
                      {name || 'League Name'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {abbreviation || 'ABBR'}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create League'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
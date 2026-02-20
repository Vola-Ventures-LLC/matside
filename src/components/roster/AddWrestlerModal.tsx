import { useState } from 'react';
import { useTeam } from '@/contexts/TeamContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AddWrestlerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentSeasonId?: string | null;
  onAddToSeason?: (wrestlerId: string) => Promise<boolean>;
}

const experienceOptions = [0, 1, 2, 3, 4, 5];
const skillOptions = [0, 1, 2, 3, 4];

export function AddWrestlerModal({ 
  open, 
  onOpenChange, 
  onSuccess, 
  currentSeasonId,
  onAddToSeason 
}: AddWrestlerModalProps) {
  const { currentTeam } = useTeam();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState('');
  const [experience, setExperience] = useState('');
  const [skill, setSkill] = useState('');

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setDob('');
    setWeight('');
    setExperience('');
    setSkill('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTeam) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No team selected.',
      });
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !dob || !weight || experience === '' || skill === '') {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    setLoading(true);

    const { data: newWrestler, error } = await supabase.from('wrestlers').insert({
      team_id: currentTeam.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      date_of_birth: dob,
      weight: parseFloat(weight),
      experience: parseInt(experience),
      skill: parseInt(skill),
    }).select().single();

    if (error) {
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add wrestler. Please try again.',
      });
      return;
    }

    // Add to current season if available
    if (currentSeasonId && onAddToSeason && newWrestler) {
      await onAddToSeason(newWrestler.id);
    }

    setLoading(false);
    toast({
      title: 'Wrestler added!',
      description: `${firstName} ${lastName} has been added to the roster.`,
    });
    resetForm();
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Wrestler</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="100"
                step="0.5"
                min="30"
                max="350"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience">Experience (years)</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger id="experience">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  {experienceOptions.map((val) => (
                    <SelectItem key={val} value={val.toString()}>
                      {val}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill">Skill (0-4)</Label>
              <Select value={skill} onValueChange={setSkill}>
                <SelectTrigger id="skill">
                  <SelectValue placeholder="Select skill" />
                </SelectTrigger>
                <SelectContent>
                  {skillOptions.map((val) => (
                    <SelectItem key={val} value={val.toString()}>
                      {val}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Wrestler'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

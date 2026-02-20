import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, History, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WrestlerHistoryDialog } from './WrestlerHistoryDialog';

interface Wrestler {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  weight: number;
  experience: number;
  skill: number;
  status: string;
  last_weigh_in_date?: string | null;
}

interface EditWrestlerModalProps {
  wrestler: Wrestler;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const experienceOptions = [0, 1, 2, 3, 4, 5];
const skillOptions = [0, 1, 2, 3, 4];

export function EditWrestlerModal({ wrestler, open, onOpenChange, onSuccess }: EditWrestlerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [firstName, setFirstName] = useState(wrestler.first_name);
  const [lastName, setLastName] = useState(wrestler.last_name);
  const [dob, setDob] = useState(wrestler.date_of_birth);
  const [weight, setWeight] = useState(wrestler.weight.toString());
  const [experience, setExperience] = useState(wrestler.experience.toString());
  const [skill, setSkill] = useState(wrestler.skill.toString());
  const [isArchived, setIsArchived] = useState(wrestler.status === 'archived');
  const [lastWeighInDate, setLastWeighInDate] = useState<Date | undefined>(
    wrestler.last_weigh_in_date ? new Date(wrestler.last_weigh_in_date) : undefined
  );

  useEffect(() => {
    setFirstName(wrestler.first_name);
    setLastName(wrestler.last_name);
    setDob(wrestler.date_of_birth);
    setWeight(wrestler.weight.toString());
    setExperience(wrestler.experience.toString());
    setSkill(wrestler.skill.toString());
    setIsArchived(wrestler.status === 'archived');
    setLastWeighInDate(
      wrestler.last_weigh_in_date ? new Date(wrestler.last_weigh_in_date) : undefined
    );
  }, [wrestler]);

  const trackChange = async (fieldName: string, oldValue: string | null, newValue: string | null) => {
    if (!user) return;
    
    await supabase.from('wrestler_changes').insert({
      wrestler_id: wrestler.id,
      team_id: wrestler.team_id,
      changed_by: user.id,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !dob || !weight || experience === '' || skill === '') {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    setLoading(true);

    const newWeight = parseFloat(weight);
    const newExperience = parseInt(experience);
    const newSkill = parseInt(skill);
    const newWeighInDate = lastWeighInDate ? format(lastWeighInDate, 'yyyy-MM-dd') : null;
    const newStatus = isArchived ? 'archived' : 'active';

    // Track changes for audited fields
    const changes: Promise<unknown>[] = [];

    // Auto-update weigh-in date if weight changed
    let finalWeighInDate = newWeighInDate;
    if (newWeight !== wrestler.weight) {
      changes.push(trackChange('weight', wrestler.weight.toString(), newWeight.toString()));
      // Automatically set weigh-in date to today when weight changes
      finalWeighInDate = format(new Date(), 'yyyy-MM-dd');
    }

    if (newExperience !== wrestler.experience) {
      changes.push(trackChange('experience', wrestler.experience.toString(), newExperience.toString()));
    }

    if (newSkill !== wrestler.skill) {
      changes.push(trackChange('skill', wrestler.skill.toString(), newSkill.toString()));
    }

    const oldWeighInDate = wrestler.last_weigh_in_date || null;
    if (finalWeighInDate !== oldWeighInDate) {
      changes.push(trackChange('last_weigh_in_date', oldWeighInDate, finalWeighInDate));
    }

    // Execute all change tracking in parallel
    await Promise.all(changes);

    const { error } = await supabase
      .from('wrestlers')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dob,
        weight: newWeight,
        experience: newExperience,
        skill: newSkill,
        last_weigh_in_date: finalWeighInDate,
        status: newStatus,
      })
      .eq('id', wrestler.id);

    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update wrestler. Please try again.',
      });
    } else {
      toast({
        title: 'Wrestler updated!',
        description: `${firstName} ${lastName} has been updated.`,
      });
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Wrestler</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="gap-1"
              >
                <History className="w-4 h-4" />
                History
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editDob">Date of Birth</Label>
                <Input
                  id="editDob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editWeight">Weight (lbs)</Label>
                <Input
                  id="editWeight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  step="0.5"
                  min="30"
                  max="350"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Last Weigh-in Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !lastWeighInDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {lastWeighInDate ? format(lastWeighInDate, 'PPP') : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={lastWeighInDate}
                    onSelect={setLastWeighInDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editExperience">Experience (years)</Label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger id="editExperience">
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
                <Label htmlFor="editSkill">Skill (0-4)</Label>
                <Select value={skill} onValueChange={setSkill}>
                  <SelectTrigger id="editSkill">
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

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="archived" className="text-sm font-medium cursor-pointer">
                    Archive Wrestler
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Archived wrestlers won't appear in meets
                  </p>
                </div>
              </div>
              <Switch
                id="archived"
                checked={isArchived}
                onCheckedChange={setIsArchived}
              />
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
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <WrestlerHistoryDialog
        wrestlerId={wrestler.id}
        wrestlerName={`${wrestler.first_name} ${wrestler.last_name}`}
        open={showHistory}
        onOpenChange={setShowHistory}
      />
    </>
  );
}

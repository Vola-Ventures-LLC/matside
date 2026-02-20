import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { UserPlus, UserCheck, AlertCircle } from 'lucide-react';

interface ExistingWrestler {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  weight: number;
  experience: number;
  skill: number;
  matchScore: number; // How closely it matches (0-100)
}

interface NewWrestlerData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  weight: number;
  experience: number;
  skill: number;
}

interface WrestlerMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newWrestler: NewWrestlerData;
  potentialMatches: ExistingWrestler[];
  onLinkExisting: (wrestlerId: string) => void;
  onCreateNew: () => void;
}

export function WrestlerMatchModal({
  open,
  onOpenChange,
  newWrestler,
  potentialMatches,
  onLinkExisting,
  onCreateNew,
}: WrestlerMatchModalProps) {
  const [selectedId, setSelectedId] = useState<string>('new');

  const handleConfirm = () => {
    if (selectedId === 'new') {
      onCreateNew();
    } else {
      onLinkExisting(selectedId);
    }
    onOpenChange(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Potential Match Found
          </DialogTitle>
          <DialogDescription>
            We found wrestlers that might be the same person as "{newWrestler.first_name} {newWrestler.last_name}". 
            Please confirm whether to link to an existing record or create a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* New wrestler being added */}
          <div className="p-3 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Adding:</p>
            <p className="font-medium">{newWrestler.first_name} {newWrestler.last_name}</p>
            <p className="text-sm text-muted-foreground">
              DOB: {formatDate(newWrestler.date_of_birth)} (Age {calculateAge(newWrestler.date_of_birth)}) • {newWrestler.weight} lbs
            </p>
          </div>

          <RadioGroup value={selectedId} onValueChange={setSelectedId} className="space-y-3">
            {/* Potential matches */}
            {potentialMatches.map((match) => (
              <div
                key={match.id}
                className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedId === match.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedId(match.id)}
              >
                <RadioGroupItem value={match.id} id={match.id} className="mt-1" />
                <Label htmlFor={match.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span className="font-medium">{match.first_name} {match.last_name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {match.matchScore}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    DOB: {formatDate(match.date_of_birth)} (Age {calculateAge(match.date_of_birth)}) • Last weight: {match.weight} lbs
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Exp: {match.experience} yrs • Skill: {match.skill}
                  </p>
                </Label>
              </div>
            ))}

            {/* Create new option */}
            <div
              className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedId === 'new' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedId('new')}
            >
              <RadioGroupItem value="new" id="new" className="mt-1" />
              <Label htmlFor="new" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Create new wrestler</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  This is a different person, create a new record
                </p>
              </Label>
            </div>
          </RadioGroup>
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
          <Button onClick={handleConfirm} className="flex-1 btn-primary">
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

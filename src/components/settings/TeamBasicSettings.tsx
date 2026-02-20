import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TeamBasicSettingsProps {
  name: string;
  setName: (value: string) => void;
  abbreviation: string;
  setAbbreviation: (value: string) => void;
  primaryColor: string;
  setPrimaryColor: (value: string) => void;
  homeMeetAddress: string;
  setHomeMeetAddress: (value: string) => void;
  homeMeetNotes: string;
  setHomeMeetNotes: (value: string) => void;
}

export function TeamBasicSettings({
  name,
  setName,
  abbreviation,
  setAbbreviation,
  primaryColor,
  setPrimaryColor,
  homeMeetAddress,
  setHomeMeetAddress,
  homeMeetNotes,
  setHomeMeetNotes,
}: TeamBasicSettingsProps) {
  return (
    <Card className="card-athletic">
      <CardHeader>
        <CardTitle>Team Information</CardTitle>
        <CardDescription>
          Update your organization's basic information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Organization Name</Label>
            <Input
              id="teamName"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamAbbr">Abbreviation</Label>
            <Input
              id="teamAbbr"
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value.slice(0, 6))}
              maxLength={6}
              className="uppercase"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryColor">Team Color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="primaryColor"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-12 rounded-lg border border-border cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#DC2626"
              className="w-32 uppercase"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="homeMeetAddress">Home Meet Address</Label>
          <Input
            id="homeMeetAddress"
            value={homeMeetAddress}
            onChange={(e) => setHomeMeetAddress(e.target.value)}
            placeholder="123 Main St, City, State 12345"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="homeMeetNotes">Home Meet Notes</Label>
          <Textarea
            id="homeMeetNotes"
            value={homeMeetNotes}
            onChange={(e) => setHomeMeetNotes(e.target.value)}
            placeholder="Parking info, entrance details, etc."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

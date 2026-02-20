import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Check, X, Clock, LogOut as LeaveIcon, HelpCircle } from 'lucide-react';

interface Meet {
  id: string;
  name: string;
  meet_date: string;
}

interface Wrestler {
  id: string;
  first_name: string;
  last_name: string;
}

interface Attendance {
  id?: string;
  wrestler_id: string;
  status: string;
}

interface ManageAttendanceSheetProps {
  meet: Meet;
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions = [
  { value: 'pending', label: 'Not Set', icon: null },
  { value: 'unconfirmed', label: 'Unconfirmed', icon: HelpCircle },
  { value: 'attending', label: 'Attending', icon: Check },
  { value: 'not_attending', label: 'Not Attending', icon: X },
  { value: 'arriving_late', label: 'Arriving Late', icon: Clock },
  { value: 'leaving_early', label: 'Leaving Early', icon: LeaveIcon },
];

export function ManageAttendanceSheet({ meet, teamId, open, onOpenChange }: ManageAttendanceSheetProps) {
  const { toast } = useToast();
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && teamId) {
      fetchData();
      // Auto-confirm team participation when they open attendance
      confirmTeamParticipation();
    }
  }, [open, teamId, meet.id]);

  const confirmTeamParticipation = async () => {
    // Update meet_teams status to 'confirmed' if currently 'invited'
    const { error } = await supabase
      .from('meet_teams')
      .update({ status: 'confirmed' })
      .eq('meet_id', meet.id)
      .eq('team_id', teamId)
      .eq('status', 'invited');

    if (error) {
      console.error('Error confirming team participation:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    const [wrestlersRes, attendanceRes] = await Promise.all([
      supabase
        .from('wrestlers')
        .select('id, first_name, last_name')
        .eq('team_id', teamId)
        .eq('status', 'active')
        .order('last_name'),
      supabase
        .from('meet_attendance')
        .select('id, wrestler_id, status')
        .eq('meet_id', meet.id)
        .eq('team_id', teamId)
    ]);

    if (wrestlersRes.error) {
      console.error('Error fetching wrestlers:', wrestlersRes.error);
    } else {
      setWrestlers(wrestlersRes.data || []);
    }

    if (attendanceRes.error) {
      console.error('Error fetching attendance:', attendanceRes.error);
    } else {
      const attendanceMap: Record<string, Attendance> = {};
      (attendanceRes.data || []).forEach((a) => {
        attendanceMap[a.wrestler_id] = a;
      });
      setAttendance(attendanceMap);
    }

    setLoading(false);
  };

  const updateAttendance = async (wrestlerId: string, status: string) => {
    const existing = attendance[wrestlerId];
    
    if (existing?.id) {
      const { error } = await supabase
        .from('meet_attendance')
        .update({ status })
        .eq('id', existing.id);
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update attendance',
        });
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('meet_attendance')
        .insert({
          meet_id: meet.id,
          wrestler_id: wrestlerId,
          team_id: teamId,
          status,
        })
        .select('id')
        .single();
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save attendance',
        });
        return;
      }
      
      setAttendance(prev => ({
        ...prev,
        [wrestlerId]: { id: data.id, wrestler_id: wrestlerId, status }
      }));
      return;
    }

    setAttendance(prev => ({
      ...prev,
      [wrestlerId]: { ...prev[wrestlerId], status }
    }));
  };

  const setAllAttending = async () => {
    setSaving(true);
    
    const updates = wrestlers.map(wrestler => ({
      meet_id: meet.id,
      wrestler_id: wrestler.id,
      team_id: teamId,
      status: 'attending',
    }));

    const { error } = await supabase
      .from('meet_attendance')
      .upsert(updates, { onConflict: 'meet_id,wrestler_id' });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update attendance',
      });
    } else {
      toast({
        title: 'Success',
        description: 'All wrestlers marked as attending',
      });
      fetchData();
    }
    
    setSaving(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'attending':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Attending</Badge>;
      case 'not_attending':
        return <Badge variant="destructive">Not Attending</Badge>;
      case 'arriving_late':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Arriving Late</Badge>;
      case 'leaving_early':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Leaving Early</Badge>;
      case 'unconfirmed':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Unconfirmed</Badge>;
      default:
        return <Badge variant="secondary">Not Set</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Attendance - {meet.name}
          </SheetTitle>
        </SheetHeader>

        <div className="flex justify-end py-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={setAllAttending}
            disabled={saving || loading}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Attending
          </Button>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading roster...</p>
            </div>
          ) : wrestlers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No wrestlers on your roster
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {wrestlers.map((wrestler) => {
                const currentStatus = attendance[wrestler.id]?.status || 'pending';
                return (
                  <div 
                    key={wrestler.id} 
                    className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {wrestler.last_name}, {wrestler.first_name}
                      </span>
                      {getStatusBadge(currentStatus)}
                    </div>
                    <Select
                      value={currentStatus}
                      onValueChange={(value) => updateAttendance(wrestler.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t mt-auto">
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

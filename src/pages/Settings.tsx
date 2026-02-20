import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTeam } from '@/contexts/TeamContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TeamBasicSettings } from '@/components/settings/TeamBasicSettings';
import { MatchingRulesSettings } from '@/components/settings/MatchingRulesSettings';
import { MatRulesSettings, MatRule } from '@/components/settings/MatRulesSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { TeamMembersSettings } from '@/components/settings/TeamMembersSettings';
import { JoinLeagueModal } from '@/components/team/JoinLeagueModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trophy } from 'lucide-react';

export default function Settings() {
  const { currentTeam, refetchTeams } = useTeam();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingMatRules, setLoadingMatRules] = useState(true);
  const originalConsentRef = useRef<boolean | null>(null);
  const [joinLeagueOpen, setJoinLeagueOpen] = useState(false);

  // Basic settings
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#DC2626');
  const [homeMeetAddress, setHomeMeetAddress] = useState('');
  const [homeMeetNotes, setHomeMeetNotes] = useState('');

  // Matching priorities
  const [priorityAge, setPriorityAge] = useState(1);
  const [priorityWeight, setPriorityWeight] = useState(2);
  const [priorityExperience, setPriorityExperience] = useState(3);
  const [prioritySkill, setPrioritySkill] = useState(4);

  // Limits
  const [maxAgeDiff, setMaxAgeDiff] = useState(1);
  const [maxMatchesPerWrestler, setMaxMatchesPerWrestler] = useState(4);
  const [teammatesCanWrestle, setTeammatesCanWrestle] = useState(false);

  // Conflict flags
  const [conflictMinMatches, setConflictMinMatches] = useState(2);
  const [conflictMaxMatches, setConflictMaxMatches] = useState(5);
  const [conflictMinGap, setConflictMinGap] = useState(7);

  // Mat rules
  const [matRules, setMatRules] = useState<MatRule[]>([]);
  const [originalMatRuleIds, setOriginalMatRuleIds] = useState<string[]>([]);

  // Privacy settings
  const [dataSharingConsent, setDataSharingConsent] = useState(false);
  const [dataSharingConsentAt, setDataSharingConsentAt] = useState<string | null>(null);

  useEffect(() => {
    if (currentTeam) {
      setName(currentTeam.name);
      setAbbreviation(currentTeam.abbreviation);
      setPrimaryColor(currentTeam.primary_color || '#DC2626');
      setHomeMeetAddress(currentTeam.home_meet_address || '');
      setHomeMeetNotes(currentTeam.home_meet_notes || '');
      setPriorityAge(currentTeam.match_priority_age || 1);
      setPriorityWeight(currentTeam.match_priority_weight || 2);
      setPriorityExperience(currentTeam.match_priority_experience || 3);
      setPrioritySkill(currentTeam.match_priority_skill || 4);
      setMaxAgeDiff(currentTeam.max_age_diff || 1);
      setMaxMatchesPerWrestler(currentTeam.max_matches_per_wrestler || 4);
      setTeammatesCanWrestle(currentTeam.teammates_can_wrestle || false);
      setConflictMinMatches(currentTeam.conflict_min_matches || 2);
      setConflictMaxMatches(currentTeam.conflict_max_matches || 5);
      setConflictMinGap(currentTeam.conflict_min_gap || 7);
      setDataSharingConsent(currentTeam.data_sharing_consent || false);
      setDataSharingConsentAt(currentTeam.data_sharing_consent_at || null);
      
      // Track original consent value to detect changes
      if (originalConsentRef.current === null) {
        originalConsentRef.current = currentTeam.data_sharing_consent || false;
      }

      fetchMatRules();
    }
  }, [currentTeam]);

  const fetchMatRules = async () => {
    if (!currentTeam) return;

    setLoadingMatRules(true);
    const { data, error } = await supabase
      .from('mat_rules')
      .select('*')
      .eq('team_id', currentTeam.id)
      .order('mat_number', { ascending: true });

    if (error) {
      console.error('Error fetching mat rules:', error);
    } else {
      setMatRules(data || []);
      setOriginalMatRuleIds(data?.map((r) => r.id) || []);
    }
    setLoadingMatRules(false);
  };

  const handleDataSharingChange = (enabled: boolean) => {
    setDataSharingConsent(enabled);
    if (enabled) {
      setDataSharingConsentAt(new Date().toISOString());
    } else {
      setDataSharingConsentAt(null);
    }
  };

  const handleSave = async () => {
    if (!currentTeam) return;

    setLoading(true);

    // Update team settings
    const { error: teamError } = await supabase
      .from('teams')
      .update({
        name: name.trim(),
        abbreviation: abbreviation.trim().toUpperCase(),
        primary_color: primaryColor,
        home_meet_address: homeMeetAddress.trim() || null,
        home_meet_notes: homeMeetNotes.trim() || null,
        match_priority_age: priorityAge,
        match_priority_weight: priorityWeight,
        match_priority_experience: priorityExperience,
        match_priority_skill: prioritySkill,
        max_age_diff: maxAgeDiff,
        max_matches_per_wrestler: maxMatchesPerWrestler,
        teammates_can_wrestle: teammatesCanWrestle,
        conflict_min_matches: conflictMinMatches,
        conflict_max_matches: conflictMaxMatches,
        conflict_min_gap: conflictMinGap,
        data_sharing_consent: dataSharingConsent,
        data_sharing_consent_at: dataSharingConsentAt,
      })
      .eq('id', currentTeam.id);

    // Log consent change to audit trail if it changed
    if (user && originalConsentRef.current !== dataSharingConsent) {
      await supabase.from('consent_audit').insert({
        team_id: currentTeam.id,
        changed_by: user.id,
        action: dataSharingConsent ? 'enabled' : 'disabled',
      });
      // Update the original value after logging
      originalConsentRef.current = dataSharingConsent;
    }

    if (teamError) {
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update team settings.',
      });
      return;
    }

    // Handle mat rules: delete removed, upsert remaining
    const currentIds = matRules.filter((r) => r.id).map((r) => r.id!);
    const deletedIds = originalMatRuleIds.filter((id) => !currentIds.includes(id));

    // Delete removed rules
    if (deletedIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('mat_rules')
        .delete()
        .in('id', deletedIds);

      if (deleteError) {
        console.error('Error deleting mat rules:', deleteError);
      }
    }

    // Upsert mat rules
    for (const rule of matRules) {
      if (rule.id) {
        // Update existing
      const { error: updateError } = await supabase
        .from('mat_rules')
        .update({
          mat_number: rule.mat_number,
          min_experience: rule.min_experience,
          max_experience: rule.max_experience,
          min_age: rule.min_age,
          max_age: rule.max_age,
          min_skill: rule.min_skill,
          max_skill: rule.max_skill,
          max_matches: Math.min(rule.max_matches, 99),
        })
        .eq('id', rule.id);

      if (updateError) {
        console.error('Error updating mat rule:', updateError);
      }
    } else {
      // Insert new
      const { error: insertError } = await supabase.from('mat_rules').insert({
        team_id: currentTeam.id,
        mat_number: rule.mat_number,
        min_experience: rule.min_experience,
        max_experience: rule.max_experience,
        min_age: rule.min_age,
        max_age: rule.max_age,
        min_skill: rule.min_skill,
        max_skill: rule.max_skill,
        max_matches: Math.min(rule.max_matches, 99),
      });

        if (insertError) {
          console.error('Error inserting mat rule:', insertError);
        }
      }
    }

    setLoading(false);
    toast({
      title: 'Settings saved!',
      description: 'Your team settings have been updated.',
    });
    refetchTeams();
    fetchMatRules();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your team settings and matching preferences
            </p>
          </div>
          <Button className="btn-primary w-full sm:w-auto" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save All Changes'
            )}
          </Button>
        </div>

        {/* SECTION: Team Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Team Settings</h2>
          <TeamBasicSettings
            name={name}
            setName={setName}
            abbreviation={abbreviation}
            setAbbreviation={setAbbreviation}
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
            homeMeetAddress={homeMeetAddress}
            setHomeMeetAddress={setHomeMeetAddress}
            homeMeetNotes={homeMeetNotes}
            setHomeMeetNotes={setHomeMeetNotes}
          />
          <TeamMembersSettings />
        </div>

        {/* SECTION: Matching Configuration */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Matching Configuration</h2>
          <MatchingRulesSettings
            priorityAge={priorityAge}
            setPriorityAge={setPriorityAge}
            priorityWeight={priorityWeight}
            setPriorityWeight={setPriorityWeight}
            priorityExperience={priorityExperience}
            setPriorityExperience={setPriorityExperience}
            prioritySkill={prioritySkill}
            setPrioritySkill={setPrioritySkill}
            maxAgeDiff={maxAgeDiff}
            setMaxAgeDiff={setMaxAgeDiff}
            maxMatchesPerWrestler={maxMatchesPerWrestler}
            setMaxMatchesPerWrestler={setMaxMatchesPerWrestler}
            teammatesCanWrestle={teammatesCanWrestle}
            setTeammatesCanWrestle={setTeammatesCanWrestle}
            conflictMinMatches={conflictMinMatches}
            setConflictMinMatches={setConflictMinMatches}
            conflictMaxMatches={conflictMaxMatches}
            setConflictMaxMatches={setConflictMaxMatches}
            conflictMinGap={conflictMinGap}
            setConflictMinGap={setConflictMinGap}
          />
          {loadingMatRules ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MatRulesSettings matRules={matRules} setMatRules={setMatRules} />
          )}
        </div>

        {/* SECTION: Privacy & Data Sharing */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Privacy & Data Sharing</h2>
          <PrivacySettings
            teamId={currentTeam?.id}
            dataSharingConsent={dataSharingConsent}
            setDataSharingConsent={handleDataSharingChange}
            dataSharingConsentAt={dataSharingConsentAt}
          />
        </div>

        {/* SECTION: League Membership */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">League Membership</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Join a League
              </CardTitle>
              <CardDescription>
                Join a league using an invite code from the league organizer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setJoinLeagueOpen(true)}>
                <Trophy className="w-4 h-4 mr-2" />
                Join a League
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pb-8">
          <Button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save All Changes'
            )}
          </Button>
        </div>
      </div>

      <JoinLeagueModal
        open={joinLeagueOpen}
        onOpenChange={setJoinLeagueOpen}
      />
    </DashboardLayout>
  );
}

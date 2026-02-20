import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Wrestler {
  id: string;
  first_name: string;
  last_name: string;
  weight: number;
  date_of_birth: string;
  experience: number;
  skill: number;
  team_id: string;
}

interface TeamSettings {
  match_priority_age: number;
  match_priority_weight: number;
  match_priority_experience: number;
  match_priority_skill: number;
  max_age_diff: number;
  max_matches_per_wrestler: number;
  teammates_can_wrestle: boolean;
  conflict_min_gap: number;
}

interface MatRule {
  mat_number: number;
  min_age: number;
  max_age: number;
  min_experience: number;
  max_experience: number;
  min_skill: number;
  max_skill: number;
  max_matches: number;
}

interface MatchAssignment {
  wrestler_a_id: string;
  wrestler_b_id: string;
  wrestler_a: Wrestler;
  wrestler_b: Wrestler;
  avg_skill: number;
  avg_experience: number;
  attendance_a: string;
  attendance_b: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client to verify the JWT
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    console.log('User auth result:', userData?.user?.id, 'Error:', userError?.message);
    
    if (userError || !userData.user) {
      console.log('Authentication failed:', userError?.message || 'No user data');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    console.log('Authenticated user:', userId);

    // Create user-scoped client for RLS queries
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { meet_id, host_team_id } = await req.json();

    if (!meet_id || !host_team_id) {
      return new Response(
        JSON.stringify({ error: 'Missing meet_id or host_team_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating pairings for meet ${meet_id}`);

    // Mat count will be determined by mat rules (set later after fetching rules)

    // First check for meet-specific rules
    const { data: meetRulesData } = await supabase
      .from('meet_rules')
      .select('match_priority_age, match_priority_weight, match_priority_experience, match_priority_skill, max_age_diff, max_matches_per_wrestler, teammates_can_wrestle, conflict_min_gap')
      .eq('meet_id', meet_id)
      .maybeSingle();

    let settings: TeamSettings;

    if (meetRulesData) {
      // Use meet-specific rules
      settings = meetRulesData;
      console.log('Using meet-specific rules:', settings);
    } else {
      // Fall back to host team settings
      const { data: teamSettings, error: settingsError } = await supabase
        .from('teams')
        .select('match_priority_age, match_priority_weight, match_priority_experience, match_priority_skill, max_age_diff, max_matches_per_wrestler, teammates_can_wrestle, conflict_min_gap')
        .eq('id', host_team_id)
        .single();

      if (settingsError) {
        console.error('Error fetching team settings:', settingsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch team settings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      settings = teamSettings;
      console.log('Using team default settings:', settings);
    }

    // First check for meet-specific mat rules
    const { data: meetMatRulesData } = await supabase
      .from('meet_mat_rules')
      .select('mat_number, min_age, max_age, min_experience, max_experience, min_skill, max_skill, max_matches')
      .eq('meet_id', meet_id)
      .order('mat_number', { ascending: true });

    let matRules: MatRule[];

    if (meetMatRulesData && meetMatRulesData.length > 0) {
      // Use meet-specific mat rules
      matRules = meetMatRulesData;
      console.log('Using meet-specific mat rules:', matRules);
    } else {
      // Fall back to host team mat rules
      const { data: teamMatRulesData } = await supabase
        .from('mat_rules')
        .select('mat_number, min_age, max_age, min_experience, max_experience, min_skill, max_skill, max_matches')
        .eq('team_id', host_team_id)
        .order('mat_number', { ascending: true });

      matRules = teamMatRulesData || [];
      console.log('Using team default mat rules:', matRules);
    }

    // Determine mat count from mat rules - if no rules, default to 2 mats
    const matCount = matRules.length > 0 
      ? Math.max(...matRules.map(r => r.mat_number))
      : 2;
    console.log('Using mat count:', matCount);

    // Get all attending wrestlers for this meet (including status)
    const { data: attendance, error: attendanceError } = await supabase
      .from('meet_attendance')
      .select('wrestler_id, team_id, status')
      .eq('meet_id', meet_id)
      .in('status', ['attending', 'arriving_late', 'leaving_early']);

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch attendance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!attendance || attendance.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Not enough wrestlers attending', matches_created: 0 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build attendance status map
    const attendanceStatusMap: Record<string, string> = {};
    attendance.forEach(a => {
      attendanceStatusMap[a.wrestler_id] = a.status;
    });

    const wrestlerIds = attendance.map(a => a.wrestler_id);

    // Get wrestler details (exclude archived wrestlers)
    const { data: wrestlers, error: wrestlersError } = await supabase
      .from('wrestlers')
      .select('id, first_name, last_name, weight, date_of_birth, experience, skill, team_id, status')
      .in('id', wrestlerIds)
      .neq('status', 'archived');

    if (wrestlersError || !wrestlers) {
      console.error('Error fetching wrestlers:', wrestlersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch wrestlers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${wrestlers.length} wrestlers for pairing`);

    // Delete existing matches for this meet
    await supabase
      .from('matches')
      .delete()
      .eq('meet_id', meet_id);

    // Calculate age from date of birth
    const calculateAge = (dob: string): number => {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    // Calculate match score based on priorities (lower is better)
    const calculateMatchScore = (w1: Wrestler, w2: Wrestler): number => {
      // Don't match teammates unless allowed
      if (!settings.teammates_can_wrestle && w1.team_id === w2.team_id) {
        return Infinity;
      }

      const age1 = calculateAge(w1.date_of_birth);
      const age2 = calculateAge(w2.date_of_birth);
      const ageDiff = Math.abs(age1 - age2);

      // Enforce max age difference
      if (ageDiff > settings.max_age_diff) {
        return Infinity;
      }

      const weightDiff = Math.abs(w1.weight - w2.weight);
      const experienceDiff = Math.abs(w1.experience - w2.experience);
      const skillDiff = Math.abs(w1.skill - w2.skill);

      // Lower priority number = more important
      // Invert so higher priority gives higher weight
      const ageWeight = (5 - settings.match_priority_age) * 10;
      const weightWeight = (5 - settings.match_priority_weight) * 10;
      const experienceWeight = (5 - settings.match_priority_experience) * 10;
      const skillWeight = (5 - settings.match_priority_skill) * 10;

      return (
        ageDiff * ageWeight +
        weightDiff * weightWeight +
        experienceDiff * experienceWeight +
        skillDiff * skillWeight
      );
    };

    // Generate all possible pairings with scores
    const pairings: { w1: Wrestler; w2: Wrestler; score: number }[] = [];
    
    for (let i = 0; i < wrestlers.length; i++) {
      for (let j = i + 1; j < wrestlers.length; j++) {
        const score = calculateMatchScore(wrestlers[i], wrestlers[j]);
        if (score < Infinity) {
          pairings.push({ w1: wrestlers[i], w2: wrestlers[j], score });
        }
      }
    }

    // Sort by score (best matches first)
    pairings.sort((a, b) => a.score - b.score);

    // BALANCED DISTRIBUTION: Round-robin approach
    // Give everyone 1 match before anyone gets 2, etc.
    // ATTENDANCE-AWARE: Prioritize arriving_late wrestlers in pairing phase
    // so they get matches before their compatible opponents are used up
    const matchCounts: Record<string, number> = {};
    wrestlers.forEach(w => matchCounts[w.id] = 0);

    // Track available pairings for each wrestler (count of unused valid pairings)
    const availablePairingsCount: Record<string, number> = {};
    wrestlers.forEach(w => availablePairingsCount[w.id] = 0);
    for (const p of pairings) {
      availablePairingsCount[p.w1.id]++;
      availablePairingsCount[p.w2.id]++;
    }

    // Track which pairings have been used
    const usedPairings = new Set<string>();
    const getPairingKey = (w1Id: string, w2Id: string) => 
      [w1Id, w2Id].sort().join('-');

    const selectedMatches: MatchAssignment[] = [];

    // Helper: Get pairing priority for a wrestler (lower = process first in round-robin)
    // arriving_late wrestlers get highest priority (0) since their opponents may get used up
    // leaving_early wrestlers also need priority (1) to ensure they get scheduled
    // regular attending wrestlers get normal priority (2)
    const getWrestlerPairingPriority = (wrestlerId: string): number => {
      const status = attendanceStatusMap[wrestlerId];
      if (status === 'arriving_late') return 0; // Process first - limited scheduling window
      if (status === 'leaving_early') return 1; // Process second - needs early slots
      return 2; // Regular - most flexible
    };

    // Round-robin: iterate through match count levels (0, 1, 2, 3...)
    for (let targetCount = 0; targetCount < settings.max_matches_per_wrestler; targetCount++) {
      // Find all wrestlers currently at this count level
      let wrestlersAtLevel = wrestlers
        .filter(w => matchCounts[w.id] === targetCount)
        .map(w => w.id);
      
      // Sort by: 1) attendance priority (arriving_late first), 2) available pairings (fewest first)
      wrestlersAtLevel.sort((a, b) => {
        const priorityA = getWrestlerPairingPriority(a);
        const priorityB = getWrestlerPairingPriority(b);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return availablePairingsCount[a] - availablePairingsCount[b];
      });
      
      // Process each wrestler at this level
      for (const wrestlerId of wrestlersAtLevel) {
        // Skip if wrestler already moved to next level
        if (matchCounts[wrestlerId] > targetCount) continue;
        
        // Find best available pairing for this wrestler
        let bestPairing: { w1: Wrestler; w2: Wrestler; score: number } | null = null;
        
        for (const pairing of pairings) {
          const pairingKey = getPairingKey(pairing.w1.id, pairing.w2.id);
          if (usedPairings.has(pairingKey)) continue;
          
          // Check if this pairing involves our wrestler
          const isW1 = pairing.w1.id === wrestlerId;
          const isW2 = pairing.w2.id === wrestlerId;
          if (!isW1 && !isW2) continue;
          
          const opponent = isW1 ? pairing.w2 : pairing.w1;
          
          // Check opponent hasn't exceeded max matches
          if (matchCounts[opponent.id] >= settings.max_matches_per_wrestler) continue;
          
          // Prefer opponents who are also at or below the target level (balance)
          // This helps ensure even distribution
          if (matchCounts[opponent.id] <= targetCount) {
            bestPairing = pairing;
            break; // Found a balanced match
          }
          
          // Fall back to any available opponent if no balanced match found yet
          if (!bestPairing) {
            bestPairing = pairing;
          }
        }
        
        if (bestPairing) {
          const pairingKey = getPairingKey(bestPairing.w1.id, bestPairing.w2.id);
          usedPairings.add(pairingKey);
          
          selectedMatches.push({
            wrestler_a_id: bestPairing.w1.id,
            wrestler_b_id: bestPairing.w2.id,
            wrestler_a: bestPairing.w1,
            wrestler_b: bestPairing.w2,
            avg_skill: (bestPairing.w1.skill + bestPairing.w2.skill) / 2,
            avg_experience: (bestPairing.w1.experience + bestPairing.w2.experience) / 2,
            attendance_a: attendanceStatusMap[bestPairing.w1.id] || 'attending',
            attendance_b: attendanceStatusMap[bestPairing.w2.id] || 'attending',
          });
          
          matchCounts[bestPairing.w1.id]++;
          matchCounts[bestPairing.w2.id]++;
          availablePairingsCount[bestPairing.w1.id]--;
          availablePairingsCount[bestPairing.w2.id]--;
        }
      }
    }

    // Log distribution stats
    const countDistribution: Record<number, number> = {};
    Object.values(matchCounts).forEach(count => {
      countDistribution[count] = (countDistribution[count] || 0) + 1;
    });
    console.log('Match count distribution:', countDistribution);

    console.log(`Generated ${selectedMatches.length} matches before mat assignment`);

    // --- MAT ASSIGNMENT LOGIC ---
    // STRICT ROUND-ROBIN: Assign one match to each mat in turn, respecting rest gaps
    // Mat rules are preferences - matches that don't fit preferences go to "open" slots
    // Attendance-aware: leaving_early matches go first, arriving_late matches go last
    
    // Helper to get attendance priority (lower = schedule earlier)
    const getAttendancePriority = (match: MatchAssignment): number => {
      const hasLeavingEarly = match.attendance_a === 'leaving_early' || match.attendance_b === 'leaving_early';
      const hasArrivingLate = match.attendance_a === 'arriving_late' || match.attendance_b === 'arriving_late';
      
      if (hasLeavingEarly && !hasArrivingLate) return 0; // Schedule first
      if (hasArrivingLate && !hasLeavingEarly) return 2; // Schedule last
      if (hasLeavingEarly && hasArrivingLate) return 1; // Conflicting - middle priority
      return 1; // Regular match - middle priority
    };
    
    // Sort matches: leaving_early first, then regular, then arriving_late
    // Within each group, sort by skill level
    selectedMatches.sort((a, b) => {
      const priorityA = getAttendancePriority(a);
      const priorityB = getAttendancePriority(b);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.avg_skill - b.avg_skill;
    });

    // Initialize mat queues and tracking
    const matQueues: MatchAssignment[][] = Array.from({ length: matCount }, () => []);
    
    // Track the actual time slot of each wrestler's last match PER MAT
    // This is crucial: a wrestler at time slot 5 on Mat 1 shouldn't conflict with time slot 5 on Mat 2
    // We need GLOBAL time tracking - matches at the same queue position across mats happen simultaneously
    const wrestlerLastGlobalSlot: Record<string, number> = {};
    wrestlers.forEach(w => {
      wrestlerLastGlobalSlot[w.id] = -Infinity; // No match yet
    });

    // Helper: Check if wrestler can be assigned at a given global time slot
    const canAssignAtSlot = (wrestlerId: string, globalSlot: number): boolean => {
      const lastSlot = wrestlerLastGlobalSlot[wrestlerId];
      if (lastSlot === -Infinity) return true;
      const gap = globalSlot - lastSlot;
      return gap >= settings.conflict_min_gap;
    };

    // Helper: Check if match satisfies mat rules (preference check)
    const matchFitsMatPreference = (match: MatchAssignment, matIndex: number): boolean => {
      const rule = matRules.find(r => r.mat_number === matIndex + 1);
      if (!rule) return true; // No rule = open mat
      
      const age1 = calculateAge(match.wrestler_a.date_of_birth);
      const age2 = calculateAge(match.wrestler_b.date_of_birth);
      const avgAge = (age1 + age2) / 2;
      
      if (avgAge < rule.min_age || avgAge > rule.max_age) return false;
      if (match.avg_experience < rule.min_experience || match.avg_experience > rule.max_experience) return false;
      if (match.avg_skill < rule.min_skill || match.avg_skill > rule.max_skill) return false;
      
      return true;
    };

    // Helper: Check if mat has reached max matches
    const matAtCapacity = (matIndex: number): boolean => {
      const rule = matRules.find(r => r.mat_number === matIndex + 1);
      if (!rule) return false;
      return matQueues[matIndex].length >= rule.max_matches;
    };

    // Helper: Find best match for a mat at a given global slot
    const findBestMatchForMat = (
      candidates: MatchAssignment[], 
      matIndex: number, 
      globalSlot: number, 
      requirePreference: boolean
    ): number => {
      for (let i = 0; i < candidates.length; i++) {
        const match = candidates[i];
        
        // Check rest time for both wrestlers using GLOBAL slot
        if (!canAssignAtSlot(match.wrestler_a_id, globalSlot) ||
            !canAssignAtSlot(match.wrestler_b_id, globalSlot)) {
          continue;
        }
        
        // Check mat capacity
        if (matAtCapacity(matIndex)) {
          continue;
        }
        
        // Check preference if required
        if (requirePreference && !matchFitsMatPreference(match, matIndex)) {
          continue;
        }
        
        return i;
      }
      return -1;
    };

    const unassignedMatches = [...selectedMatches];
    let globalSlot = 0; // Current time slot (row of matches across all mats)
    let maxIterations = unassignedMatches.length * matCount * 20; // Safety limit
    let consecutiveEmptyRounds = 0;
    
    // STRICT ROUND-ROBIN: Fill one row at a time across all mats
    while (unassignedMatches.length > 0 && maxIterations > 0 && consecutiveEmptyRounds < matCount * 2) {
      maxIterations--;
      
      let assignedThisRound = 0;
      
      // Try to assign one match to each mat at the current global slot
      for (let m = 0; m < matCount; m++) {
        if (matAtCapacity(m)) continue;
        if (matQueues[m].length > globalSlot) continue; // This mat already has a match at this slot
        
        // First try: Find a match that fits this mat's preference
        let bestMatchIndex = findBestMatchForMat(unassignedMatches, m, globalSlot, true);
        
        // Second try: If no preferred match, allow any match (mat becomes "open")
        if (bestMatchIndex === -1) {
          bestMatchIndex = findBestMatchForMat(unassignedMatches, m, globalSlot, false);
        }
        
        if (bestMatchIndex >= 0) {
          const match = unassignedMatches.splice(bestMatchIndex, 1)[0];
          matQueues[m].push(match);
          // Record the GLOBAL time slot for gap tracking
          wrestlerLastGlobalSlot[match.wrestler_a_id] = globalSlot;
          wrestlerLastGlobalSlot[match.wrestler_b_id] = globalSlot;
          assignedThisRound++;
        }
      }
      
      // Move to next global slot if we tried all mats
      const allMatsAtOrPastSlot = matQueues.every((q, m) => 
        q.length > globalSlot || matAtCapacity(m)
      );
      
      if (allMatsAtOrPastSlot || assignedThisRound === 0) {
        if (assignedThisRound === 0) {
          consecutiveEmptyRounds++;
        } else {
          consecutiveEmptyRounds = 0;
        }
        globalSlot++;
      }
    }
    
    // Log any remaining unassigned matches
    if (unassignedMatches.length > 0) {
      console.log(`Could not assign ${unassignedMatches.length} matches due to constraints`);
    }

    // Build final matches array with mat numbers and match orders
    const matchesToInsert: {
      meet_id: string;
      wrestler_a_id: string;
      wrestler_b_id: string;
      mat_number: number;
      match_order: number;
      status: string;
    }[] = [];

    for (let matIndex = 0; matIndex < matCount; matIndex++) {
      const matNumber = matIndex + 1;
      const matMatches = matQueues[matIndex];
      
      for (let orderIndex = 0; orderIndex < matMatches.length; orderIndex++) {
        const match = matMatches[orderIndex];
        // Match number format: mat*100 + order (e.g., 100, 101, 102 for mat 1)
        const matchOrder = (matNumber * 100) + orderIndex;
        
        matchesToInsert.push({
          meet_id,
          wrestler_a_id: match.wrestler_a_id,
          wrestler_b_id: match.wrestler_b_id,
          mat_number: matNumber,
          match_order: matchOrder,
          status: 'pending',
        });
      }
    }

    console.log(`Inserting ${matchesToInsert.length} matches across ${matCount} mats`);
    console.log(`Matches per mat: ${matQueues.map((q, i) => `Mat ${i + 1}: ${q.length}`).join(', ')}`);

    // Insert matches
    if (matchesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('matches')
        .insert(matchesToInsert);

      if (insertError) {
        console.error('Error inserting matches:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save matches' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        matches_created: matchesToInsert.length,
        wrestlers_paired: Object.keys(matchCounts).filter(id => matchCounts[id] > 0).length,
        matches_per_mat: matQueues.map((q, i) => ({ mat: i + 1, count: q.length })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in generate-pairings:', err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  type Wrestler,
  type TeamSettings,
  type MatRule,
  type MatchAssignment,
  getPairingKey,
  calculateMatchScore,
  getWrestlerPairingPriority,
  matchFitsMatPreference,
  runLocalSearchSwap,
  buildDiagnostics,
} from '../_shared/pairingAlgorithm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { meet_id, host_team_id, incremental = false } = await req.json();

    if (!meet_id || !host_team_id) {
      return new Response(
        JSON.stringify({ error: 'Missing meet_id or host_team_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating pairings for meet ${meet_id}, incremental=${incremental}`);

    // Mat count will be determined by mat rules (set later after fetching rules)

    // First check for meet-specific rules
    const { data: meetRulesData } = await supabase
      .from('meet_rules')
      .select('match_priority_age, match_priority_weight, match_priority_experience, match_priority_skill, max_age_diff, max_weight_diff, max_matches_per_wrestler, teammates_can_wrestle, conflict_min_gap, prefer_cross_team_matches')
      .eq('meet_id', meet_id)
      .maybeSingle();

    let settings: TeamSettings;

    if (meetRulesData) {
      // Use meet-specific rules, falling back to team defaults for nullable override columns
      const { data: teamSettingsForFallback } = await supabase
        .from('teams')
        .select('max_weight_diff, prefer_cross_team_matches')
        .eq('id', host_team_id)
        .single();

      settings = {
        ...meetRulesData,
        max_weight_diff: meetRulesData.max_weight_diff ?? teamSettingsForFallback?.max_weight_diff ?? null,
        prefer_cross_team_matches: meetRulesData.prefer_cross_team_matches ?? teamSettingsForFallback?.prefer_cross_team_matches ?? false,
      };
      console.log('Using meet-specific rules:', settings);
    } else {
      // Fall back to host team settings
      const { data: teamSettings, error: settingsError } = await supabase
        .from('teams')
        .select('match_priority_age, match_priority_weight, match_priority_experience, match_priority_skill, max_age_diff, max_weight_diff, max_matches_per_wrestler, teammates_can_wrestle, conflict_min_gap, prefer_cross_team_matches')
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

    // In incremental mode: keep existing matches, only pair wrestlers with 0 current matches
    // In full mode: delete all existing matches and re-pair everyone
    if (!incremental) {
      await supabase
        .from('matches')
        .delete()
        .eq('meet_id', meet_id);
    }

    // For incremental mode: fetch existing matches to seed state
    const existingMatchCountsMap: Record<string, number> = {};
    const existingUsedPairings = new Set<string>();
    const existingMaxOrderByMat: Record<number, number> = {};

    if (incremental) {
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('wrestler_a_id, wrestler_b_id, mat_number, match_order')
        .eq('meet_id', meet_id);

      if (existingMatches) {
        for (const m of existingMatches) {
          // Seed match counts
          existingMatchCountsMap[m.wrestler_a_id] = (existingMatchCountsMap[m.wrestler_a_id] || 0) + 1;
          existingMatchCountsMap[m.wrestler_b_id] = (existingMatchCountsMap[m.wrestler_b_id] || 0) + 1;
          // Seed used pairings to prevent re-matching same pair
          const key = [m.wrestler_a_id, m.wrestler_b_id].sort().join('-');
          existingUsedPairings.add(key);
          // Track max match_order per mat to avoid collision (Fix 8 scope addition)
          const mat = m.mat_number ?? 0;
          if (m.match_order !== null) {
            existingMaxOrderByMat[mat] = Math.max(existingMaxOrderByMat[mat] ?? -1, m.match_order);
          }
        }
      }
      console.log('Incremental: seeded', Object.keys(existingMatchCountsMap).length, 'existing wrestler counts');
    }

    // Thin closure wrappers so callers in this handler can omit the extra params
    const matchScore = (w1: Wrestler, w2: Wrestler) =>
      calculateMatchScore(w1, w2, settings, attendanceStatusMap);

    const pairingPriority = (id: string) =>
      getWrestlerPairingPriority(id, attendanceStatusMap);

    const matPreference = (match: MatchAssignment, matIndex: number) =>
      matchFitsMatPreference(match, matIndex, matRules);

    // Generate all possible pairings with scores
    const pairings: { w1: Wrestler; w2: Wrestler; score: number }[] = [];
    
    for (let i = 0; i < wrestlers.length; i++) {
      for (let j = i + 1; j < wrestlers.length; j++) {
        const score = matchScore(wrestlers[i], wrestlers[j]);
        if (score < Infinity) {
          pairings.push({ w1: wrestlers[i], w2: wrestlers[j], score });
        }
      }
    }

    // Sort by score (best matches first)
    pairings.sort((a, b) => a.score - b.score);

    // BALANCED DISTRIBUTION: Round-robin approach
    // Give everyone 1 match before anyone gets 2, etc.
    // ATTENDANCE-AWARE: Prioritize leaving_early wrestlers in pairing phase
    const matchCounts: Record<string, number> = {};
    wrestlers.forEach(w => {
      // In incremental mode, seed with existing counts
      matchCounts[w.id] = incremental ? (existingMatchCountsMap[w.id] || 0) : 0;
    });

    // Track which pairings have been used
    const usedPairings = new Set<string>(incremental ? existingUsedPairings : []);

    // In incremental mode, only pair wrestlers who currently have 0 matches
    const wrestlersToMatch = incremental
      ? wrestlers.filter(w => (existingMatchCountsMap[w.id] || 0) === 0)
      : wrestlers;

    if (incremental && wrestlersToMatch.length === 0) {
      return new Response(
        JSON.stringify({ success: true, matches_created: 0, unassigned_count: 0, wrestlers_with_zero_matches: [], incremental: true, message: 'All attending wrestlers already have matches' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Incremental mode: ${wrestlersToMatch.length} wrestlers to match (out of ${wrestlers.length})`);

    // Track available pairings for each wrestler (count of unused valid pairings)
    // Must be computed AFTER usedPairings is seeded so scarcity sort is accurate
    const availablePairingsCount: Record<string, number> = {};
    wrestlers.forEach(w => availablePairingsCount[w.id] = 0);
    for (const p of pairings) {
      if (!usedPairings.has(getPairingKey(p.w1.id, p.w2.id))) {
        availablePairingsCount[p.w1.id]++;
        availablePairingsCount[p.w2.id]++;
      }
    }

    const selectedMatches: MatchAssignment[] = [];

    // Round-robin: iterate through match count levels (0, 1, 2, 3...)
    for (let targetCount = 0; targetCount < settings.max_matches_per_wrestler; targetCount++) {
      // Find all wrestlers currently at this count level
      // In incremental mode, only process wrestlers that started with 0 matches
      let wrestlersAtLevel = wrestlersToMatch
        .filter(w => matchCounts[w.id] === targetCount)
        .map(w => w.id);

      // Sort by: 1) attendance priority (leaving_early first), 2) available pairings (fewest first)
      wrestlersAtLevel.sort((a, b) => {
        const priorityA = pairingPriority(a);
        const priorityB = pairingPriority(b);
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

    // --- LOCAL SEARCH SWAP IMPROVEMENT (Fix 1) ---
    // Delegate to shared pure function; splice result back into the array reference.
    const swappedMatches = runLocalSearchSwap(selectedMatches, settings, attendanceStatusMap);
    selectedMatches.splice(0, selectedMatches.length, ...swappedMatches);
    console.log(`Local search swap: complete`);

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
        if (requirePreference && !matPreference(match, matIndex)) {
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

      // In incremental mode, offset new match_order values past the existing maximum
      // to avoid collision with already-existing matches on this mat.
      // existingMaxOrderByMat stores raw match_order values (e.g. 105 = mat 1, order 5).
      // The within-mat offset is (existingMax % 100) + 1.
      const existingMax = existingMaxOrderByMat[matNumber];
      const orderOffset = incremental && existingMax !== undefined
        ? (existingMax % 100) + 1
        : 0;

      for (let orderIndex = 0; orderIndex < matMatches.length; orderIndex++) {
        const match = matMatches[orderIndex];
        // Match number format: mat*100 + order (e.g., 100, 101, 102 for mat 1)
        const matchOrder = (matNumber * 100) + orderOffset + orderIndex;
        
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

    // Insert matches (request IDs back for incremental "New" badge tracking)
    let newMatchIds: string[] = [];
    if (matchesToInsert.length > 0) {
      const { data: insertedMatches, error: insertError } = await supabase
        .from('matches')
        .insert(matchesToInsert)
        .select('id');

      if (insertError) {
        console.error('Error inserting matches:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save matches' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      newMatchIds = insertedMatches?.map(m => m.id) ?? [];
    }

    // Build diagnostics: wrestlers with 0 assigned matches (Fix 6)
    const wrestlersWithZeroMatches = buildDiagnostics(wrestlers, selectedMatches, matchesToInsert);
    const wrestlersPaired = wrestlers.length - wrestlersWithZeroMatches.length;

    if (wrestlersWithZeroMatches.length > 0) {
      console.log('Wrestlers with 0 matches:', wrestlersWithZeroMatches);
    }

    return new Response(
      JSON.stringify({
        success: true,
        matches_created: matchesToInsert.length,
        wrestlers_paired: wrestlersPaired,
        matches_per_mat: matQueues.map((q, i) => ({ mat: i + 1, count: q.length })),
        unassigned_count: wrestlersWithZeroMatches.length,
        wrestlers_with_zero_matches: wrestlersWithZeroMatches,
        incremental,
        // IDs of newly inserted matches, used by the frontend to show "New" badges
        new_match_ids: incremental ? newMatchIds : [],
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

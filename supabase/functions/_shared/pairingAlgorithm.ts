// Shared types and pure algorithm functions for generate-pairings.
// Exported so they can be unit-tested via `deno test`.

export interface Wrestler {
  id: string;
  first_name: string;
  last_name: string;
  weight: number;
  date_of_birth: string;
  experience: number;
  skill: number;
  team_id: string;
}

export interface TeamSettings {
  match_priority_age: number;
  match_priority_weight: number;
  match_priority_experience: number;
  match_priority_skill: number;
  max_age_diff: number;
  max_weight_diff: number | null;
  max_matches_per_wrestler: number;
  teammates_can_wrestle: boolean;
  conflict_min_gap: number;
  prefer_cross_team_matches: boolean;
}

export interface MatRule {
  mat_number: number;
  min_age: number;
  max_age: number;
  min_experience: number;
  max_experience: number;
  min_skill: number;
  max_skill: number;
  max_matches: number;
}

export interface MatchAssignment {
  wrestler_a_id: string;
  wrestler_b_id: string;
  wrestler_a: Wrestler;
  wrestler_b: Wrestler;
  avg_skill: number;
  avg_experience: number;
  attendance_a: string;
  attendance_b: string;
}

export interface ZeroMatchWrestler {
  id: string;
  name: string;
  reason: 'no_compatible_opponent' | 'rest_gap_conflict';
}

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

/** Calculate age in full years from an ISO date string (YYYY-MM-DD). */
export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/** Create a canonical, order-independent key for a wrestler pair. */
export const getPairingKey = (w1Id: string, w2Id: string): string =>
  [w1Id, w2Id].sort().join('-');

/**
 * Calculate match score for a pair (lower = better match).
 * Returns Infinity for ineligible pairs (hard constraints violated).
 */
export const calculateMatchScore = (
  w1: Wrestler,
  w2: Wrestler,
  settings: TeamSettings,
  attendanceStatusMap: Record<string, string>,
): number => {
  if (!settings.teammates_can_wrestle && w1.team_id === w2.team_id) {
    return Infinity;
  }

  const age1 = calculateAge(w1.date_of_birth);
  const age2 = calculateAge(w2.date_of_birth);
  const ageDiff = Math.abs(age1 - age2);

  if (ageDiff > settings.max_age_diff) {
    return Infinity;
  }

  const weightDiff = Math.abs(w1.weight - w2.weight);

  // Hard cap on weight difference (Fix 4)
  if (settings.max_weight_diff !== null && weightDiff > settings.max_weight_diff) {
    return Infinity;
  }

  const experienceDiff = Math.abs(w1.experience - w2.experience);
  const skillDiff = Math.abs(w1.skill - w2.skill);

  // Lower priority number = more important → invert to get weight
  const ageWeight = (5 - settings.match_priority_age) * 10;
  const weightWeight = (5 - settings.match_priority_weight) * 10;
  const experienceWeight = (5 - settings.match_priority_experience) * 10;
  const skillWeight = (5 - settings.match_priority_skill) * 10;

  // Soft penalty for same-team pairings when cross-team is preferred (Fix 7)
  const sameTeamPenalty =
    settings.prefer_cross_team_matches && w1.team_id === w2.team_id ? 20 : 0;

  // Penalty for leaving_early × arriving_late pairs (Fix 2)
  const statusA = attendanceStatusMap[w1.id] || 'attending';
  const statusB = attendanceStatusMap[w2.id] || 'attending';
  const attendancePenalty =
    (statusA === 'leaving_early' && statusB === 'arriving_late') ||
    (statusA === 'arriving_late' && statusB === 'leaving_early')
      ? 200
      : 0;

  return (
    ageDiff * ageWeight +
    weightDiff * weightWeight +
    experienceDiff * experienceWeight +
    skillDiff * skillWeight +
    sameTeamPenalty +
    attendancePenalty
  );
};

/**
 * Get Phase-2 pairing priority for a wrestler (lower = process first).
 * leaving_early wrestlers are prioritised so they land in early schedule slots.
 */
export const getWrestlerPairingPriority = (
  wrestlerId: string,
  attendanceStatusMap: Record<string, string>,
): number => {
  const status = attendanceStatusMap[wrestlerId];
  if (status === 'leaving_early') return 0;
  if (status === 'arriving_late') return 1;
  return 2;
};

/**
 * Check whether both wrestlers in a match individually satisfy the mat's
 * age / experience / skill ranges (Fix 3 — individual check, not average).
 * Returns true when no mat rule exists for the given matIndex.
 */
export const matchFitsMatPreference = (
  match: MatchAssignment,
  matIndex: number,
  matRules: MatRule[],
): boolean => {
  const rule = matRules.find((r) => r.mat_number === matIndex + 1);
  if (!rule) return true;

  const age1 = calculateAge(match.wrestler_a.date_of_birth);
  const age2 = calculateAge(match.wrestler_b.date_of_birth);

  if (age1 < rule.min_age || age1 > rule.max_age) return false;
  if (age2 < rule.min_age || age2 > rule.max_age) return false;
  if (
    match.wrestler_a.experience < rule.min_experience ||
    match.wrestler_a.experience > rule.max_experience
  ) return false;
  if (
    match.wrestler_b.experience < rule.min_experience ||
    match.wrestler_b.experience > rule.max_experience
  ) return false;
  if (match.wrestler_a.skill < rule.min_skill || match.wrestler_a.skill > rule.max_skill)
    return false;
  if (match.wrestler_b.skill < rule.min_skill || match.wrestler_b.skill > rule.max_skill)
    return false;

  return true;
};

/**
 * Run local search swap improvement on a set of selected matches (Fix 1).
 * Checks all pairs and swaps opponents when the swap reduces the combined score.
 * Returns a new array (non-mutating). Stops after `maxPasses` iterations with
 * no improvement (default 10).
 */
export const runLocalSearchSwap = (
  matches: MatchAssignment[],
  settings: TeamSettings,
  attendanceStatusMap: Record<string, string>,
  maxPasses = 10,
): MatchAssignment[] => {
  const result = [...matches];

  const score = (w1: Wrestler, w2: Wrestler) =>
    calculateMatchScore(w1, w2, settings, attendanceStatusMap);

  let improved = true;
  let passes = 0;

  while (improved && passes < maxPasses) {
    improved = false;
    passes++;

    // Build a set of all current pairing keys so we can detect duplicates.
    // When checking swaps for matches i and j, we exclude their own keys since
    // those positions are being replaced.
    const allKeys = new Set<string>(
      result.map((m) => getPairingKey(m.wrestler_a_id, m.wrestler_b_id)),
    );

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const matchA = result[i]; // A vs B
        const matchB = result[j]; // C vs D

        const wA = matchA.wrestler_a;
        const wB = matchA.wrestler_b;
        const wC = matchB.wrestler_a;
        const wD = matchB.wrestler_b;

        const currentScore = score(wA, wB) + score(wC, wD);

        // Keys being vacated when we swap these two matches
        const keyAB = getPairingKey(wA.id, wB.id);
        const keyCD = getPairingKey(wC.id, wD.id);

        // Try swap: A vs D, C vs B
        // Guards:
        //   1. No self-match (wrestler paired with themselves)
        //   2. Same wrestler can't appear in both resulting matches (wA≠wC, wB≠wD)
        //   3. New pair doesn't duplicate an existing pair elsewhere in result
        const keyAD = getPairingKey(wA.id, wD.id);
        const keyCB = getPairingKey(wC.id, wB.id);
        const swap1Valid =
          wA.id !== wD.id && wC.id !== wB.id && // no self-matches
          wA.id !== wC.id && wB.id !== wD.id && // no wrestler in both results
          (keyAD === keyAB || keyAD === keyCD || !allKeys.has(keyAD)) &&
          (keyCB === keyAB || keyCB === keyCD || !allKeys.has(keyCB));
        if (swap1Valid) {
          const s1AD = score(wA, wD);
          const s1CB = score(wC, wB);
          if (s1AD < Infinity && s1CB < Infinity && s1AD + s1CB < currentScore) {
            allKeys.delete(keyAB);
            allKeys.delete(keyCD);
            allKeys.add(keyAD);
            allKeys.add(keyCB);
            result[i] = {
              wrestler_a_id: wA.id,
              wrestler_b_id: wD.id,
              wrestler_a: wA,
              wrestler_b: wD,
              avg_skill: (wA.skill + wD.skill) / 2,
              avg_experience: (wA.experience + wD.experience) / 2,
              attendance_a: attendanceStatusMap[wA.id] || 'attending',
              attendance_b: attendanceStatusMap[wD.id] || 'attending',
            };
            result[j] = {
              wrestler_a_id: wC.id,
              wrestler_b_id: wB.id,
              wrestler_a: wC,
              wrestler_b: wB,
              avg_skill: (wC.skill + wB.skill) / 2,
              avg_experience: (wC.experience + wB.experience) / 2,
              attendance_a: attendanceStatusMap[wC.id] || 'attending',
              attendance_b: attendanceStatusMap[wB.id] || 'attending',
            };
            improved = true;
            continue;
          }
        }

        // Try swap: A vs C, B vs D
        // Guards: same logic (note: wA≠wC and wB≠wD are already the self-match checks for swap 2)
        const keyAC = getPairingKey(wA.id, wC.id);
        const keyBD = getPairingKey(wB.id, wD.id);
        const swap2Valid =
          wA.id !== wC.id && wB.id !== wD.id && // no self-matches
          (keyAC === keyAB || keyAC === keyCD || !allKeys.has(keyAC)) &&
          (keyBD === keyAB || keyBD === keyCD || !allKeys.has(keyBD));
        if (swap2Valid) {
          const s2AC = score(wA, wC);
          const s2BD = score(wB, wD);
          if (s2AC < Infinity && s2BD < Infinity && s2AC + s2BD < currentScore) {
            allKeys.delete(keyAB);
            allKeys.delete(keyCD);
            allKeys.add(keyAC);
            allKeys.add(keyBD);
            result[i] = {
              wrestler_a_id: wA.id,
              wrestler_b_id: wC.id,
              wrestler_a: wA,
              wrestler_b: wC,
              avg_skill: (wA.skill + wC.skill) / 2,
              avg_experience: (wA.experience + wC.experience) / 2,
              attendance_a: attendanceStatusMap[wA.id] || 'attending',
              attendance_b: attendanceStatusMap[wC.id] || 'attending',
            };
            result[j] = {
              wrestler_a_id: wB.id,
              wrestler_b_id: wD.id,
              wrestler_a: wB,
              wrestler_b: wD,
              avg_skill: (wB.skill + wD.skill) / 2,
              avg_experience: (wB.experience + wD.experience) / 2,
              attendance_a: attendanceStatusMap[wB.id] || 'attending',
              attendance_b: attendanceStatusMap[wD.id] || 'attending',
            };
            improved = true;
          }
        }
      }
    }
  }

  return result;
};

/**
 * Build the list of wrestlers who received zero assigned matches, with
 * reason codes distinguishing Phase-2 dropouts from Phase-3 dropouts (Fix 6).
 *
 * - `no_compatible_opponent` — wrestler never appeared in Phase-2 selectedMatches
 * - `rest_gap_conflict`      — was paired in Phase 2 but could not be placed on any
 *                              mat without violating the rest-gap constraint
 */
export const buildDiagnostics = (
  wrestlers: Wrestler[],
  selectedMatches: MatchAssignment[],
  matchesToInsert: { wrestler_a_id: string; wrestler_b_id: string }[],
): ZeroMatchWrestler[] => {
  const phase2MatchedIds = new Set<string>();
  selectedMatches.forEach((m) => {
    phase2MatchedIds.add(m.wrestler_a_id);
    phase2MatchedIds.add(m.wrestler_b_id);
  });

  const assignedWrestlerIds = new Set<string>();
  matchesToInsert.forEach((m) => {
    assignedWrestlerIds.add(m.wrestler_a_id);
    assignedWrestlerIds.add(m.wrestler_b_id);
  });

  return wrestlers
    .filter((w) => !assignedWrestlerIds.has(w.id))
    .map((w) => ({
      id: w.id,
      name: `${w.first_name} ${w.last_name}`,
      reason: phase2MatchedIds.has(w.id) ? 'rest_gap_conflict' : 'no_compatible_opponent',
    }));
};

import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  getPairingKey,
  calculateMatchScore,
  getWrestlerPairingPriority,
  matchFitsMatPreference,
  runLocalSearchSwap,
  buildDiagnostics,
  type Wrestler,
  type TeamSettings,
  type MatRule,
  type MatchAssignment,
} from '../../../supabase/functions/_shared/pairingAlgorithm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: TeamSettings = {
  match_priority_age: 1,
  match_priority_weight: 2,
  match_priority_experience: 3,
  match_priority_skill: 4,
  max_age_diff: 5,
  max_weight_diff: null,
  max_matches_per_wrestler: 4,
  teammates_can_wrestle: true,
  conflict_min_gap: 7,
  prefer_cross_team_matches: false,
};

const makeWrestler = (overrides: Partial<Wrestler> & { id: string }): Wrestler => ({
  first_name: 'Test',
  last_name: 'Wrestler',
  weight: 135,
  date_of_birth: '2000-01-01', // age ~26 — stable regardless of test run date
  experience: 2,
  skill: 2,
  team_id: 'team-1',
  ...overrides,
});

const makeMatch = (wa: Wrestler, wb: Wrestler, statusA = 'attending', statusB = 'attending'): MatchAssignment => ({
  wrestler_a_id: wa.id,
  wrestler_b_id: wb.id,
  wrestler_a: wa,
  wrestler_b: wb,
  avg_skill: (wa.skill + wb.skill) / 2,
  avg_experience: (wa.experience + wb.experience) / 2,
  attendance_a: statusA,
  attendance_b: statusB,
});

// ---------------------------------------------------------------------------
// calculateAge
// ---------------------------------------------------------------------------

describe('calculateAge', () => {
  it('returns approximate age from dob string', () => {
    const age = calculateAge('1995-06-15');
    expect(age).toBeGreaterThanOrEqual(30);
  });
});

// ---------------------------------------------------------------------------
// getPairingKey
// ---------------------------------------------------------------------------

describe('getPairingKey', () => {
  it('is order-independent', () => {
    expect(getPairingKey('b', 'a')).toBe(getPairingKey('a', 'b'));
  });

  it('different pairs produce different keys', () => {
    expect(getPairingKey('a', 'b')).not.toBe(getPairingKey('a', 'c'));
  });
});

// ---------------------------------------------------------------------------
// getWrestlerPairingPriority (Fix 2)
// ---------------------------------------------------------------------------

describe('getWrestlerPairingPriority (Fix 2)', () => {
  it('leaving_early → 0 (highest priority)', () => {
    expect(getWrestlerPairingPriority('w1', { w1: 'leaving_early' })).toBe(0);
  });

  it('arriving_late → 1', () => {
    expect(getWrestlerPairingPriority('w1', { w1: 'arriving_late' })).toBe(1);
  });

  it('attending → 2 (lowest priority)', () => {
    expect(getWrestlerPairingPriority('w1', { w1: 'attending' })).toBe(2);
  });

  it('unknown status → 2', () => {
    expect(getWrestlerPairingPriority('w1', {})).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// calculateMatchScore
// ---------------------------------------------------------------------------

describe('calculateMatchScore', () => {
  const w1 = makeWrestler({ id: 'w1', weight: 135, date_of_birth: '2000-01-01', team_id: 'team-1' });
  const w2 = makeWrestler({ id: 'w2', weight: 138, date_of_birth: '2000-06-01', team_id: 'team-2' });

  it('compatible pair returns finite non-negative score', () => {
    const score = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, {});
    expect(score).toBeLessThan(Infinity);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('teammates_can_wrestle=false, same team → Infinity', () => {
    const settings = { ...DEFAULT_SETTINGS, teammates_can_wrestle: false };
    const sameTeamW2 = makeWrestler({ id: 'w2', team_id: 'team-1' });
    expect(calculateMatchScore(w1, sameTeamW2, settings, {})).toBe(Infinity);
  });

  it('age diff > max_age_diff → Infinity', () => {
    const settings = { ...DEFAULT_SETTINGS, max_age_diff: 1 };
    const wOld = makeWrestler({ id: 'wold', date_of_birth: '1990-01-01' }); // age ~36 vs ~26
    expect(calculateMatchScore(w1, wOld, settings, {})).toBe(Infinity);
  });

  describe('Fix 4: max_weight_diff hard cap', () => {
    it('weight diff > max_weight_diff → Infinity', () => {
      const settings = { ...DEFAULT_SETTINGS, max_weight_diff: 20 };
      const wHeavy = makeWrestler({ id: 'wheavy', weight: 200, date_of_birth: '2000-01-01' }); // diff 65
      expect(calculateMatchScore(w1, wHeavy, settings, {})).toBe(Infinity);
    });

    it('weight diff exactly at max_weight_diff → finite score', () => {
      const settings = { ...DEFAULT_SETTINGS, max_weight_diff: 20 };
      const wClose = makeWrestler({ id: 'wclose', weight: 155, date_of_birth: '2000-01-01' }); // diff 20
      expect(calculateMatchScore(w1, wClose, settings, {})).toBeLessThan(Infinity);
    });

    it('max_weight_diff=null → no cap, large weight diff is finite', () => {
      const settings = { ...DEFAULT_SETTINGS, max_weight_diff: null, max_age_diff: 100 };
      const wVeryHeavy = makeWrestler({ id: 'wvh', weight: 300, date_of_birth: '2000-01-01' });
      expect(calculateMatchScore(w1, wVeryHeavy, settings, {})).toBeLessThan(Infinity);
    });
  });

  describe('Fix 2: attendance penalties', () => {
    it('leaving_early × arriving_late → +200 penalty', () => {
      const map = { w1: 'leaving_early', w2: 'arriving_late' };
      const baseMap = { w1: 'attending', w2: 'attending' };
      const penalised = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, map);
      const baseline = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, baseMap);
      expect(penalised).toBeLessThan(Infinity);
      expect(penalised - baseline).toBe(200);
    });

    it('arriving_late × leaving_early → +200 penalty (symmetric)', () => {
      const map = { w1: 'arriving_late', w2: 'leaving_early' };
      const baseMap = { w1: 'attending', w2: 'attending' };
      const penalised = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, map);
      const baseline = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, baseMap);
      expect(penalised - baseline).toBe(200);
    });

    it('leaving_early × leaving_early → no attendance penalty', () => {
      const map = { w1: 'leaving_early', w2: 'leaving_early' };
      const baseMap = { w1: 'attending', w2: 'attending' };
      const penalised = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, map);
      const baseline = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, baseMap);
      expect(penalised - baseline).toBe(0);
    });

    it('arriving_late × attending → no attendance penalty', () => {
      const map = { w1: 'arriving_late', w2: 'attending' };
      const baseMap = { w1: 'attending', w2: 'attending' };
      const penalised = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, map);
      const baseline = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, baseMap);
      expect(penalised - baseline).toBe(0);
    });
  });

  describe('Fix 7: prefer_cross_team_matches', () => {
    it('same team, prefer_cross_team=true → +20 score vs without', () => {
      const sameTeamW2 = makeWrestler({ id: 'w2', team_id: 'team-1', date_of_birth: '2000-06-01' });
      const withCross = { ...DEFAULT_SETTINGS, teammates_can_wrestle: true, prefer_cross_team_matches: true };
      const withoutCross = { ...DEFAULT_SETTINGS, teammates_can_wrestle: true, prefer_cross_team_matches: false };
      const withPenalty = calculateMatchScore(w1, sameTeamW2, withCross, {});
      const withoutPenalty = calculateMatchScore(w1, sameTeamW2, withoutCross, {});
      expect(withPenalty).toBeLessThan(Infinity);
      expect(withPenalty - withoutPenalty).toBe(20);
    });

    it('different teams, prefer_cross_team=true → no extra penalty', () => {
      const crossTeamW2 = makeWrestler({ id: 'w2', team_id: 'team-2', date_of_birth: '2000-06-01' });
      const withCross = { ...DEFAULT_SETTINGS, prefer_cross_team_matches: true };
      const withoutCross = { ...DEFAULT_SETTINGS, prefer_cross_team_matches: false };
      expect(calculateMatchScore(w1, crossTeamW2, withCross, {}) - calculateMatchScore(w1, crossTeamW2, withoutCross, {})).toBe(0);
    });

    it('teammates_can_wrestle=false overrides cross-team pref — same team still Infinity', () => {
      const sameTeamW2 = makeWrestler({ id: 'w2', team_id: 'team-1' });
      const settings = { ...DEFAULT_SETTINGS, teammates_can_wrestle: false, prefer_cross_team_matches: true };
      expect(calculateMatchScore(w1, sameTeamW2, settings, {})).toBe(Infinity);
    });
  });
});

// ---------------------------------------------------------------------------
// matchFitsMatPreference (Fix 3)
// ---------------------------------------------------------------------------

describe('matchFitsMatPreference (Fix 3)', () => {
  const matRules: MatRule[] = [{
    mat_number: 1,
    min_age: 13, max_age: 17,
    min_experience: 0, max_experience: 5,
    min_skill: 0, max_skill: 4,
    max_matches: 20,
  }];

  // Age ~31 in 2026 (born 1995) — clearly outside 13-17
  const wAdult = makeWrestler({ id: 'wadult', date_of_birth: '1995-01-01', experience: 2, skill: 2 });
  // Age ~16 in 2026 (born 2010) — inside 13-17
  const wTeen = makeWrestler({ id: 'wteen', date_of_birth: '2010-01-01', experience: 2, skill: 2 });
  const wTeen2 = makeWrestler({ id: 'wteen2', date_of_birth: '2011-06-01', experience: 2, skill: 2 });

  it('one wrestler outside age range → false (Fix 3: individual check)', () => {
    expect(matchFitsMatPreference(makeMatch(wAdult, wTeen), 0, matRules)).toBe(false);
  });

  it('both wrestlers in range → true', () => {
    expect(matchFitsMatPreference(makeMatch(wTeen, wTeen2), 0, matRules)).toBe(true);
  });

  it('no mat rule for matIndex → true (open mat)', () => {
    expect(matchFitsMatPreference(makeMatch(wAdult, wTeen), 1, matRules)).toBe(true);
  });

  it('empty mat rules → true', () => {
    expect(matchFitsMatPreference(makeMatch(wAdult, wTeen), 0, [])).toBe(true);
  });

  it('wrestler outside experience range → false', () => {
    const wHighExp = makeWrestler({ id: 'whighexp', date_of_birth: '2010-01-01', experience: 5, skill: 2 });
    const rules: MatRule[] = [{ ...matRules[0], max_experience: 3 }];
    expect(matchFitsMatPreference(makeMatch(wTeen, wHighExp), 0, rules)).toBe(false);
  });

  it('wrestler outside skill range → false', () => {
    const wHighSkill = makeWrestler({ id: 'whighskill', date_of_birth: '2010-01-01', experience: 2, skill: 4 });
    const rules: MatRule[] = [{ ...matRules[0], max_skill: 3 }];
    expect(matchFitsMatPreference(makeMatch(wTeen, wHighSkill), 0, rules)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// runLocalSearchSwap (Fix 1)
// ---------------------------------------------------------------------------

describe('runLocalSearchSwap (Fix 1)', () => {
  const settings: TeamSettings = { ...DEFAULT_SETTINGS, max_age_diff: 100, max_weight_diff: null };

  it('empty input returns empty array', () => {
    expect(runLocalSearchSwap([], settings, {}).length).toBe(0);
  });

  it('single match returns same pairing unchanged', () => {
    const wA = makeWrestler({ id: 'wA', weight: 135 });
    const wB = makeWrestler({ id: 'wB', weight: 137, team_id: 'team-2' });
    const result = runLocalSearchSwap([makeMatch(wA, wB)], settings, {});
    expect(result.length).toBe(1);
    expect(result[0].wrestler_a_id).toBe(wA.id);
  });

  it('swaps wrestlers when it reduces total score', () => {
    // wA(100) vs wB(150) and wC(105) vs wD(145) → total weight diff 90
    // After swap A↔C, B↔D: wA(100) vs wC(105) and wB(150) vs wD(145) → total diff 10
    const wA = makeWrestler({ id: 'wA', weight: 100, date_of_birth: '2000-01-01', team_id: 'team-1' });
    const wB = makeWrestler({ id: 'wB', weight: 150, date_of_birth: '2000-01-01', team_id: 'team-2' });
    const wC = makeWrestler({ id: 'wC', weight: 105, date_of_birth: '2000-01-01', team_id: 'team-1' });
    const wD = makeWrestler({ id: 'wD', weight: 145, date_of_birth: '2000-01-01', team_id: 'team-2' });

    const result = runLocalSearchSwap([makeMatch(wA, wB), makeMatch(wC, wD)], settings, {});
    const pairings = result.map(m => [m.wrestler_a_id, m.wrestler_b_id].sort().join('-')).sort();
    expect(pairings).toContain([wA.id, wC.id].sort().join('-'));
    expect(pairings).toContain([wB.id, wD.id].sort().join('-'));
  });

  it('already-optimal matches are not swapped', () => {
    const wA = makeWrestler({ id: 'wA', weight: 100 });
    const wB = makeWrestler({ id: 'wB', weight: 150 });
    const wC = makeWrestler({ id: 'wC', weight: 102 });
    const wD = makeWrestler({ id: 'wD', weight: 152 });
    const result = runLocalSearchSwap([makeMatch(wA, wC), makeMatch(wB, wD)], settings, {});
    expect(result[0].wrestler_a_id).toBe(wA.id);
    expect(result[0].wrestler_b_id).toBe(wC.id);
  });

  it('original array is not mutated', () => {
    const wA = makeWrestler({ id: 'wA', weight: 100 });
    const wB = makeWrestler({ id: 'wB', weight: 150, team_id: 'team-2' });
    const wC = makeWrestler({ id: 'wC', weight: 105, team_id: 'team-1' });
    const wD = makeWrestler({ id: 'wD', weight: 145, team_id: 'team-2' });
    const matches = [makeMatch(wA, wB), makeMatch(wC, wD)];
    const origBId = matches[0].wrestler_b_id;
    runLocalSearchSwap(matches, settings, {});
    expect(matches[0].wrestler_b_id).toBe(origBId); // original untouched
  });

  it('never creates a self-match when a wrestler appears in multiple rounds', () => {
    // wA appears in both match[0] and match[1] — swap could naively create wA vs wA
    const wA = makeWrestler({ id: 'wA', weight: 100, team_id: 'team-1' });
    const wB = makeWrestler({ id: 'wB', weight: 102, team_id: 'team-2' });
    const wC = makeWrestler({ id: 'wC', weight: 101, team_id: 'team-2' });
    // match[0]: wA vs wB, match[1]: wC vs wA (wA in both)
    const matches = [makeMatch(wA, wB), makeMatch(wC, wA)];
    const result = runLocalSearchSwap(matches, settings, {});
    result.forEach((m) => {
      expect(m.wrestler_a_id).not.toBe(m.wrestler_b_id);
    });
  });

  it('never produces duplicate pairs when a wrestler appears in multiple rounds', () => {
    // Phase 2 round-robin can produce wA×wB and wA×wC in separate rounds.
    // A naive swap of [wA×wC] and [wB×wD] could yield wA×wD + wB×wC,
    // but if wA×wB already exists the swap must not recreate it.
    const wA = makeWrestler({ id: 'wA', weight: 100, team_id: 'team-1' });
    const wB = makeWrestler({ id: 'wB', weight: 101, team_id: 'team-2' });
    const wC = makeWrestler({ id: 'wC', weight: 102, team_id: 'team-2' });
    const wD = makeWrestler({ id: 'wD', weight: 103, team_id: 'team-1' });
    // Round 0: wA×wB (best cross-team pair), wC×wD
    // Round 1: wA×wC, wB×wD — a swap that reverses to wA×wB+wC×wD would be a duplicate
    const matches = [makeMatch(wA, wB), makeMatch(wC, wD), makeMatch(wA, wC), makeMatch(wB, wD)];
    const result = runLocalSearchSwap(matches, settings, {});
    const pairKeys = result.map((m) => [m.wrestler_a_id, m.wrestler_b_id].sort().join('-'));
    const uniqueKeys = new Set(pairKeys);
    expect(uniqueKeys.size).toBe(result.length); // no duplicate pairs
  });
});

// ---------------------------------------------------------------------------
// buildDiagnostics (Fix 6)
// ---------------------------------------------------------------------------

describe('buildDiagnostics (Fix 6)', () => {
  const wrestlers: Wrestler[] = [
    makeWrestler({ id: 'w1', first_name: 'Alice', last_name: 'Smith' }),
    makeWrestler({ id: 'w2', first_name: 'Bob', last_name: 'Jones' }),
    makeWrestler({ id: 'w3', first_name: 'Carol', last_name: 'White' }),
  ];

  it('wrestler in matchesToInsert → excluded from result', () => {
    const result = buildDiagnostics(
      wrestlers,
      [makeMatch(wrestlers[0], wrestlers[1])],
      [{ wrestler_a_id: 'w1', wrestler_b_id: 'w2' }],
    );
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('w3');
  });

  it('wrestler in selectedMatches but not matchesToInsert → rest_gap_conflict', () => {
    const result = buildDiagnostics(
      wrestlers,
      [makeMatch(wrestlers[0], wrestlers[2])], // w3 in phase 2
      [{ wrestler_a_id: 'w1', wrestler_b_id: 'w2' }], // w3 not inserted
    );
    const w3 = result.find(r => r.id === 'w3');
    expect(w3?.reason).toBe('rest_gap_conflict');
  });

  it('wrestler absent from both → no_compatible_opponent', () => {
    const result = buildDiagnostics(
      wrestlers,
      [makeMatch(wrestlers[0], wrestlers[1])], // w3 never in phase 2
      [{ wrestler_a_id: 'w1', wrestler_b_id: 'w2' }],
    );
    const w3 = result.find(r => r.id === 'w3');
    expect(w3?.reason).toBe('no_compatible_opponent');
  });

  it('all wrestlers in matchesToInsert → empty result', () => {
    const result = buildDiagnostics(
      wrestlers,
      [],
      [{ wrestler_a_id: 'w1', wrestler_b_id: 'w2' }, { wrestler_a_id: 'w3', wrestler_b_id: 'w1' }],
    );
    expect(result.length).toBe(0);
  });

  it('name field formatted as "first last"', () => {
    const result = buildDiagnostics([wrestlers[0]], [], []);
    expect(result[0].name).toBe('Alice Smith');
  });
});

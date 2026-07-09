import { assertEquals, assert } from 'jsr:@std/assert';
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
} from './pairingAlgorithm.ts';

// ---------------------------------------------------------------------------
// Test helpers
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

/** Build a minimal Wrestler. DOB 2000-01-01 → age ~26 (stable regardless of run date). */
const makeWrestler = (overrides: Partial<Wrestler> & { id: string }): Wrestler => ({
  first_name: 'Test',
  last_name: 'Wrestler',
  weight: 135,
  date_of_birth: '2000-01-01',
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

Deno.test('calculateAge: returns approximate age from dob string', () => {
  // Born in 1995 → age is at least 30
  const age = calculateAge('1995-06-15');
  assert(age >= 30, `Expected age >= 30, got ${age}`);
});

Deno.test('calculateAge: birthday not yet this year gives year-1', () => {
  // Born Dec 31 of a year 10 years ago — birthday hasn't happened yet in any month before Dec
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  tenYearsAgo.setMonth(11); // December
  tenYearsAgo.setDate(31);
  const dob = tenYearsAgo.toISOString().slice(0, 10);
  const age = calculateAge(dob);
  // If today is before Dec 31 of this year, age should be 9; otherwise 10
  const today = new Date();
  const expectedAge = today.getMonth() < 11 || (today.getMonth() === 11 && today.getDate() < 31) ? 9 : 10;
  assertEquals(age, expectedAge);
});

// ---------------------------------------------------------------------------
// getPairingKey
// ---------------------------------------------------------------------------

Deno.test('getPairingKey: order-independent', () => {
  assertEquals(getPairingKey('b', 'a'), getPairingKey('a', 'b'));
});

Deno.test('getPairingKey: different pairs are different', () => {
  assert(getPairingKey('a', 'b') !== getPairingKey('a', 'c'));
});

// ---------------------------------------------------------------------------
// getWrestlerPairingPriority (Fix 2)
// ---------------------------------------------------------------------------

Deno.test('getWrestlerPairingPriority: leaving_early returns 0', () => {
  assertEquals(getWrestlerPairingPriority('w1', { 'w1': 'leaving_early' }), 0);
});

Deno.test('getWrestlerPairingPriority: arriving_late returns 1', () => {
  assertEquals(getWrestlerPairingPriority('w1', { 'w1': 'arriving_late' }), 1);
});

Deno.test('getWrestlerPairingPriority: attending returns 2', () => {
  assertEquals(getWrestlerPairingPriority('w1', { 'w1': 'attending' }), 2);
});

Deno.test('getWrestlerPairingPriority: unknown status returns 2', () => {
  assertEquals(getWrestlerPairingPriority('w1', {}), 2);
});

// ---------------------------------------------------------------------------
// calculateMatchScore (Fix 2 penalty, Fix 4 weight cap, Fix 7 cross-team)
// ---------------------------------------------------------------------------

const w1 = makeWrestler({ id: 'w1', weight: 135, date_of_birth: '2000-01-01', team_id: 'team-1' });
const w2 = makeWrestler({ id: 'w2', weight: 138, date_of_birth: '2000-06-01', team_id: 'team-2' });

Deno.test('calculateMatchScore: compatible pair returns finite score', () => {
  const score = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, {});
  assert(score < Infinity, `Expected finite score, got ${score}`);
  assert(score >= 0, `Expected non-negative score, got ${score}`);
});

Deno.test('calculateMatchScore: teammates_can_wrestle=false, same team → Infinity', () => {
  const settings = { ...DEFAULT_SETTINGS, teammates_can_wrestle: false };
  const sameTeamW2 = makeWrestler({ id: 'w2', team_id: 'team-1' });
  const score = calculateMatchScore(w1, sameTeamW2, settings, {});
  assertEquals(score, Infinity);
});

Deno.test('calculateMatchScore: age diff > max_age_diff → Infinity', () => {
  const settings = { ...DEFAULT_SETTINGS, max_age_diff: 1 };
  // w1 DOB 2000-01-01 → age ~26; w_old DOB 1990-01-01 → age ~36 → diff 10 > 1
  const wOld = makeWrestler({ id: 'wold', date_of_birth: '1990-01-01' });
  const score = calculateMatchScore(w1, wOld, settings, {});
  assertEquals(score, Infinity);
});

// Fix 4: max_weight_diff hard cap
Deno.test('Fix 4: weight diff > max_weight_diff → Infinity', () => {
  const settings = { ...DEFAULT_SETTINGS, max_weight_diff: 20 };
  const wHeavy = makeWrestler({ id: 'wheavy', weight: 200, date_of_birth: '2000-01-01' });
  // 200 - 135 = 65 > 20
  const score = calculateMatchScore(w1, wHeavy, settings, {});
  assertEquals(score, Infinity);
});

Deno.test('Fix 4: weight diff exactly at max_weight_diff → finite score', () => {
  const settings = { ...DEFAULT_SETTINGS, max_weight_diff: 20 };
  const wClose = makeWrestler({ id: 'wclose', weight: 155, date_of_birth: '2000-01-01' });
  // 155 - 135 = 20 = max_weight_diff (not exceeded)
  const score = calculateMatchScore(w1, wClose, settings, {});
  assert(score < Infinity, `Expected finite score at boundary, got ${score}`);
});

Deno.test('Fix 4: max_weight_diff=null → no cap, large weight diff is allowed', () => {
  const settings = { ...DEFAULT_SETTINGS, max_weight_diff: null, max_age_diff: 100 };
  const wVeryHeavy = makeWrestler({ id: 'wvh', weight: 300, date_of_birth: '2000-01-01' });
  const score = calculateMatchScore(w1, wVeryHeavy, settings, {});
  assert(score < Infinity, `Expected finite score with no cap, got ${score}`);
});

// Fix 2: Attendance penalty
Deno.test('Fix 2: leaving_early × arriving_late → +200 penalty', () => {
  const map = { 'w1': 'leaving_early', 'w2': 'arriving_late' };
  const baseMap = { 'w1': 'attending', 'w2': 'attending' };
  const penalised = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, map);
  const baseline = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, baseMap);
  assert(penalised < Infinity);
  assertEquals(penalised - baseline, 200);
});

Deno.test('Fix 2: arriving_late × leaving_early → +200 penalty (symmetric)', () => {
  const map = { 'w1': 'arriving_late', 'w2': 'leaving_early' };
  const baseMap = { 'w1': 'attending', 'w2': 'attending' };
  const penalised = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, map);
  const baseline = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, baseMap);
  assertEquals(penalised - baseline, 200);
});

Deno.test('Fix 2: leaving_early × leaving_early → no attendance penalty', () => {
  const map = { 'w1': 'leaving_early', 'w2': 'leaving_early' };
  const baseMap = { 'w1': 'attending', 'w2': 'attending' };
  const penalised = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, map);
  const baseline = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, baseMap);
  assertEquals(penalised - baseline, 0);
});

Deno.test('Fix 2: arriving_late × attending → no attendance penalty', () => {
  const map = { 'w1': 'arriving_late', 'w2': 'attending' };
  const baseMap = { 'w1': 'attending', 'w2': 'attending' };
  const penalised = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, map);
  const baseline = calculateMatchScore(w1, w2, DEFAULT_SETTINGS, baseMap);
  assertEquals(penalised - baseline, 0);
});

// Fix 7: prefer_cross_team_matches
Deno.test('Fix 7: same team, prefer_cross_team=true → +20 score', () => {
  const sameTeamW2 = makeWrestler({ id: 'w2', team_id: 'team-1', date_of_birth: '2000-06-01' });
  const settingsWithCross = { ...DEFAULT_SETTINGS, teammates_can_wrestle: true, prefer_cross_team_matches: true };
  const settingsWithout = { ...DEFAULT_SETTINGS, teammates_can_wrestle: true, prefer_cross_team_matches: false };
  const withPenalty = calculateMatchScore(w1, sameTeamW2, settingsWithCross, {});
  const withoutPenalty = calculateMatchScore(w1, sameTeamW2, settingsWithout, {});
  assert(withPenalty < Infinity);
  assertEquals(withPenalty - withoutPenalty, 20);
});

Deno.test('Fix 7: different teams, prefer_cross_team=true → no extra penalty', () => {
  const crossTeamW2 = makeWrestler({ id: 'w2', team_id: 'team-2', date_of_birth: '2000-06-01' });
  const settingsWith = { ...DEFAULT_SETTINGS, prefer_cross_team_matches: true };
  const settingsWithout = { ...DEFAULT_SETTINGS, prefer_cross_team_matches: false };
  const withSetting = calculateMatchScore(w1, crossTeamW2, settingsWith, {});
  const withoutSetting = calculateMatchScore(w1, crossTeamW2, settingsWithout, {});
  assertEquals(withSetting - withoutSetting, 0);
});

Deno.test('Fix 7: teammates_can_wrestle=false overrides prefer_cross_team — same team still Infinity', () => {
  const sameTeamW2 = makeWrestler({ id: 'w2', team_id: 'team-1' });
  const settings = { ...DEFAULT_SETTINGS, teammates_can_wrestle: false, prefer_cross_team_matches: true };
  const score = calculateMatchScore(w1, sameTeamW2, settings, {});
  assertEquals(score, Infinity);
});

// ---------------------------------------------------------------------------
// matchFitsMatPreference (Fix 3 — individual check)
// ---------------------------------------------------------------------------

const MAT_RULES_TEEN: MatRule[] = [{
  mat_number: 1,
  min_age: 13,
  max_age: 17,
  min_experience: 0,
  max_experience: 5,
  min_skill: 0,
  max_skill: 4,
  max_matches: 20,
}];

// Wrestler with stable age: born 1995 → age ~31 (clearly > 17, fails max_age)
const wAdult = makeWrestler({ id: 'wadult', date_of_birth: '1995-01-01', experience: 2, skill: 2 });
// Wrestler with stable teen age: born 2010 → age ~16 in 2026 (within 13-17)
const wTeen = makeWrestler({ id: 'wteen', date_of_birth: '2010-01-01', experience: 2, skill: 2 });

Deno.test('Fix 3: one wrestler out of age range → false', () => {
  const match = makeMatch(wAdult, wTeen);
  // wAdult is ~31, outside 13-17
  assertEquals(matchFitsMatPreference(match, 0, MAT_RULES_TEEN), false);
});

Deno.test('Fix 3: both wrestlers in range → true', () => {
  const wTeen2 = makeWrestler({ id: 'wteen2', date_of_birth: '2011-06-01', experience: 2, skill: 2 });
  const match = makeMatch(wTeen, wTeen2);
  assertEquals(matchFitsMatPreference(match, 0, MAT_RULES_TEEN), true);
});

Deno.test('Fix 3: no rule for mat index → true', () => {
  const match = makeMatch(wAdult, wTeen);
  // matIndex=1 but MAT_RULES_TEEN only has mat_number=1 (matIndex=0)
  assertEquals(matchFitsMatPreference(match, 1, MAT_RULES_TEEN), true);
});

Deno.test('Fix 3: empty mat rules → true', () => {
  const match = makeMatch(wAdult, wTeen);
  assertEquals(matchFitsMatPreference(match, 0, []), true);
});

Deno.test('Fix 3: wrestler out of experience range → false', () => {
  const wHighExp = makeWrestler({ id: 'whighexp', date_of_birth: '2010-01-01', experience: 5, skill: 2 });
  const rules: MatRule[] = [{ ...MAT_RULES_TEEN[0], min_experience: 0, max_experience: 3 }];
  const match = makeMatch(wTeen, wHighExp);
  // wHighExp experience=5 > max_experience=3
  assertEquals(matchFitsMatPreference(match, 0, rules), false);
});

// ---------------------------------------------------------------------------
// runLocalSearchSwap (Fix 1)
// ---------------------------------------------------------------------------

Deno.test('Fix 1: empty input returns empty', () => {
  const result = runLocalSearchSwap([], DEFAULT_SETTINGS, {});
  assertEquals(result.length, 0);
});

Deno.test('Fix 1: single match returns same match unchanged', () => {
  const wA = makeWrestler({ id: 'wA', weight: 135, date_of_birth: '2000-01-01', team_id: 'team-1' });
  const wB = makeWrestler({ id: 'wB', weight: 137, date_of_birth: '2000-03-01', team_id: 'team-2' });
  const match = makeMatch(wA, wB);
  const result = runLocalSearchSwap([match], DEFAULT_SETTINGS, {});
  assertEquals(result.length, 1);
  assertEquals(result[0].wrestler_a_id, wA.id);
  assertEquals(result[0].wrestler_b_id, wB.id);
});

Deno.test('Fix 1: suboptimal pairing is improved by swap', () => {
  // Build two matches where swapping wrestlers produces a lower total score.
  // Match 1: wA(135) vs wD(160) → weight diff 25
  // Match 2: wC(155) vs wB(140) → weight diff 15
  // Total = 25 + 15 = 40
  //
  // After swap A↔C (try swap2: A vs C, B vs D):
  // Match 1: wA(135) vs wC(155) → weight diff 20
  // Match 2: wB(140) vs wD(160) → weight diff 20
  // Total = 40 — same, no improvement from this swap
  //
  // Try swap1 (A vs D, C vs B):
  // Match 1: wA(135) vs wD(160) stays  (swap1 = A vs D + C vs B)
  // Actually let me design a clear improvement case:
  //
  // wA(100), wB(150) — match score dominated by weight diff 50
  // wC(105), wD(145) — match score dominated by weight diff 40
  // Current: (wA vs wB) = 50*weight_weight, (wC vs wD) = 40*weight_weight; total = 90*ww
  //
  // Swap1 (A vs D, C vs B):
  // wA(100) vs wD(145) = 45*ww, wC(105) vs wB(150) = 45*ww; total = 90*ww — same
  //
  // Swap2 (A vs C, B vs D):
  // wA(100) vs wC(105) = 5*ww, wB(150) vs wD(145) = 5*ww; total = 10*ww — MUCH better!
  const settings: TeamSettings = {
    ...DEFAULT_SETTINGS,
    max_age_diff: 100, // disable age cap
    max_weight_diff: null,
    teammates_can_wrestle: true,
  };
  const wA = makeWrestler({ id: 'wA', weight: 100, date_of_birth: '2000-01-01', team_id: 'team-1' });
  const wB = makeWrestler({ id: 'wB', weight: 150, date_of_birth: '2000-01-01', team_id: 'team-2' });
  const wC = makeWrestler({ id: 'wC', weight: 105, date_of_birth: '2000-01-01', team_id: 'team-1' });
  const wD = makeWrestler({ id: 'wD', weight: 145, date_of_birth: '2000-01-01', team_id: 'team-2' });

  const match1 = makeMatch(wA, wB); // bad: weight diff 50
  const match2 = makeMatch(wC, wD); // bad: weight diff 40

  const result = runLocalSearchSwap([match1, match2], settings, {});

  // After swap: should be (wA vs wC) and (wB vs wD)
  const pairings = result.map(m => [m.wrestler_a_id, m.wrestler_b_id].sort().join('-')).sort();
  const expectedPairA = [wA.id, wC.id].sort().join('-');
  const expectedPairB = [wB.id, wD.id].sort().join('-');
  assert(
    pairings.includes(expectedPairA) && pairings.includes(expectedPairB),
    `Expected swap to produce ${expectedPairA} and ${expectedPairB}, got ${JSON.stringify(pairings)}`
  );
});

Deno.test('Fix 1: already-optimal matches are not swapped', () => {
  const settings: TeamSettings = { ...DEFAULT_SETTINGS, max_age_diff: 100 };
  // wA(100) vs wC(102) and wB(150) vs wD(152) — already near-optimal
  const wA = makeWrestler({ id: 'wA', weight: 100, date_of_birth: '2000-01-01' });
  const wB = makeWrestler({ id: 'wB', weight: 150, date_of_birth: '2000-01-01' });
  const wC = makeWrestler({ id: 'wC', weight: 102, date_of_birth: '2000-01-01' });
  const wD = makeWrestler({ id: 'wD', weight: 152, date_of_birth: '2000-01-01' });

  const match1 = makeMatch(wA, wC); // diff 2
  const match2 = makeMatch(wB, wD); // diff 2

  const result = runLocalSearchSwap([match1, match2], settings, {});
  // Pairings unchanged
  assertEquals(result[0].wrestler_a_id, wA.id);
  assertEquals(result[0].wrestler_b_id, wC.id);
  assertEquals(result[1].wrestler_a_id, wB.id);
  assertEquals(result[1].wrestler_b_id, wD.id);
});

Deno.test('Fix 1: original array is not mutated', () => {
  const settings: TeamSettings = { ...DEFAULT_SETTINGS, max_age_diff: 100 };
  const wA = makeWrestler({ id: 'wA', weight: 100, date_of_birth: '2000-01-01' });
  const wB = makeWrestler({ id: 'wB', weight: 150, date_of_birth: '2000-01-01' });
  const wC = makeWrestler({ id: 'wC', weight: 105, date_of_birth: '2000-01-01' });
  const wD = makeWrestler({ id: 'wD', weight: 145, date_of_birth: '2000-01-01' });

  const matches = [makeMatch(wA, wB), makeMatch(wC, wD)];
  const originalFirst = matches[0].wrestler_b_id;
  runLocalSearchSwap(matches, settings, {});
  // Original array first element's wrestler_b should still be wB
  assertEquals(matches[0].wrestler_b_id, originalFirst);
});

// ---------------------------------------------------------------------------
// buildDiagnostics (Fix 6)
// ---------------------------------------------------------------------------

const wrestlers: Wrestler[] = [
  makeWrestler({ id: 'w1', first_name: 'Alice', last_name: 'Smith' }),
  makeWrestler({ id: 'w2', first_name: 'Bob', last_name: 'Jones' }),
  makeWrestler({ id: 'w3', first_name: 'Carol', last_name: 'White' }),
];

Deno.test('Fix 6: wrestler in both selectedMatches and matchesToInsert → excluded', () => {
  const selectedMatches = [makeMatch(wrestlers[0], wrestlers[1])];
  const matchesToInsert = [{ wrestler_a_id: 'w1', wrestler_b_id: 'w2' }];
  const result = buildDiagnostics(wrestlers, selectedMatches, matchesToInsert);
  // w3 should be the only unmatched
  assertEquals(result.length, 1);
  assertEquals(result[0].id, 'w3');
});

Deno.test('Fix 6: wrestler in selectedMatches but not matchesToInsert → rest_gap_conflict', () => {
  // w3 was paired in phase 2 (selectedMatches) but did not make it to matchesToInsert
  const selectedMatches = [makeMatch(wrestlers[0], wrestlers[2])];
  const matchesToInsert = [{ wrestler_a_id: 'w1', wrestler_b_id: 'w2' }];
  const result = buildDiagnostics(wrestlers, selectedMatches, matchesToInsert);
  const w3Result = result.find(r => r.id === 'w3');
  assert(w3Result !== undefined, 'w3 should be in the result');
  assertEquals(w3Result!.reason, 'rest_gap_conflict');
});

Deno.test('Fix 6: wrestler absent from both → no_compatible_opponent', () => {
  // w3 never appears in selectedMatches or matchesToInsert
  const selectedMatches = [makeMatch(wrestlers[0], wrestlers[1])];
  const matchesToInsert = [{ wrestler_a_id: 'w1', wrestler_b_id: 'w2' }];
  const result = buildDiagnostics(wrestlers, selectedMatches, matchesToInsert);
  const w3Result = result.find(r => r.id === 'w3');
  assert(w3Result !== undefined);
  assertEquals(w3Result!.reason, 'no_compatible_opponent');
});

Deno.test('Fix 6: all wrestlers matched → empty result', () => {
  const selectedMatches = [makeMatch(wrestlers[0], wrestlers[1])];
  const matchesToInsert = [
    { wrestler_a_id: 'w1', wrestler_b_id: 'w2' },
    { wrestler_a_id: 'w3', wrestler_b_id: 'w1' },
  ];
  const result = buildDiagnostics(wrestlers, selectedMatches, matchesToInsert);
  assertEquals(result.length, 0);
});

Deno.test('Fix 6: name field is formatted correctly', () => {
  const selectedMatches: MatchAssignment[] = [];
  const matchesToInsert: { wrestler_a_id: string; wrestler_b_id: string }[] = [];
  const result = buildDiagnostics([wrestlers[0]], selectedMatches, matchesToInsert);
  assertEquals(result[0].name, 'Alice Smith');
});

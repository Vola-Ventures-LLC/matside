# MatSide Implementation Log

## Pairing Algorithm v2 (Fixes 1–8)

**Completion Date**: 2026-02-20
**Status**: ✅ Implemented

### Overview

Eight algorithm fixes were designed, reviewed (architect + engineer), and implemented to address known weaknesses in the `generate-pairings` Edge Function.

---

### Fix 5: Rename conflict_min_gap label

**Description**: Updated the "Min matches gap between assignments" label to "Minimum matches between bouts" with a corrected tooltip.
**Files Modified**:

- `src/components/meets/MeetRulesSheet.tsx` — label + description updated (line ~499)

---

### Fix 3: Individual mat preference checks

**Description**: Changed `matchFitsMatPreference` from averaging wrestler attributes to requiring both wrestlers individually satisfy the mat's age/experience/skill ranges.
**Files Modified**:

- `supabase/functions/generate-pairings/index.ts` — `matchFitsMatPreference` function

---

### Fix 2: Priority inversion bug

**Description**: Flipped Phase 2 pairing priorities so `leaving_early` wrestlers are processed first. Added +200 score penalty for `leaving_early × arriving_late` pairs.
**Files Modified**:

- `supabase/functions/generate-pairings/index.ts` — `getWrestlerPairingPriority` and `calculateMatchScore`

---

### Fix 4: max_weight_diff hard cap

**Description**: Added optional `max_weight_diff` integer field to `teams` and `meet_rules`. Pairs exceeding this lbs limit get score = Infinity.
**Files Created/Modified**:

- `supabase/functions/generate-pairings/index.ts` — settings interface + score function
- `src/components/meets/MeetRulesSheet.tsx` — new "Max weight difference (lbs)" input
- `src/integrations/supabase/types.ts` — regenerated after migration

**Database**: Migration `add_weight_diff_and_cross_team_settings` — adds `teams.max_weight_diff` (int nullable) and `meet_rules.max_weight_diff` (int nullable)

---

### Fix 7: prefer_cross_team_matches setting

**Description**: Added `prefer_cross_team_matches` boolean to `teams` and `meet_rules`. When true, applies +20 score penalty to same-team pairings. UI toggle only shown when `teammates_can_wrestle = true`.
**Files Created/Modified**:

- `supabase/functions/generate-pairings/index.ts` — settings interface + score function
- `src/components/meets/MeetRulesSheet.tsx` — conditional toggle
- `src/integrations/supabase/types.ts` — regenerated after migration

**Database**: Same migration as Fix 4 — adds `teams.prefer_cross_team_matches` (boolean default false) and `meet_rules.prefer_cross_team_matches` (boolean nullable)

---

### Fix 1: Local search swap improvement

**Description**: After Phase 2 greedy selection, runs O(n²) swap passes to check if exchanging opponents between any two selected matches reduces the total score. Max 10 passes.
**Files Modified**:

- `supabase/functions/generate-pairings/index.ts` — swap loop inserted between Phase 2 and Phase 3

---

### Fix 6: Dropped match diagnostics

**Description**: Three-part fix:

- Part A: Edge Function now returns `unassigned_count` and `wrestlers_with_zero_matches` with per-wrestler reason codes (`no_compatible_opponent` vs `rest_gap_conflict`)
- Part B: New `GenerationReportSheet` component opens automatically after generation if any wrestlers are unmatched
- Part C: Wrestlers with 0 matches get a red/critical flag (distinct from yellow warning for under-matched wrestlers)
  **Files Created/Modified**:
- `supabase/functions/generate-pairings/index.ts` — diagnostics + response payload
- `src/components/meets/GenerationReportSheet.tsx` — new component
- `src/pages/MeetPairings.tsx` — import, state, flag severity logic, sheet render

---

### Fix 8: Incremental generation mode

**Description**: Added `incremental: true` parameter to the Edge Function. In incremental mode: skips DELETE, seeds `matchCounts`/`usedPairings` from existing DB matches, filters to wrestlers with 0 current matches only, and offsets new `match_order` values to avoid collision. Frontend adds "Add new wrestlers (N)" button when matches exist and unmatched wrestlers are present. New matches get a session-local blue "New" badge until page reload.
**Files Modified**:

- `supabase/functions/generate-pairings/index.ts` — `incremental` param handling + match_order offset
- `src/pages/MeetPairings.tsx` — `generateIncrementalPairings`, `newMatchIds` state, "Add new wrestlers" button, "New" badge, "Regenerate" button with destructive confirmation

**Testing Status**: ⚠️ Manual verification recommended (incremental mode requires an existing set of matches)

---

## Pairing Algorithm v2 — Testing & UAT (2026-02-20)

**Status**: ✅ Complete

### Automated tests added

- `supabase/functions/_shared/pairingAlgorithm.ts` — extracted pure functions (calculateMatchScore, runLocalSearchSwap, buildDiagnostics, matchFitsMatPreference, etc.)
- `src/lib/__tests__/pairingAlgorithm.test.ts` — 38 Vitest unit tests covering all 8 fixes
- `src/components/meets/__tests__/GenerationReportSheet.test.tsx` — 13 Vitest component tests (Fix 6 UI)
- `src/pages/__tests__/MeetPairings.flagSeverity.test.ts` — 15 Vitest unit tests (Fix 6 flag logic)
- **Total: 93 passing tests**

### UAT test data inserted (Supabase project acxydgdrrmvhzfhhulat)

- 2 teams: `[TEST] Wildcats` + `[TEST] Thunder`
- 5 meets (Scenarios A–E) with wrestlers and meet_attendance
- Scenario F (incremental mode): manual spec at `tests/e2e/pairing-v2/manual-fix8-incremental.md`

### UAT results (all passing ✅)

| Scenario                      | Fix verified | Result                                                            |
| ----------------------------- | ------------ | ----------------------------------------------------------------- |
| A — Cross-Team Preference     | Fix 7        | 75% cross-team (vs 25% same-team); +20 penalty working            |
| B — Attendance Priority       | Fix 2        | leaving_early first; zero LE×AL conflict pairs                    |
| C — Weight Cap                | Fix 4        | All 9 matches have weight_diff ≤ 20 lbs                           |
| D — Mat Preference Individual | Fix 3        | Mat 1 ages 10–12 only; Mat 2 ages 14–16 only                      |
| E — Diagnostics               | Fix 6        | Kurt Hall = no_compatible_opponent; Iris+Jake = rest_gap_conflict |

### Bugs found and fixed during UAT

1. **Self-match bug** (`runLocalSearchSwap`): With `max_matches_per_wrestler > 1`, a wrestler appearing in two different selectedMatches could be swapped with themselves, producing `wrestler_a_id = wrestler_b_id`. Fixed by adding identity guards before each swap attempt.
2. **Duplicate pair bug** (`runLocalSearchSwap`): Same wrestler appearing in two selectedMatches could be swapped such that round-1 matches were replaced by copies of round-0 matches. Fixed by maintaining a `Set<string>` of all current pairing keys and rejecting swaps that would introduce duplicates.
3. **Test data bug**: `conflict_min_gap` was incorrectly set to 7 in Meets A, B, C, D (should be 1); only Meet E uses 7 for the rest_gap_conflict scenario. Fixed via `UPDATE meet_rules`.

Both algorithm fixes shipped in `_shared/pairingAlgorithm.ts` and redeployed.

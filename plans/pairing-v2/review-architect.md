# Architect Review -- Pairing Algorithm v2

**Date:** 2026-02-19
**Reviewer:** Architect
**Scope:** 8 agreed fixes from `docs/pairing-algorithm.md` "Known Weaknesses and Issues"

---

## Overall Assessment

The 8 fixes are well-scoped and individually tractable. The main architectural risk is the cumulative surface area: 4 schema migrations, 2 new UI fields on 2 settings surfaces, an expanded Edge Function response contract, a new sheet component, and a behavioral mode flag (`incremental`) that splits execution paths inside the Edge Function. Sequencing matters -- Fix 8 (incremental) depends on Fix 6 (diagnostics) for its "unmatched wrestlers present" detection, and Fix 7 (cross-team preference) interacts with the same scoring function as Fix 2 (priority inversion) and Fix 4 (max_weight_diff). Implementation should proceed in dependency order, not numerical order.

---

## Data Model Changes

| Table        | Column                      | Type      | Default | Migration Notes                                                            |
| ------------ | --------------------------- | --------- | ------- | -------------------------------------------------------------------------- |
| `teams`      | `max_weight_diff`           | `integer` | `NULL`  | Nullable. No backfill needed -- NULL means "no cap" (backward compatible). |
| `meet_rules` | `max_weight_diff`           | `integer` | `NULL`  | Nullable. Same semantics as teams.                                         |
| `teams`      | `prefer_cross_team_matches` | `boolean` | `false` | Non-nullable with default. Backfill all existing rows to `false`.          |
| `meet_rules` | `prefer_cross_team_matches` | `boolean` | `NULL`  | Nullable. NULL means "use team default" (existing override pattern).       |

**Migration pattern:** Existing migrations use the Supabase MCP `apply_migration` tool. There are 60+ migrations in `supabase/migrations/` with timestamp-UUID naming. New migrations should follow the same pattern. All four columns can go in a single migration since they are independent ALTERs with no data dependency.

**TypeScript type regeneration:** The `types.ts` file at `src/integrations/supabase/types.ts` is auto-generated (Supabase CLI `supabase gen types typescript`). There is no `generate-types` script in `package.json`. After the migration lands, types must be regenerated manually via `npx supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts`. This is a required step after any schema change -- if skipped, the frontend TypeScript compiler will reject the new columns. All four new columns must appear in both `Row`, `Insert`, and `Update` type definitions for their respective tables.

---

## Per-Fix Structural Notes

### Fix 1: Local Search Swap Improvement

**Location in Edge Function:** Runs AFTER Phase 2 (line 394, after the `for targetCount` loop populates `selectedMatches[]`) and BEFORE Phase 3 (line 422, the `selectedMatches.sort()` for mat assignment).

**State of `selectedMatches[]` at insertion point:** Clean. It contains fully populated `MatchAssignment` objects with both wrestler references and attendance metadata. The `usedPairings` set and `matchCounts` map are also fully populated and consistent at this point.

**Loop risk analysis:** The swap improvement iterates over all pairs of matches (O(m^2) where m = selectedMatches.length). For a meet with 80 wrestlers and max 4 matches each, worst case is ~160 matches, giving ~12,800 pair comparisons per iteration. The loop repeats until no improvement is found (hill climbing). In practice this converges in 1-3 iterations for typical data distributions. To prevent pathological cases, add a hard cap of 10 iterations.

**Constraint preservation:** Each swap candidate must be validated against the same hard constraints used in scoring -- `teammates_can_wrestle`, `max_age_diff`, and (after Fix 4) `max_weight_diff`. The swap must also preserve `usedPairings` integrity: remove old keys, add new keys.

**Decision:** Insert new function `improveMatchesBySwap(selectedMatches, pairings, settings, calculateMatchScore)` between Phase 2 and Phase 3. Pure function, no side effects on `matchCounts` or `availablePairingsCount` (those are not needed after Phase 2). Cap at 10 iterations.

### Fix 2: Priority Inversion (leaving_early / arriving_late)

**Data flow trace for attendance status:**

1. `attendanceStatusMap` built at line 198-201 from `meet_attendance` query
2. Used in Phase 2 at line 316-321 (`getWrestlerPairingPriority`) -- this is the sort that must be flipped
3. Used in Phase 2 at line 384-385 when populating `MatchAssignment.attendance_a` and `attendance_b`
4. Used in Phase 3 at line 411-418 (`getAttendancePriority`) for mat assignment sort order

Both phases use `attendanceStatusMap`. The fix targets Phase 2 only (flip priority numbers in `getWrestlerPairingPriority`). Phase 3's `getAttendancePriority` already has the correct ordering (leaving_early=0, arriving_late=2).

**Score penalty for leaving_early x arriving_late:** Must be added to `calculateMatchScore` (line 241-273). Currently the function only checks `teammates_can_wrestle` and `max_age_diff`. The +200 penalty needs both wrestlers' attendance statuses, which means `calculateMatchScore` must accept the `attendanceStatusMap` as a parameter (or the attendance status directly). This is a signature change to an inner function -- straightforward, but every call site (line 281) must pass the additional data.

**Concern:** The +200 penalty value is arbitrary. With the current scoring formula, a "perfect" match scores ~0 and a "bad" match scores ~100-200. A +200 penalty makes a leaving_early x arriving_late pair roughly as undesirable as a ~5-year age gap with max priority. This seems appropriate but should be documented as tunable.

### Fix 3: Mat Preference Individual Checks

**Function analysis:** `matchFitsMatPreference` at line 450-463 is called from exactly one place: `findBestMatchForMat` at line 494 (the `requirePreference` branch). It is effectively a pure function -- it reads `matRules` from closure but does not mutate anything.

**Impact of making more matches "unpreferred":** When both wrestlers must individually fall within the mat's range (instead of their average), more matches will fail the preference check. These matches fall through to the "second pass" at line 523 (no preference required). The second pass has no capacity limit beyond `matAtCapacity`, so the fallback handles high load correctly. The only risk: if ALL matches fail ALL mat preferences, every match goes through the second pass, which is equivalent to having no mat rules. This is acceptable behavior -- it degrades gracefully.

**Structural note:** The fix replaces 3 lines of averaging logic with 6 lines of individual range checks. No new functions needed. The `avg_skill` and `avg_experience` fields on `MatchAssignment` are still used in the Phase 3 sort (line 423-428), so they remain needed even after this fix.

### Fix 4: max_weight_diff Schema Additions

**Schema changes:** See Data Model Changes table above.

**Edge Function changes:** In `calculateMatchScore` (line 241-273), after the `max_age_diff` check (line 252), add a parallel check:

```
if (settings.max_weight_diff !== null && weightDiff > settings.max_weight_diff) {
  return Infinity;
}
```

The `TeamSettings` interface (line 19-28) must add `max_weight_diff: number | null`. The settings fetch query (line 113 and 127) must add `max_weight_diff` to the select list.

**UI changes required:**

- `MeetRulesSheet.tsx` (line 476-510, the "Limits" section): Add a "Max weight difference (lbs)" input field, styled identically to the existing "Max age difference" field. Include a helper text noting that leaving it blank means no cap.
- `MatchingRulesSettings.tsx` (line 157-197, the "Limits" section): Add the same field. This requires a new prop pair (`maxWeightDiff` / `setMaxWeightDiff`) on the component interface (line 13-34), and the parent `Settings.tsx` page must wire up the state and persistence.
- Both UIs currently use `Input type="number"` for `max_age_diff`. Use the same pattern for `max_weight_diff` but allow the field to be empty (representing null/no cap).

### Fix 5: Label-Only Change (conflict_min_gap)

**Locations to update:**

1. **`MeetRulesSheet.tsx` line 499:** Currently reads `"Min matches gap between assignments"`. Change to `"Minimum matches between bouts"`. The helper text at line 500-501 already says "Minimum time slots between a wrestler's matches (across all mats)" -- update to "A wrestler won't be scheduled again until at least this many matches have run on any mat. Set to 2-3 for adequate rest."

2. **`MatchingRulesSettings.tsx` line 226:** Currently reads `"Less than matches gap between assigned"`. This label is in the "Flag as Conflict If a Wrestler Has" section and serves a different purpose -- it is a flagging threshold, not the scheduling gap. This is NOT the same setting that the fix targets. The `conflict_min_gap` in `MatchingRulesSettings` is about flagging display, while in `MeetRulesSheet` it controls the actual algorithm. Only the `MeetRulesSheet` label needs the clarifying rename.

**Important distinction:** The `teams` table has `conflict_min_gap` used for TWO purposes: (1) the algorithm's rest gap (consumed by the Edge Function), and (2) the flag threshold (consumed by the frontend for conflict display). These happen to share the same column but mean different things in different UIs. Fix 5 should ONLY update the label in `MeetRulesSheet.tsx` (the algorithm control). The `MatchingRulesSettings.tsx` label is correctly describing its flagging purpose.

### Fix 6: Dropped Match Diagnostics

**Current response payload (Edge Function line 605-612):**

```json
{ "success": true, "matches_created": N, "wrestlers_paired": N, "matches_per_mat": [...] }
```

**Response consumed at (MeetPairings.tsx line 443-464):** The `generatePairings` function reads `response.data?.matches_created` for the toast message and then calls `fetchData()` to refresh. The response is not stored in state -- it is used once for the toast and discarded.

**Part A -- Edge Function additions:** Add to the response:

- `unassigned_count`: already tracked as `unassignedMatches.length` at line 553
- `wrestlers_with_zero_matches`: filter `matchCounts` for wrestlers where count === 0 AND they are in the attending set. Need to join with wrestler names for the response.
- `dropped_reasons`: optional -- would require tracking WHY each match was dropped (no compatible opponent vs. rest gap deadlock). This requires instrumenting the Phase 2 and Phase 3 loops to record reasons per wrestler.

**Part B -- Generation report sheet:** The project has 11 existing sheet components in `src/components/meets/`. The established pattern is: `Sheet` + `SheetContent` + `SheetHeader` + `ScrollArea`, with props for `open`, `onOpenChange`, and domain data. A new `GenerationReportSheet.tsx` should follow `ChangesSummarySheet.tsx` as the closest analog (summary display, no form inputs). The sheet should open automatically when `unassigned_count > 0` after generation.

**Part C -- Red auto-flag for 0-match wrestlers:** The flag logic is at `MeetPairings.tsx` lines 373-385. Currently flags wrestlers with `matchCount < 2`. Add a separate check: if `matchCount === 0` AND status is attending/arriving_late/leaving_early, set a distinct red flag. This is frontend-only -- no database change needed. The `Wrestler` interface already has `is_flagged` and `flag_reason` fields.

**Data flow for Part B:** The `generatePairings` function must store the diagnostic response in state (new `useState` for generation report data) and then set the report sheet open. This is a minor change to the existing async handler.

### Fix 7: prefer_cross_team_matches

**Schema:** See Data Model Changes table.

**Edge Function changes:** In `calculateMatchScore`, after the existing checks, add:

```
if (settings.prefer_cross_team_matches && w1.team_id === w2.team_id) {
  score += 20;  // Penalty to discourage same-team when cross-team preferred
}
```

This must come AFTER the `teammates_can_wrestle` check (which returns Infinity for same-team when false). The +20 penalty only applies when `teammates_can_wrestle = true` AND `prefer_cross_team_matches = true`.

**Interaction with `teammates_can_wrestle`:** The interaction matrix from the algorithm doc is clear and non-conflicting. However, the UI needs careful design to avoid confusion:

- When `teammates_can_wrestle = false`, the `prefer_cross_team_matches` toggle should be hidden or disabled (it is meaningless -- cross-team is already mandatory).
- When `teammates_can_wrestle = true`, the toggle becomes visible.

This conditional visibility applies to both `MeetRulesSheet.tsx` and `MatchingRulesSettings.tsx`.

**Settings fetch:** The Edge Function's settings query (line 113 and 127) must include `prefer_cross_team_matches`. The `TeamSettings` interface must add the field.

### Fix 8: Incremental Generation

**Current DELETE behavior (Edge Function line 222-226):**

```typescript
await supabase.from("matches").delete().eq("meet_id", meet_id);
```

This runs unconditionally before any scoring or pairing logic. Gating on `incremental` is clean:

```typescript
if (!incremental) {
  await supabase.from("matches").delete().eq("meet_id", meet_id);
}
```

**Pre-populating state for incremental mode:** When `incremental = true`, the Edge Function must:

1. Fetch existing matches: `SELECT wrestler_a_id, wrestler_b_id FROM matches WHERE meet_id = ?`
2. Build `matchCounts` from existing matches (count appearances per wrestler)
3. Build `usedPairings` set from existing matches (add pair keys)
4. Filter wrestlers to only those with `matchCounts[id] === 0` for Phase 2 candidate generation

This is structurally clean. The existing `matchCounts` initialization at line 294-295 (`wrestlers.forEach(w => matchCounts[w.id] = 0)`) would be replaced with initialization from DB counts. The `usedPairings` set at line 306 would be pre-populated. Phase 1 (scoring) still generates all eligible pairs but Phase 2 only processes unmatched wrestlers.

**Phase 3 (mat assignment) for incremental:** New matches must be appended AFTER existing matches on each mat. This means:

- Fetch existing mat queue lengths: `SELECT mat_number, COUNT(*) FROM matches WHERE meet_id = ? GROUP BY mat_number`
- Set `globalSlot` initial value to `MAX(existing slot count)` rather than 0
- Set `wrestlerLastGlobalSlot` from existing match positions (requires existing match_order data)

This is the most complex part. The existing `match_order` encoding (`mat_number * 100 + orderIndex`) must be parsed to reconstruct slot positions for rest-gap tracking. If any existing match involves a wrestler who also appears in a new incremental match, the gap constraint must be respected.

**UI changes (MeetPairings.tsx):**

The "Generate Pairings" button is at lines 728-742. It only renders when `matches.length === 0`. The "Add new wrestlers" button should render when:

- `matches.length > 0` (existing pairings exist)
- Host team only (`currentTeam?.id === meet.host_team_id`)
- Unmatched attending wrestlers exist (at least one wrestler with attendance status in `['attending', 'arriving_late', 'leaving_early']` AND `match_count === 0`)

The unmatched-wrestler detection is already computable from the `wrestlers` state array in `MeetPairings.tsx` -- no additional query needed. The condition is:

```typescript
const hasUnmatchedWrestlers = wrestlers.some(
  (w) =>
    ["attending", "arriving_late", "leaving_early"].includes(
      w.attendance_status,
    ) && w.match_count === 0,
);
```

The button should call a variant of `generatePairings` that passes `incremental: true` in the request body.

**Concern -- existing match regeneration confirmation:** When the user clicks "Generate Pairings" (full regeneration) and matches already exist, there should be a destructive confirmation dialog. Currently the button is hidden when matches exist (line 728: `matches.length === 0`). After Fix 8, the full regeneration button should be available (perhaps in the reset/more menu) with an AlertDialog confirmation, while the incremental button is the prominent action. This is a UX decision that should be confirmed in mockup review.

---

## Cross-Cutting Concerns

### 1. TypeScript Type Regeneration

Fixes 4 and 7 add schema columns. After the migration, `npx supabase gen types typescript` must run. This is a single operation but blocks all frontend work that touches the new columns. The migration and type regen should be the very first implementation step.

### 2. Edge Function `TeamSettings` Interface

Fixes 2, 4, 7, and 8 all modify the `TeamSettings` interface in the Edge Function (line 19-28). They should be combined into a single interface update:

```typescript
interface TeamSettings {
  // existing fields...
  max_weight_diff: number | null; // Fix 4
  prefer_cross_team_matches: boolean; // Fix 7
}
```

The settings fetch queries (lines 113 and 127) must also be updated once to include both new columns.

### 3. Settings UI Consistency

Both `MeetRulesSheet.tsx` and `MatchingRulesSettings.tsx` expose matching rule settings. Any new setting (max_weight_diff, prefer_cross_team_matches) must appear in BOTH UIs. The `MatchingRulesSettings` component uses a props-based pattern (parent manages state), while `MeetRulesSheet` manages its own state internally. Both patterns must be extended consistently.

### 4. Edge Function Response Contract

Fixes 6 and 8 both modify the response payload. The response should be versioned or at minimum documented. The frontend must handle both old and new response shapes gracefully (the `response.data?.field` optional chaining pattern already provides this).

### 5. `calculateMatchScore` Signature Change

Fixes 2 (attendance penalty), 4 (max_weight_diff), and 7 (cross-team penalty) all modify `calculateMatchScore`. These changes should be implemented together to avoid repeated refactoring of the same function. The function will need access to: `settings` (already has), `attendanceStatusMap` (new for Fix 2), and both wrestlers' team_ids (already has via `w1.team_id`).

### 6. Implementation Order

Recommended sequence based on dependencies:

| Order | Fix                            | Rationale                                                           |
| ----- | ------------------------------ | ------------------------------------------------------------------- |
| 1     | Schema migration (Fixes 4 + 7) | Unblocks TypeScript type regen and all UI work                      |
| 2     | Type regeneration              | Unblocks frontend compilation with new columns                      |
| 3     | Fix 5 (label-only)             | Zero risk, independent, quick win                                   |
| 4     | Fix 3 (mat preference)         | Independent, small change, no schema dependency                     |
| 5     | Fix 2 (priority inversion)     | Modifies scoring function; do before Fixes 4/7 touch same function  |
| 6     | Fix 4 (max_weight_diff)        | Scoring function + UI; builds on Fix 2's signature change           |
| 7     | Fix 7 (prefer_cross_team)      | Scoring function + UI; same pattern as Fix 4                        |
| 8     | Fix 1 (swap improvement)       | Post-Phase-2 optimization; must run after scoring changes stabilize |
| 9     | Fix 6 (diagnostics)            | Expands response payload; needed before Fix 8                       |
| 10    | Fix 8 (incremental)            | Most complex; depends on stable algorithm and diagnostics           |

---

## Risks and Open Questions

### R1: Incremental Mode -- Match Order Encoding Fragility

The `match_order = mat_number * 100 + orderIndex` encoding limits each mat to 100 matches (indices 0-99). For incremental mode, appending to existing queues requires knowing the current max `orderIndex` per mat. If a mat already has 95 matches, adding 10 more would overflow into the next mat's number space. With typical meet sizes (20-40 matches per mat max), this is unlikely but should be guarded.

**Recommendation:** Add a validation check in incremental mode. If any mat would exceed 99 matches, return an error rather than silently corrupting order numbers.

### R2: Swap Improvement -- Convergence Guarantee

The swap pass uses hill climbing, which guarantees convergence (sum of scores monotonically decreases, bounded below by 0). However, if two swaps are equally beneficial, the algorithm could theoretically oscillate. The 10-iteration cap prevents this, but the developer should use strict inequality (`<` not `<=`) when comparing improvement to ensure progress.

### R3: Incremental + Swap Interaction

When incremental mode runs, the swap improvement (Fix 1) should only consider newly generated matches, not existing ones. Swapping opponents between an existing match and a new match would modify the existing schedule, violating the "don't touch existing matches" contract. The swap function must receive a "frozen" set of match indices that cannot be modified.

### R4: Edge Function Timeout

The Edge Function currently has no explicit timeout. Adding the swap improvement (Fix 1) increases computation. For 80 wrestlers with 160 matches, the swap pass adds ~130ms per iteration (12,800 comparisons x ~10us each). With 10 max iterations, that is ~1.3 seconds. Supabase Edge Functions have a 150-second default timeout, so this is not a concern. However, the incremental mode (Fix 8) adds DB queries at the start, increasing cold-start latency. Monitor execution time after deployment.

### R5: `MatchingRulesSettings` Dual Purpose of `conflict_min_gap`

The `teams.conflict_min_gap` column serves two purposes: (1) the algorithm's rest-gap parameter, and (2) a UI flagging threshold. These are currently the same value, which is convenient but semantically incorrect. If a coach wants a 3-slot rest gap in the algorithm but wants to flag wrestlers with less than a 5-slot gap for manual review, they cannot express this. This is not in scope for v2 but should be noted as a future consideration. Splitting into two columns (`scheduling_min_gap` and `flag_min_gap`) would resolve the dual-purpose issue.

### R6: Open Question -- Full Regeneration Button Placement After Fix 8

Currently the "Generate Pairings" button is hidden when `matches.length > 0`. After Fix 8 adds the incremental button, the full regeneration needs to be accessible somewhere (e.g., behind the "Reset Pairings" confirmation dialog, or as a dropdown option). The PRD should specify the exact UX for this before implementation.

### R7: Open Question -- Incremental Mode + Pairing Status

The `pairing_status` field (`draft | planned | published`) controls workflow. If pairings are already `published` and the host adds new wrestlers incrementally, does the status revert to `draft`? This has implications for the `PairingStatusBar` component and the audit trail. The PRD should specify the expected behavior.

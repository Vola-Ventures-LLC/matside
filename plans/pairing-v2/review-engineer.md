# Engineer Review — Pairing Algorithm v2

**Reviewer:** Engineer
**Date:** 2026-02-19
**Source files reviewed:**

- `supabase/functions/generate-pairings/index.ts` (623 lines)
- `src/pages/MeetPairings.tsx` (1,676 lines)
- `src/components/meets/MeetRulesSheet.tsx` (708 lines)
- `src/components/settings/MatchingRulesSettings.tsx` (241 lines)
- `src/components/meets/AddMatchSheet.tsx` (500 lines)
- `docs/pairing-algorithm.md`

---

## Overall Complexity Assessment

These 8 fixes divide cleanly into three tiers:

**Trivial (no risk, ship first):**

- Fix 5 — label change, pure UI string swap, zero logic

**Low complexity, well-contained:**

- Fix 2 — priority inversion, two small code changes in one function
- Fix 3 — mat preference individual checks, ~10-line change to `matchFitsMatPreference`
- Fix 7 — cross-team preference, 2–3 line change in `calculateMatchScore` plus schema

**Moderate — careful but straightforward:**

- Fix 4 — `max_weight_diff` hard cap, schema + one condition in `calculateMatchScore` + UI in two settings components
- Fix 6 — dropped match diagnostics, plumbing through Edge Function response and frontend toast/sheet

**Highest complexity, most coordination required:**

- Fix 1 — local search swap, new algorithm phase with correctness and performance implications
- Fix 8 — incremental generation, new Edge Function mode + UI state derivation + DB pre-population

Fixes 4 and 7 share a migration and should ship together. Fixes 2 and 3 are independent but small enough to batch in a single deploy.

---

## Implementation Sequence (Recommended Order)

**Phase 1 — Pure fixes, no schema, no risk:**

1. Fix 5 (label)
2. Fix 3 (mat preference individual checks)
3. Fix 2 (priority inversion)

**Phase 2 — Schema additions:** 4. Fix 4 + Fix 7 together (both add columns to `teams` and `meet_rules`, batch into one migration)

**Phase 3 — Diagnostics and UX:** 5. Fix 6 (dropped match diagnostics) 6. Fix 1 (local search swap)

**Phase 4 — Incremental mode (most complex, most isolated):** 7. Fix 8

**Rationale for order:** The priority inversion bug (Fix 2) and mat preference bug (Fix 3) are correctness issues that affect the validity of any test data generated. Fix them first so that testing of Fix 1 (swap improvement) and Fix 8 (incremental mode) is against a correct baseline.

---

## Per-Fix Implementation Notes

---

### Fix 1 — Local search swap improvement

**Effort:** M
**Risk:** Medium

**Where it lives:** New code block inserted between the closing of the round-robin loop (line ~394 of the Edge Function) and the sort before mat assignment (line ~423).

**Pseudocode:**

```typescript
let improved = true;
while (improved) {
  improved = false;
  for (let i = 0; i < selectedMatches.length; i++) {
    for (let j = i + 1; j < selectedMatches.length; j++) {
      const ma = selectedMatches[i]; // A vs B
      const mb = selectedMatches[j]; // C vs D
      const swapScore1 = calculateMatchScore(ma.wrestler_a, mb.wrestler_b);
      const swapScore2 = calculateMatchScore(mb.wrestler_a, ma.wrestler_b);
      if (swapScore1 === Infinity || swapScore2 === Infinity) continue;
      const keyAD = getPairingKey(ma.wrestler_a_id, mb.wrestler_b_id);
      const keyCB = getPairingKey(mb.wrestler_a_id, ma.wrestler_b_id);
      if (usedPairings.has(keyAD) || usedPairings.has(keyCB)) continue;
      const currentScore =
        calculateMatchScore(ma.wrestler_a, ma.wrestler_b) +
        calculateMatchScore(mb.wrestler_a, mb.wrestler_b);
      const newScore = swapScore1 + swapScore2;
      if (newScore < currentScore) {
        usedPairings.delete(getPairingKey(ma.wrestler_a_id, ma.wrestler_b_id));
        usedPairings.delete(getPairingKey(mb.wrestler_a_id, mb.wrestler_b_id));
        usedPairings.add(keyAD);
        usedPairings.add(keyCB);
        selectedMatches[i] = {
          wrestler_a_id: ma.wrestler_a_id,
          wrestler_b_id: mb.wrestler_b_id,
          wrestler_a: ma.wrestler_a,
          wrestler_b: mb.wrestler_b,
          avg_skill: (ma.wrestler_a.skill + mb.wrestler_b.skill) / 2,
          avg_experience:
            (ma.wrestler_a.experience + mb.wrestler_b.experience) / 2,
          attendance_a: ma.attendance_a,
          attendance_b: mb.attendance_b,
        };
        selectedMatches[j] = {
          wrestler_a_id: mb.wrestler_a_id,
          wrestler_b_id: ma.wrestler_b_id,
          wrestler_a: mb.wrestler_a,
          wrestler_b: ma.wrestler_b,
          avg_skill: (mb.wrestler_a.skill + ma.wrestler_b.skill) / 2,
          avg_experience:
            (mb.wrestler_a.experience + ma.wrestler_b.experience) / 2,
          attendance_a: mb.attendance_a,
          attendance_b: ma.attendance_b,
        };
        improved = true;
      }
    }
  }
}
```

**Field availability check:** The `MatchAssignment` interface at lines 42–50 of the Edge Function stores full `wrestler_a: Wrestler` and `wrestler_b: Wrestler` objects, including `weight`, `date_of_birth`, `experience`, `skill`, and `team_id`. All fields needed by `calculateMatchScore` are present. No data re-fetch required.

**Iteration count analysis:**

- 60 wrestlers at `max_matches_per_wrestler = 4` produces up to 120 matches.
- Inner loop is O(n²) over matches: 120x119/2 = ~7,140 pair comparisons per pass.
- Each pass calls `calculateMatchScore` at most 14,280 times. The function is O(1) arithmetic.
- Convergence typically happens in 3–6 passes. Total worst-case: ~71,400 score calculations. Not a performance concern.

**Duplicate-pairing edge case:** A wrestler with 3 matches appears in 3 `selectedMatches` entries. When checking `usedPairings.has(keyAD)`, a third existing match (A vs D) will block the swap correctly. No additional logic needed.

**Attendance field accuracy:** After a swap, attendance fields must follow the wrestler, not the slot. The pseudocode carries `ma.attendance_a` with `ma.wrestler_a`. Verify this explicitly during code review.

---

### Fix 2 — Priority inversion

**Effort:** S
**Risk:** Low

**Change 1 — flip `getWrestlerPairingPriority` at lines 316-321 of the Edge Function:**

Before (current):

```typescript
if (status === arriving_late) return 0;
if (status === leaving_early) return 1;
return 2;
```

After:

```typescript
if (status === leaving_early) return 0;
if (status === arriving_late) return 1;
return 2;
```

(Replace bare identifiers with quoted strings in the actual code.)

**Change 2 — add leaving_early x arriving_late penalty in `calculateMatchScore` before the return statement (after line 272):**

```typescript
const score =
  ageDiff * ageWeight +
  weightDiff * weightWeight +
  experienceDiff * experienceWeight +
  skillDiff * skillWeight;
const statusA = attendanceStatusMap[w1.id];
const statusB = attendanceStatusMap[w2.id];
const isConflictingPair =
  (statusA === leaving_early && statusB === arriving_late) ||
  (statusA === arriving_late && statusB === leaving_early);
return isConflictingPair ? score + 200 : score;
```

(Replace bare identifiers with quoted status strings in the actual code.)

**Dependency note:** `calculateMatchScore` is a closure inside `Deno.serve`, so `attendanceStatusMap` is in scope as written. If the function is ever moved outside the handler, it would need to become a parameter.

**Fewer matches is OK:** The round-robin loop iterates `targetCount` from 0 to `max_matches_per_wrestler - 1`. If no compatible non-late opponent exists for a `leaving_early` wrestler at `targetCount = 0`, they simply do not get a match. No change to the loop logic is needed.

---

### Fix 3 — Mat preference individual checks

**Effort:** S
**Risk:** Low

**Current age/experience/skill checks in `matchFitsMatPreference` at lines 457-461 of the Edge Function:**

```typescript
const avgAge = (age1 + age2) / 2;
if (avgAge < rule.min_age || avgAge > rule.max_age) return false;
if (
  match.avg_experience < rule.min_experience ||
  match.avg_experience > rule.max_experience
)
  return false;
if (match.avg_skill < rule.min_skill || match.avg_skill > rule.max_skill)
  return false;
```

**After (individual checks for both wrestlers):**

```typescript
if (age1 < rule.min_age || age1 > rule.max_age) return false;
if (age2 < rule.min_age || age2 > rule.max_age) return false;
if (
  match.wrestler_a.experience < rule.min_experience ||
  match.wrestler_a.experience > rule.max_experience
)
  return false;
if (
  match.wrestler_b.experience < rule.min_experience ||
  match.wrestler_b.experience > rule.max_experience
)
  return false;
if (
  match.wrestler_a.skill < rule.min_skill ||
  match.wrestler_a.skill > rule.max_skill
)
  return false;
if (
  match.wrestler_b.skill < rule.min_skill ||
  match.wrestler_b.skill > rule.max_skill
)
  return false;
```

**`calculateAge` scope:** Defined at line 229 as a `const` inside `Deno.serve`, before `matchFitsMatPreference` at line 450. It is in scope.

**Behavioral impact warning:** This change makes mat assignment stricter. Matches that previously passed the average-based check may now fall through to the open-mat fallback. This is correct behavior, but coordinators may notice different mat distributions. Document in release notes.

---

### Fix 4 — `max_weight_diff` schema

**Effort:** M
**Risk:** Low

**Migration SQL:**

```sql
ALTER TABLE teams      ADD COLUMN IF NOT EXISTS max_weight_diff integer DEFAULT NULL;
ALTER TABLE meet_rules ADD COLUMN IF NOT EXISTS max_weight_diff integer DEFAULT NULL;
```

Both columns are nullable integers. NULL means no cap, which is backward compatible.

**Edge Function change in `calculateMatchScore`, after `const weightDiff` is computed (line ~256):**

```typescript
if (
  settings.max_weight_diff !== null &&
  weightDiff > settings.max_weight_diff
) {
  return Infinity;
}
```

**Settings query updates:**

1. Line 114 of Edge Function: add `max_weight_diff` to the `meet_rules` select string.
2. Line 128: add `max_weight_diff` to the `teams` select string.
3. `TeamSettings` interface at line 19: add `max_weight_diff: number | null`.

**UI addition in `MeetRulesSheet.tsx` after the `max_age_diff` input block (around line 486):**

```tsx
<div className=“space-y-2”>
  <Label htmlFor=“maxWeightDiff”>Max weight difference (lbs, optional)</Label>
  <Input id=“maxWeightDiff” type=“number” min={0} placeholder=“No limit”
    value={rules.max_weight_diff ?? “”}
    onChange={(e) => setRules(r => ({
      ...r, max_weight_diff: e.target.value === “” ? null : parseInt(e.target.value)
    }))} />
  <p className=“text-xs text-muted-foreground”>
    Pairs with a greater weight difference will not be eligible. Leave blank for no limit.
  </p>
</div>
```

The `MeetRules` interface in `MeetRulesSheet.tsx` at line 34 needs `max_weight_diff: number | null` added. The `handleSave` function at line 202 must include the field in `rulesData`.

In `MatchingRulesSettings.tsx`, add a `maxWeightDiff` / `setMaxWeightDiff` prop pair and wire it in the parent settings page.

**UI effort estimate:** 45-60 minutes across both files plus prop threading in the parent settings page.

---

### Fix 5 — Label change

**Effort:** XS
**Risk:** None

**Strings to change:**

In `src/components/meets/MeetRulesSheet.tsx`:

- Line 499: "Min matches gap between assignments" to "Minimum matches between bouts"
- Line 501 helper text: "Minimum time slots between a wrestler's matches (across all mats)"
  change to: "A wrestler won't be scheduled again until at least this many matches have run on any mat. Set to 2-3 for adequate rest."

In `src/components/settings/MatchingRulesSettings.tsx`:

- Line 226: "Less than matches gap between assigned" to "Minimum matches between bouts"

Note: The `MatchingRulesSettings.tsx` label is in the Flag as Conflict section, not the main scheduling rules section. Flag for PM review if intent differs.

---

### Fix 6 — Dropped match diagnostics

**Effort:** M
**Risk:** Low

**Part A — Edge Function response additions:**

After the unassignedMatches log at line 553, add:

```typescript
const wrestlersWithZeroMatches = wrestlers
  .filter((w) => matchCounts[w.id] === 0)
  .map((w) => ({ id: w.id, name: w.first_name + " " + w.last_name }));
```

Update the success response at line 605 to add `unassigned_count` and `wrestlers_with_zero_matches` to the JSON body.

**Semantics note:** `unassigned_count` = matches Phase 2 selected but Phase 3 could not place. `wrestlers_with_zero_matches` = wrestlers never included in any selected match. These are two distinct failure modes. The PRD requests per-wrestler reason codes — implementing that requires tagging failures at each phase, which is additional scope. Resolve with PM before starting.

**Part B — Frontend plumbing in `generatePairings()` at line 443 of `MeetPairings.tsx`:**

Add two new state variables: `generationWarnings` and `generationWarningsOpen`. Update the success path to check `wrestlers_with_zero_matches.length > 0 || unassigned_count > 0` and fire a destructive toast with counts, then open a diagnostics slideout sheet that lists affected wrestlers with a direct Add Match button per wrestler (opening the existing `AddMatchSheet` component).

**Part C — Red auto-flag for 0-match wrestlers at lines 373-385 of `MeetPairings.tsx`:**

Add a new case before the existing `matchCount < 2` check:

```typescript
if (matchCount === 0 && attendingStatuses.includes(status)) {
  isFlagged = true;
  flagReason = "No match assigned";
} else if (matchCount < 2 && attendingStatuses.includes(status)) {
  isFlagged = true;
  flagReason = "Only " + matchCount + " match" + (matchCount === 1 ? "" : "es");
}
```

The current `is_flagged: boolean` cannot distinguish red vs yellow severity. Recommend adding `flag_severity: "warning" | "critical" | null` to the `Wrestler` interface. Using `flag_reason === "No match assigned"` as a string sentinel is cheaper but fragile.

---

### Fix 7 — `prefer_cross_team_matches`

**Effort:** S
**Risk:** Low

**Migration SQL (batch with Fix 4):**

```sql
ALTER TABLE teams      ADD COLUMN IF NOT EXISTS prefer_cross_team_matches boolean DEFAULT false;
ALTER TABLE meet_rules ADD COLUMN IF NOT EXISTS prefer_cross_team_matches boolean DEFAULT NULL;
```

NULL on `meet_rules` means use team default, which is the existing fallback pattern for all other settings.

**Edge Function change — replace the `calculateMatchScore` return statement:**

```typescript
const sameTeamPenalty =
  settings.teammates_can_wrestle &&
  settings.prefer_cross_team_matches &&
  w1.team_id === w2.team_id
    ? 20
    : 0;
return (
  ageDiff * ageWeight +
  weightDiff * weightWeight +
  experienceDiff * experienceWeight +
  skillDiff * skillWeight +
  sameTeamPenalty
);
```

The `TeamSettings` interface needs `prefer_cross_team_matches: boolean` added. Both `select()` strings must include the column.

**UI changes:** Add a Switch control to both `MeetRulesSheet.tsx` and `MatchingRulesSettings.tsx`, styled like the existing `teammates_can_wrestle` toggle, placed below it in the same section. Disable the new toggle when `teammates_can_wrestle` is false, since the hard block already applies.

**Penalty calibration note:** At default priorities, a weight difference of 2 lbs produces a score of 60 and a skill difference of 1 produces a score of 40. A +20 penalty is smaller than most real-world attribute differences. In a balanced meet this works as intended. In a heavily single-team meet the penalty rarely changes outcomes. This is a calibration decision, not a bug — raise with PM.

---

### Fix 8 — Incremental generation

**Effort:** L
**Risk:** High

**Part A — Gating the DELETE step at line 222:**

Update request body destructuring at line 98:

```typescript
const { meet_id, host_team_id, incremental = false } = await req.json();
```

Gate the delete:

```typescript
if (!incremental) {
  await supabase.from(matches).delete().eq(meet_id_field, meet_id);
}
```

(Replace bare identifiers with quoted strings in the actual code.)

**Part B — Pre-populating `matchCounts` and `usedPairings` from existing matches:**

Insert this block after the initializations of `matchCounts`, `availablePairingsCount`, and `usedPairings` (lines 295-303) and before the round-robin loop (line 324):

```typescript
if (incremental) {
  const { data: existingMatches } = await supabase
    .from(matches_table)
    .select(wrestler_ids_columns)
    .eq(meet_id_field, meet_id);
  if (existingMatches) {
    existingMatches.forEach((m) => {
      matchCounts[m.wrestler_a_id] = (matchCounts[m.wrestler_a_id] || 0) + 1;
      matchCounts[m.wrestler_b_id] = (matchCounts[m.wrestler_b_id] || 0) + 1;
      usedPairings.add(getPairingKey(m.wrestler_a_id, m.wrestler_b_id));
    });
    // Re-compute availablePairingsCount after usedPairings reflects existing matches
    wrestlers.forEach((w) => (availablePairingsCount[w.id] = 0));
    for (const p of pairings) {
      if (!usedPairings.has(getPairingKey(p.w1.id, p.w2.id))) {
        availablePairingsCount[p.w1.id]++;
        availablePairingsCount[p.w2.id]++;
      }
    }
  }
}
```

(Replace bare identifiers with quoted strings in the actual code.)

**Critical ordering dependency:** `availablePairingsCount` must be re-computed here after `usedPairings` is seeded. If the re-computation is omitted, scarcity prioritization will be wrong for already-matched wrestlers.

**Part C — Frontend derived state for unmatched attending wrestlers:**

```typescript
const unmatchedAttendingWrestlers = useMemo(() => {
  const matchedIds = new Set<string>();
  matches.forEach((m) => {
    matchedIds.add(m.wrestler_a_id);
    matchedIds.add(m.wrestler_b_id);
  });
  return wrestlers.filter(
    (w) =>
      [attending, arriving_late, leaving_early].includes(w.attendance_status) &&
      !matchedIds.has(w.id),
  );
}, [wrestlers, matches]);
```

(Replace bare identifiers with quoted status strings in the actual code.)

**Part D — UI button split in `MeetPairings.tsx` at line 728:**

Replace the existing generate button (visible when `matches.length === 0`) with two conditional buttons:

1. **Generate Pairings** — visible when `matches.length === 0`. Same behavior as today.
2. **Add new wrestlers** — visible when `matches.length > 0 && unmatchedAttendingWrestlers.length > 0`. Wrapped in an `AlertDialog` for confirmation. Calls a new `generatePairingsIncremental` function that is identical to `generatePairings` except it passes `incremental: true` in the request body.

**`match_order` collision bug (not in PRD, must be added to scope):** Phase 3 assigns `match_order = (matNumber * 100) + orderIndex` starting from `orderIndex = 0` per mat queue. In incremental mode, existing matches already occupy orders 100, 101, 102, etc. New matches will collide silently. The Edge Function must query the existing maximum `match_order` per mat before the insert loop and offset new indexes accordingly. This is a silent data bug that produces incorrect schedule ordering in the UI.

---

## Edge Cases and Gotchas

**Cross-fix interaction: Fix 2 + Fix 1.** After Fix 2 flips the priority order, `leaving_early` wrestlers are processed first in Phase 2. The Fix 1 swap pass then refines from that corrected starting point. Both fixes coexist correctly.

**Cross-fix interaction: Fix 3 + Fix 8.** Fix 3 makes mat preference stricter. In incremental mode, existing matches were placed under the old lenient check; new matches are evaluated under the stricter check. New wrestlers may land on different mats than existing wrestlers with similar attributes. No code change needed — document the behavior.

**Fix 6 failure mode granularity.** `wrestlers_with_zero_matches` lumps two distinct causes: (a) no compatible pairing found in Phase 2, and (b) a pairing selected in Phase 2 dropped by Phase 3 due to rest gaps. The PRD requests per-wrestler reason codes, which requires tagging failures at each phase — meaningful additional scope. Resolve with PM before starting Fix 6.

**Fix 4 null handling.** If `max_weight_diff` is accidentally omitted from the `select()` string, its value is `undefined` at runtime and `undefined > someNumber` evaluates to `false` in JavaScript — the cap silently does not apply. Add `max_weight_diff: number | null` to `TeamSettings` with an explicit default of `null` to make the null case visible.

**Fix 8 `availablePairingsCount` initialization order.** If `availablePairingsCount` is not re-computed after `usedPairings` is seeded from existing matches, it overcounts available pairings for already-matched wrestlers. The scarcity-priority sort will be wrong. This is the highest-probability silent correctness bug in the batch. It only manifests in incremental mode, not in fresh generation, making it easy to miss in testing.

**Fix 8 `match_order` collision.** Called out in the per-fix notes. Missing from the PRD. Must be added to implementation scope before Fix 8 is started.

---

## Testing Notes

**Fix 1 (swap):** Construct a roster where wrestler A is the only valid opponent for wrestler B, but the greedy pass assigns A to C first. Verify the swap corrects the A-B pairing. Also test with a wrestler who has 3 matches — verify no duplicate pair is introduced.

**Fix 2 (priority):** Create a meet with 2 leaving_early and 2 arriving_late wrestlers plus 4 attending wrestlers. Before the fix, leaving_early pairs with arriving_late. After the fix, they pair with attending wrestlers. Verify Phase 3 schedule order shows leaving_early matches early and arriving_late matches late.

**Fix 3 (mat preference):** Create a mat rule for Mat 1 targeting age 7-9. Test a pair: one 7-year-old and one 10-year-old. Average age = 8.5 passes the old check. Under the new individual check, the 10-year-old fails. Verify the match falls to the open-mat fallback.

**Fix 4 (max_weight_diff):** Set `max_weight_diff = 10`. Generate with two wrestlers 15 lbs apart — verify not paired. Verify two wrestlers 9 lbs apart remain eligible. Test `null` value — confirm no regression from current behavior.

**Fix 5 (label):** Visual QA only. Verify both old label strings are absent from both settings UIs.

**Fix 6 (diagnostics):** Set `max_age_diff = 0` and add a wrestler with a unique age. Generate — that wrestler should appear in `wrestlers_with_zero_matches`. Verify the warning toast fires and the wrestler table shows a distinct critical flag.

**Fix 7 (cross-team preference):** Two-team meet with `teammates_can_wrestle = true` and `prefer_cross_team_matches = true`. Verify cross-team pairs are preferred when both viable. Verify same-team pairs still appear when no cross-team option exists.

**Fix 8 (incremental):** Generate a full meet for 10 wrestlers. Add one wrestler to attendance. Click Add new wrestlers. Verify: new wrestler gets a match, existing matches are unchanged, new match `match_order` values do not collide with existing values, and `usedPairings` prevents re-pairing the new wrestler against someone they already faced.

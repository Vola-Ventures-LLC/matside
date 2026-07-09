# MatSide Pairing Algorithm — As-Built Documentation

**Date:** 2026-02-19
**Source file:** `supabase/functions/generate-pairings/index.ts`
**Triggered by:** "Generate Pairings" button in `src/pages/MeetPairings.tsx` → `supabase.functions.invoke('generate-pairings', { body: { meet_id, host_team_id } })`

---

## Overview

The algorithm takes a list of attending wrestlers across all teams at a meet and produces a schedule of matches, distributed across N mats. It runs in three sequential phases:

1. **Scoring** — compute a compatibility score for every possible wrestler pair
2. **Pairing selection** — greedily select matches using a round-robin balance loop
3. **Mat assignment** — assign selected matches to mat queues using a strict round-robin with rest-gap enforcement

The result is a set of rows inserted into the `matches` table with `mat_number` and `match_order` populated.

---

## Inputs

### Settings (from `meet_rules` or `teams` fallback)

| Field                       | Type    | Meaning                                                               |
| --------------------------- | ------- | --------------------------------------------------------------------- |
| `match_priority_age`        | 1–4     | How important age similarity is (lower = more important)              |
| `match_priority_weight`     | 1–4     | How important weight similarity is                                    |
| `match_priority_experience` | 1–4     | How important experience similarity is                                |
| `match_priority_skill`      | 1–4     | How important skill similarity is                                     |
| `max_age_diff`              | integer | Hard cap on age difference (years) — pairs beyond this are ineligible |
| `max_matches_per_wrestler`  | integer | Maximum matches any single wrestler can have                          |
| `teammates_can_wrestle`     | boolean | If false, same-team pairs are ineligible                              |
| `conflict_min_gap`          | integer | Minimum number of time slots between a wrestler's consecutive matches |

If meet-specific rules exist in `meet_rules`, they take precedence; otherwise host team's `teams` row is used.

### Mat Rules (from `meet_mat_rules` or `mat_rules` fallback)

Each mat can optionally have a rule row:

| Field                               | Meaning                                   |
| ----------------------------------- | ----------------------------------------- |
| `mat_number`                        | Which mat (1-indexed)                     |
| `min_age` / `max_age`               | Average age range for matches on this mat |
| `min_experience` / `max_experience` | Average experience range                  |
| `min_skill` / `max_skill`           | Average skill range                       |
| `max_matches`                       | Hard cap on total matches for this mat    |

Mat rules are **preferences**, not hard constraints — if a match can't be placed on its preferred mat due to rest gaps or capacity, it goes to any available mat.

The total mat count is `max(mat_number)` across rules, defaulting to 2 if no rules exist.

### Wrestlers

Active (non-archived) wrestlers whose `meet_attendance.status` is one of:

- `attending` — normal priority
- `arriving_late` — elevated priority in pairing phase, scheduled **later** in mat assignment
- `leaving_early` — elevated priority in pairing phase, scheduled **earlier** in mat assignment

---

## Phase 1: Match Scoring

`calculateMatchScore(w1, w2)` — lower score = better match

```
score = ageDiff    * (5 - match_priority_age)    * 10
      + weightDiff * (5 - match_priority_weight)  * 10
      + expDiff    * (5 - match_priority_experience) * 10
      + skillDiff  * (5 - match_priority_skill)   * 10
```

Where `xDiff = |w1.x - w2.x|`.

Priority values are 1–4. `(5 - priority)` converts them to weights 1–4 (priority 1 = weight 4 = most important). All weights are multiplied by 10 to give integer-scale scores.

**Hard disqualifiers (score = Infinity):**

- `teammates_can_wrestle = false` and both wrestlers share the same `team_id`
- `|age1 - age2| > max_age_diff`

Infinity pairs are excluded entirely from the candidate list.

All eligible pairs are pre-computed once (`O(n²)`) and sorted ascending by score.

---

## Phase 2: Pairing Selection (Round-Robin Balanced)

Goal: Give every wrestler at least 1 match before anyone gets a 2nd, then at least 2 before anyone gets a 3rd, etc., up to `max_matches_per_wrestler`.

```
for targetCount in 0..(max_matches_per_wrestler - 1):
  candidates = wrestlers where matchCount == targetCount
  sort candidates by:
    1. attendance priority (arriving_late=0, leaving_early=1, attending=2)
    2. availablePairingsCount ascending (wrestlers with fewer options go first)

  for each wrestler in candidates:
    skip if matchCount already > targetCount (already got a match this round)
    find best available pairing from pre-sorted list:
      - pairing not yet used
      - involves this wrestler
      - opponent hasn't hit max_matches_per_wrestler
      - PREFER opponent who is also at or below targetCount (balanced)
      - fall back to any eligible opponent if none balanced
    if found: add to selectedMatches, increment both matchCounts
```

`availablePairingsCount` is decremented as pairings are consumed, so wrestlers with fewer remaining compatible opponents get prioritized.

**Output:** `selectedMatches[]` — an unordered list of match pairs with metadata:

- `wrestler_a_id`, `wrestler_b_id`
- `avg_skill` = `(w1.skill + w2.skill) / 2`
- `avg_experience` = `(w1.experience + w2.experience) / 2`
- `attendance_a`, `attendance_b` (status strings)

---

## Phase 3: Mat Assignment (Strict Round-Robin + Rest Gaps)

**Pre-sort** `selectedMatches` before assigning:

1. `leaving_early` matches first (priority 0)
2. Regular `attending` matches (priority 1)
3. `arriving_late` matches last (priority 2)
4. Within each group: sort by `avg_skill` ascending (lower skill = earlier on schedule)

**Conflict — confusing edge case:** If one wrestler is `leaving_early` and the other is `arriving_late`, the match gets priority 1 (middle). This is the documented "conflicting" state.

**Time slots:** A `globalSlot` counter tracks the current "row" of simultaneous matches across all mats. All mats at the same `globalSlot` run at the same time.

**Rest gap constraint:**
`canAssignAtSlot(wrestler, globalSlot)` returns true only if:

```
globalSlot - wrestler.lastGlobalSlot >= conflict_min_gap
```

This is the cross-mat gap check — a wrestler on Mat 1 slot 3 and Mat 2 slot 3 are simultaneous (both slot 3) so the gap is 0.

**Assignment loop:**

```
while unassigned matches remain:
  for each mat m (0..matCount-1):
    skip if mat already has a match at current globalSlot
    skip if mat is at capacity (max_matches)

    first pass: find first candidate that fits mat preference + rest gap
    second pass: if none, find first candidate that fits rest gap only (no preference)

    if found: assign to matQueues[m], update wrestlerLastGlobalSlot

  if all mats filled this slot OR zero assignments made:
    globalSlot++
    if zero assignments: consecutiveEmptyRounds++

  safety exit: consecutiveEmptyRounds >= matCount * 2
```

**Mat preference check** (`matchFitsMatPreference`):

- `(w1.age + w2.age) / 2` must be in `[rule.min_age, rule.max_age]`
- `avg_experience` must be in `[rule.min_experience, rule.max_experience]`
- `avg_skill` must be in `[rule.min_skill, rule.max_skill]`

Matches that never satisfy any preference or rest gap constraint are dropped (logged as "Could not assign N matches due to constraints").

---

## Phase 4: Match Number Format

```
match_order = (mat_number * 100) + orderIndex
```

Examples:

- `100` = Mat 1, match 0 (first match on Mat 1)
- `101` = Mat 1, match 1
- `200` = Mat 2, match 0

This encoding is used in the UI to sort/display by time slot. The "last 2 digits" (mod 100) give the within-mat slot; the hundreds digit gives the mat.

---

## Display-Side Quality Scoring (Not Used in Generation)

`EditMatchSheet.tsx` and `MeetPairings.tsx` both use a **separate** scoring formula for display badges:

```
displayScore = weightDiff*2 + ageDiff*3 + expDiff*5 + skillDiff*5
```

| Score | Label               |
| ----- | ------------------- |
| < 15  | Great Match (green) |
| 15–29 | Good Match (yellow) |
| ≥ 30  | Fair Match (orange) |

**Note:** This is NOT the same formula as the generation algorithm. The generation formula is priority-weighted and configurable; the display formula is fixed with hard-coded weights (2/3/5/5). They have no formal relationship — a "Great Match" badge doesn't mean the algorithm scored it highly.

---

## `src/lib/wrestlerMatching.ts` — Not the Pairing Algorithm

This file is often confused with the pairing algorithm but does something completely different: **roster deduplication**. When a new wrestler is entered (e.g., via bulk paste), it scores similarity against existing roster entries to detect duplicates.

Scoring: `DOB exact match (50%) + firstName Levenshtein (25%) + lastName Levenshtein (25%)`
Threshold: ≥ 70 = potential duplicate; exact name + DOB = confirmed duplicate.

---

## Known Weaknesses and Issues

Each issue includes an **agreed fix** from design review (2026-02-19).

---

### 1. Greedy, non-optimal matching

Phase 2 is a greedy algorithm — it commits to the first good match found for each wrestler in turn and never backtracks. The sort order of `wrestlersAtLevel` affects global outcome. A wrestler processed early can "steal" a good opponent from a wrestler processed later, leaving the later wrestler with a worse or no match.

**Agreed fix (1B): Local search / swap improvement**
After the greedy pass, run a second pass over all pairs of selected matches and check whether swapping opponents improves the sum of scores:

- For every (A vs B) and (C vs D): check if (A vs D) + (C vs B) produces a lower combined score
- Repeat until no swap improves the total
- O(n² × iterations), fast enough for typical meet sizes (20–80 wrestlers)
- Respects all hard constraints (no-teammate rule, max_age_diff, max_matches) — only swap if both new pairs are valid

This runs after Phase 2 and before Phase 3 (mat assignment), using the already-selected `selectedMatches[]` array.

---

### 2. Priority inversion bug

The attendance priority sort in Phase 2 orders `arriving_late` first (priority 0), but Phase 3 schedules `arriving_late` matches _last_. The comment "limited scheduling window" in the code is wrong — the scheduling window concern is `leaving_early`'s problem, not `arriving_late`'s.

The real issue: `arriving_late` wrestlers processed first in Phase 2 can pair with `leaving_early` wrestlers. In Phase 3 that creates a "conflicting" pair (priority 1, middle) rather than an early-scheduled match, defeating `leaving_early`'s scheduling requirement.

**Agreed fix:**

1. **Flip Phase 2 priorities:** `leaving_early = 0` (process first — they need opponents who will also land in early schedule slots), `arriving_late = 1` (process second), `attending = 2`
2. **Add score penalty for leaving_early × arriving_late pairs:** Not Infinity (they can still match if no better option), but a large penalty (e.g., +200) so the algorithm strongly avoids this combination
3. **Fewer matches for late/early wrestlers is acceptable:** `arriving_late` and `leaving_early` wrestlers may end up with fewer matches than `attending` wrestlers if their scheduling constraints exhaust compatible opponents. This is expected and OK — do not force-fill their match counts.

---

### 3. Mat preference check uses averages

`matchFitsMatPreference` uses `(age1 + age2) / 2` for the age check. A 6-year-old vs a 12-year-old averages to 9, which could pass an age rule targeting 8–10 year olds despite an extreme mismatch. Same issue applies to experience and skill.

**Agreed fix:** Both wrestlers must individually satisfy the mat's range for all three dimensions:

```
w1.age >= min_age AND w1.age <= max_age
AND w2.age >= min_age AND w2.age <= max_age
(same for experience and skill)
```

If a match can't satisfy any mat's individual-check preference, it falls through to the "open" fallback (no preference), which is already the existing behavior for unpreferred matches.

---

### 4. Hard cap on `max_age_diff` vs. priority weight inconsistency

`max_age_diff` is a hard cutoff, but weight, experience, and skill have no hard caps — only soft penalties via the score. A 30lb weight difference can still produce a match if the age, experience, and skill scores are low enough.

**Agreed fix (D):** Add an optional `max_weight_diff` hard cap (integer, lbs) to `meet_rules` and `teams`. Pairs exceeding this cap get score = Infinity and are excluded from candidacy, same as `max_age_diff`. Default: `null` (no cap, backward compatible).

Age and weight hard caps are justified by youth sports safety. Experience and skill mismatches are a quality concern, not a safety one — soft penalties remain appropriate for those.

Schema additions:

- `teams.max_weight_diff` integer nullable
- `meet_rules.max_weight_diff` integer nullable (meet-level override)

---

### 5. `conflict_min_gap` is in "global slots" not calendar time

The rest gap is measured in match slots (positions in the schedule), not minutes. Since match duration cannot be known in advance (it varies by age group, skill, and format), converting to real time is not feasible.

**Agreed fix (label only — no algorithm change):**

- Rename the setting label in the UI from anything time-implied to **"Minimum matches between bouts"**
- Add a tooltip: "A wrestler won't be scheduled again until at least this many matches have run on any mat. Set to 2–3 for adequate rest."
- The slot-based model is pragmatic and correct for this use case — coaches think in "how many matches go by" not minutes

No changes to the Edge Function or database schema.

---

### 6. Dropped matches are silent to the user

Matches that can't be assigned due to rest gap conflicts or hard constraint violations are silently dropped. A wrestler could end up with 0 matches with no explanation shown in the UI.

**Agreed fix (all three parts):**

**Part A — Edge Function diagnostics:**
Add to the response payload:

```json
{
  "matches_created": 24,
  "unassigned_count": 2,
  "wrestlers_with_zero_matches": [{ "id": "...", "name": "Tommy Rodriguez" }]
}
```

**Part B — Generation report sheet:**
After generating, if `unassigned_count > 0`, show a warning sheet listing affected wrestlers with a brief reason (no compatible opponent vs. rest gap conflict). Provides actionable follow-up (add manually via AddMatchSheet).

**Part C — Red auto-flag for 0-match wrestlers:**
Extend the existing auto-flag logic:

- Current: flag wrestlers with `< 2` matches (yellow warning)
- Add: flag wrestlers with `0` matches after generation as a distinct red/critical flag with reason "No match assigned"

The existing flag count badge in the stats bar will surface this immediately.

---

### 7. No preference for cross-team matchups

When `teammates_can_wrestle = true`, same-team and cross-team pairings score identically. In multi-team meets, there is no way to express a preference for cross-team matchups.

Note: `teammates_can_wrestle = false` already hard-blocks same-team matches. This issue is specifically about the `true` case where same-team is allowed but cross-team is preferable.

**Agreed fix:** Add `prefer_cross_team_matches` boolean to `meet_rules` and `teams`. When `true`, apply a score penalty (e.g., +20) to same-team pairings in `calculateMatchScore`. Same-team matches are still allowed as a fallback if no cross-team option is available.

The two settings work together:

| `teammates_can_wrestle` | `prefer_cross_team_matches` | Result                                      |
| ----------------------- | --------------------------- | ------------------------------------------- |
| false                   | —                           | Same-team blocked entirely                  |
| true                    | false                       | Same-team and cross-team scored equally     |
| true                    | true                        | Cross-team preferred; same-team as fallback |

Schema additions:

- `teams.prefer_cross_team_matches` boolean default false
- `meet_rules.prefer_cross_team_matches` boolean nullable (meet-level override)

---

### 8. All-or-nothing regeneration

"Generate Pairings" deletes all existing matches and regenerates from scratch. There is no incremental generation for wrestlers who are added to attendance after the initial generation run (e.g., a wrestler who said they couldn't attend but shows up at the last minute).

**Agreed fix (Option A — "fill unmatched wrestlers only" mode):**
Add an `incremental` boolean to the `generate-pairings` Edge Function request body (default `false`).

When `incremental = true`:

- **Skip the DELETE step** — do not delete existing matches
- **Filter candidate wrestlers** to only those with `matchCounts[id] = 0` (no current matches)
- Run Phases 2 and 3 normally on the filtered set, appending new matches to the existing schedule
- Existing wrestlers are treated as "already matched" and appear in the `usedPairings` set to prevent re-pairing

Primary use case: a wrestler marked `not_attending` changes to `attending` at match day. Host clicks "Fill new arrivals" rather than "Regenerate" to avoid destroying the existing schedule.

UI change: split the current "Generate Pairings" button into:

- **Generate Pairings** — full regeneration, always visible (with destructive confirmation when matches already exist). Kept accessible since coaches may legitimately need to regenerate if pairings were created prematurely.
- **Add new wrestlers** — incremental fill, only visible when matches already exist AND unmatched attending wrestlers are present.

**Incremental matches: "unreviewed" visual state**
Matches created via incremental generation should be visually distinct until reviewed, since the host hasn't seen them yet. Implementation:

- Add a `source` or `is_new` flag to the response (e.g., return the IDs of newly inserted matches)
- In the frontend, highlight new matches with a subtle border/badge (e.g., "New" badge) until the host dismisses or acknowledges them
- This does NOT change `pairing_status` — the status stays at whatever it was (`draft`, `planned`, or `published`). The visual indicator is session-local (cleared on page reload or explicit dismiss), since persisting a "reviewed" flag per match adds schema complexity without much value.

**Pairing status on incremental generation:** Status is NOT reset. If the meet was `published`, it stays `published`. The new matches inherit the existing status. Coaches should be aware that publishing new matches without review is their responsibility — the "unreviewed" highlight is the nudge, not a hard gate.

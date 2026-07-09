# Manual Test: Scenario F — Incremental Pairing Mode (Fix 8)

**Test ID**: pairing-v2-F
**Priority**: P1
**Status**: ⏳ PENDING
**Test Method**: Manual (requires live UI + DB state)
**Feature**: Fix 8 — Incremental mode adds pairings for newly-added wrestlers without disturbing existing matches

---

## Test Objective

Verify that after a full generation has run, adding new wrestlers to a meet and clicking "Add new wrestlers" creates matches only for those new wrestlers, leaves existing matches unchanged, and correctly marks new matches with a "New" badge. Also verify that "Regenerate" discards everything and re-runs from scratch.

---

## Prerequisites

1. UAT test data must be inserted (Scenarios A–E are in Supabase with `[TEST]` prefix teams).
2. Scenario A (`[TEST] Spring Dual 2026`, meet `eeeeeeee-eeee-eeee-eeee-000000000001`) must have pairings already generated (24 matches from the full UAT run).
3. Dev server running on port 5175: `pnpm dev --port 5173` (actual port may vary).
4. Sign in as `natalie.hirsch+75f56404-3230-4b7e-804b-d21dc5aab5e4@volaventures.com`.

---

## Phase 1: Verify Full Generation Baseline

### Step 1.1 — Navigate to Scenario A meet pairings

**Action**: Open `http://localhost:<port>/meets/eeeeeeee-eeee-eeee-eeee-000000000001/pairings`
**Expected**: Match list shows 24 matches across 2 mats, no "New" badges, all wrestlers matched.

### Step 1.2 — Note existing match order values

**Action**: Run in Supabase (MCP or dashboard):

```sql
SELECT id, wrestler_a_id, wrestler_b_id, mat_number, match_order
FROM matches
WHERE meet_id = 'eeeeeeee-eeee-eeee-eeee-000000000001'
ORDER BY mat_number, match_order;
```

**Expected**: 24 rows with `match_order` values 100–N on mat 1, 200–M on mat 2.
**Record**: Note the max `match_order` per mat.

---

## Phase 2: Add New Wrestlers

### Step 2.1 — Insert 2 new wrestlers to [TEST] Wildcats

**Action**: Run in Supabase:

```sql
INSERT INTO wrestlers (id, first_name, last_name, weight, date_of_birth, experience, skill, team_id, status)
VALUES
  ('aaaa1099-0000-0000-0000-000000000000', 'Zara', 'Test', 105, '2011-06-01', 2, 2,
   'ffffffff-ffff-ffff-ffff-000000000001', 'active'),
  ('aaaa2099-0000-0000-0000-000000000000', 'Zion', 'Test', 102, '2011-09-15', 2, 2,
   'ffffffff-ffff-ffff-ffff-000000000002', 'active');

INSERT INTO meet_attendance (meet_id, wrestler_id, team_id, status)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-000000000001', 'aaaa1099-0000-0000-0000-000000000000',
   'ffffffff-ffff-ffff-ffff-000000000001', 'attending'),
  ('eeeeeeee-eeee-eeee-eeee-000000000001', 'aaaa2099-0000-0000-0000-000000000000',
   'ffffffff-ffff-ffff-ffff-000000000002', 'attending');
```

**Expected**: 2 new wrestlers inserted, attendance records added.

### Step 2.2 — Refresh the pairings page

**Action**: Reload `http://localhost:<port>/meets/eeeeeeee-eeee-eeee-eeee-000000000001/pairings`
**Expected**:

- A banner/button appears saying **"Add new wrestlers (2)"** or similar incremental prompt.
- Existing 24 matches still shown without changes.

---

## Phase 3: Run Incremental Mode

### Step 3.1 — Click "Add new wrestlers"

**Action**: Click the incremental add button.
**Expected**:

- API call returns `matches_created: 1` (Zara vs Zion).
- The new match appears in the UI with a **"New" badge** (blue highlight).
- Existing 24 matches remain unchanged — same IDs, same match_order values.
- New match has `match_order > 100` on the max existing order for that mat (no collision).

### Step 3.2 — Verify in DB

**Action**:

```sql
SELECT id, wrestler_a_id, wrestler_b_id, mat_number, match_order
FROM matches
WHERE meet_id = 'eeeeeeee-eeee-eeee-eeee-000000000001'
ORDER BY mat_number, match_order;
```

**Expected**:

- 25 total matches (24 original + 1 new).
- New match has `match_order` higher than any existing order on the same mat.
- No original match IDs changed.

### Step 3.3 — Verify new match has unique pair

**Action**:

```sql
SELECT
  LEAST(wrestler_a_id::text, wrestler_b_id::text) || '-' ||
  GREATEST(wrestler_a_id::text, wrestler_b_id::text) AS pair_key,
  COUNT(*)
FROM matches
WHERE meet_id = 'eeeeeeee-eeee-eeee-eeee-000000000001'
GROUP BY pair_key
HAVING COUNT(*) > 1;
```

**Expected**: 0 rows (no duplicate pairs).

---

## Phase 4: Regenerate from Scratch

### Step 4.1 — Click "Regenerate"

**Action**: Click the "Regenerate" (full regeneration) button.
**Expected**: Confirmation dialog appears warning that all existing matches will be deleted.

### Step 4.2 — Confirm regeneration

**Action**: Confirm the dialog.
**Expected**:

- All 25 existing matches deleted.
- Fresh full generation runs including Zara and Zion (now 18 wrestlers total).
- Approximately 24–27 new matches created.
- No "New" badges (everything is fresh).
- GenerationReportSheet opens and shows success state.

### Step 4.3 — Verify no old match IDs remain

**Action**:

```sql
SELECT COUNT(*) FROM matches
WHERE meet_id = 'eeeeeeee-eeee-eeee-eeee-000000000001';
```

**Expected**: Count changed from 25 to approximately 24–27 (fresh generation, not 25).

---

## Phase 5: Cleanup (Optional)

Remove the two test wrestlers when done:

```sql
DELETE FROM wrestlers
WHERE id IN (
  'aaaa1099-0000-0000-0000-000000000000',
  'aaaa2099-0000-0000-0000-000000000000'
);
```

This cascades to `meet_attendance` and `matches`.

---

## Test Results

**Status**: ⏳ NOT YET RUN
**Last Run**: N/A
**Tester**: —

**Steps passed**: —
**Issues found**: —

---

## Related

- Fix 8 implementation: `supabase/functions/generate-pairings/index.ts` (incremental mode flag)
- Pairing algorithm shared code: `supabase/functions/_shared/pairingAlgorithm.ts`
- UAT generation script: `scripts/uat-generate-pairings.mjs`

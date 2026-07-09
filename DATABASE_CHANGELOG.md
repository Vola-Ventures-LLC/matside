# Database Changelog

## Migration Index

| Migration Name                            | Date       | Tables Affected       |
| ----------------------------------------- | ---------- | --------------------- |
| `add_weight_diff_and_cross_team_settings` | 2026-02-20 | `teams`, `meet_rules` |

---

## Pairing v2: Weight Diff and Cross-Team Settings (2026-02-20)

**Migration**: `add_weight_diff_and_cross_team_settings`

**Changes**:

1. Added `teams.max_weight_diff` — integer nullable, hard cap on weight difference (lbs) for eligible pairs. NULL = no cap. Default: NULL (backward compatible).
2. Added `teams.prefer_cross_team_matches` — boolean NOT NULL DEFAULT false. When true, same-team pairings receive a soft score penalty to prefer cross-team matchups.
3. Added `meet_rules.max_weight_diff` — integer nullable, meet-level override for `max_weight_diff`. NULL = inherit from team.
4. Added `meet_rules.prefer_cross_team_matches` — boolean nullable, meet-level override. NULL = inherit from team.

**Rationale**: Fix 4 (weight hard cap) addresses youth sports safety, analogous to the existing `max_age_diff` cap. Fix 7 (cross-team preference) allows multi-team meets to express a soft preference for cross-team matchups without hard-blocking same-team matches.

**Backward compatibility**: All four columns are nullable or have defaults. Existing rows are unaffected. The Edge Function and UI treat NULL `max_weight_diff` as "no cap" and NULL `prefer_cross_team_matches` as false (inherit team default).

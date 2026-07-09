# MatSide Documentation Index

## Feature Status Dashboard

| Feature                          | Status | PRD                 | Implementation | Tests |
| -------------------------------- | ------ | ------------------- | -------------- | ----- |
| Pairing Algorithm v2 (Fixes 1–8) | ✅     | `plans/pairing-v2/` | ✅             | ✅    |

## Document Index

| Document               | Purpose                                  | Location                                |
| ---------------------- | ---------------------------------------- | --------------------------------------- |
| IMPLEMENTATION_LOG.md  | Feature implementation history           | `/IMPLEMENTATION_LOG.md`                |
| DATABASE_CHANGELOG.md  | Database migration history               | `/DATABASE_CHANGELOG.md`                |
| DOCUMENTATION_INDEX.md | This file — feature status overview      | `/DOCUMENTATION_INDEX.md`               |
| pairing-algorithm.md   | As-built pairing algorithm documentation | `/docs/pairing-algorithm.md`            |
| review-architect.md    | Architect review for pairing v2          | `/plans/pairing-v2/review-architect.md` |
| review-engineer.md     | Engineer review for pairing v2           | `/plans/pairing-v2/review-engineer.md`  |

## Key Files

| File                                             | Purpose                                         |
| ------------------------------------------------ | ----------------------------------------------- |
| `supabase/functions/generate-pairings/index.ts`  | Core pairing algorithm (Deno Edge Function)     |
| `src/pages/MeetPairings.tsx`                     | Meet pairings UI (host + attendee view)         |
| `src/components/meets/MeetRulesSheet.tsx`        | Pairing rules configuration sheet               |
| `src/components/meets/GenerationReportSheet.tsx` | Post-generation report (unmatched wrestlers)    |
| `src/integrations/supabase/types.ts`             | Generated TypeScript types from Supabase schema |

import { describe, it, expect } from 'vitest';
import { getFlagSeverity } from '../MeetPairings';

describe('getFlagSeverity', () => {
  describe('when no matches have been generated (totalMatchesGenerated=0)', () => {
    it('returns null regardless of match count or status', () => {
      expect(getFlagSeverity(0, 'attending', 0)).toBeNull();
      expect(getFlagSeverity(1, 'attending', 0)).toBeNull();
      expect(getFlagSeverity(0, 'leaving_early', 0)).toBeNull();
    });
  });

  describe('critical severity (0 matches)', () => {
    it('attending with 0 matches → critical', () => {
      expect(getFlagSeverity(0, 'attending', 10)).toBe('critical');
    });

    it('arriving_late with 0 matches → critical', () => {
      expect(getFlagSeverity(0, 'arriving_late', 10)).toBe('critical');
    });

    it('leaving_early with 0 matches → critical', () => {
      expect(getFlagSeverity(0, 'leaving_early', 10)).toBe('critical');
    });

    it('unconfirmed with 0 matches → null (not flagged)', () => {
      expect(getFlagSeverity(0, 'unconfirmed', 10)).toBeNull();
    });

    it('not_attending with 0 matches → null', () => {
      expect(getFlagSeverity(0, 'not_attending', 10)).toBeNull();
    });
  });

  describe('warning severity (1 match)', () => {
    it('attending with 1 match → warning', () => {
      expect(getFlagSeverity(1, 'attending', 10)).toBe('warning');
    });

    it('arriving_late with 1 match → warning', () => {
      expect(getFlagSeverity(1, 'arriving_late', 10)).toBe('warning');
    });

    it('leaving_early with 1 match → warning', () => {
      expect(getFlagSeverity(1, 'leaving_early', 10)).toBe('warning');
    });

    it('unconfirmed with 1 match → null (not flagged)', () => {
      expect(getFlagSeverity(1, 'unconfirmed', 10)).toBeNull();
    });
  });

  describe('no flag (2-5 matches)', () => {
    it('attending with 2 matches → null', () => {
      expect(getFlagSeverity(2, 'attending', 10)).toBeNull();
    });

    it('attending with 5 matches → null', () => {
      expect(getFlagSeverity(5, 'attending', 10)).toBeNull();
    });
  });

  describe('warning severity (too many matches, >5)', () => {
    it('attending with 6 matches → warning', () => {
      expect(getFlagSeverity(6, 'attending', 20)).toBe('warning');
    });

    it('unconfirmed with 6 matches → warning (status does not matter for >5 check)', () => {
      expect(getFlagSeverity(6, 'unconfirmed', 20)).toBe('warning');
    });

    it('attending with 10 matches → warning', () => {
      expect(getFlagSeverity(10, 'attending', 30)).toBe('warning');
    });
  });
});

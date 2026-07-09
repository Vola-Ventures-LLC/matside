import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GenerationReportSheet, type ZeroMatchWrestler } from '../GenerationReportSheet';

const renderSheet = (props: {
  open?: boolean;
  matchesCreated?: number;
  wrestlersWithZeroMatches?: ZeroMatchWrestler[];
}) =>
  render(
    <GenerationReportSheet
      open={props.open ?? true}
      onOpenChange={() => {}}
      matchesCreated={props.matchesCreated ?? 0}
      wrestlersWithZeroMatches={props.wrestlersWithZeroMatches ?? []}
    />,
  );

describe('GenerationReportSheet', () => {
  describe('success state (no unmatched wrestlers)', () => {
    it('shows success message when all wrestlers are matched', () => {
      renderSheet({ matchesCreated: 8, wrestlersWithZeroMatches: [] });
      expect(screen.getByText(/all attending wrestlers were matched/i)).toBeInTheDocument();
    });

    it('displays correct match count in description', () => {
      renderSheet({ matchesCreated: 8, wrestlersWithZeroMatches: [] });
      expect(screen.getByText(/8 matches created/i)).toBeInTheDocument();
    });

    it('singular "match" when matchesCreated=1', () => {
      renderSheet({ matchesCreated: 1, wrestlersWithZeroMatches: [] });
      expect(screen.getByText(/1 match created/i)).toBeInTheDocument();
    });
  });

  describe('no_compatible_opponent section', () => {
    const noOpponent: ZeroMatchWrestler[] = [
      { id: 'w1', name: 'Alice Smith', reason: 'no_compatible_opponent' },
      { id: 'w2', name: 'Bob Jones', reason: 'no_compatible_opponent' },
    ];

    it('renders "No compatible opponent" heading', () => {
      renderSheet({ matchesCreated: 4, wrestlersWithZeroMatches: noOpponent });
      expect(screen.getByText(/no compatible opponent/i)).toBeInTheDocument();
    });

    it('lists wrestler names', () => {
      renderSheet({ matchesCreated: 4, wrestlersWithZeroMatches: noOpponent });
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('does not render scheduling conflict section when only no_compatible_opponent', () => {
      renderSheet({ matchesCreated: 4, wrestlersWithZeroMatches: noOpponent });
      expect(screen.queryByText(/scheduling conflict/i)).not.toBeInTheDocument();
    });
  });

  describe('rest_gap_conflict section', () => {
    const restGap: ZeroMatchWrestler[] = [
      { id: 'w3', name: 'Carol White', reason: 'rest_gap_conflict' },
    ];

    it('renders "Scheduling conflict" heading', () => {
      renderSheet({ matchesCreated: 4, wrestlersWithZeroMatches: restGap });
      expect(screen.getByText(/scheduling conflict/i)).toBeInTheDocument();
    });

    it('lists wrestler name', () => {
      renderSheet({ matchesCreated: 4, wrestlersWithZeroMatches: restGap });
      expect(screen.getByText('Carol White')).toBeInTheDocument();
    });

    it('does not render no_compatible_opponent section', () => {
      renderSheet({ matchesCreated: 4, wrestlersWithZeroMatches: restGap });
      expect(screen.queryByText(/no compatible opponent/i)).not.toBeInTheDocument();
    });
  });

  describe('mixed reasons', () => {
    const mixed: ZeroMatchWrestler[] = [
      { id: 'w1', name: 'Alice Smith', reason: 'no_compatible_opponent' },
      { id: 'w2', name: 'Bob Jones', reason: 'rest_gap_conflict' },
    ];

    it('renders both sections', () => {
      renderSheet({ matchesCreated: 4, wrestlersWithZeroMatches: mixed });
      expect(screen.getByText(/no compatible opponent/i)).toBeInTheDocument();
      expect(screen.getByText(/scheduling conflict/i)).toBeInTheDocument();
    });

    it('shows wrestler count in description', () => {
      renderSheet({ matchesCreated: 4, wrestlersWithZeroMatches: mixed });
      expect(screen.getByText(/2 wrestlers unmatched/i)).toBeInTheDocument();
    });
  });

  describe('unmatched count in description', () => {
    it('singular "wrestler" when 1 unmatched', () => {
      renderSheet({
        matchesCreated: 4,
        wrestlersWithZeroMatches: [{ id: 'w1', name: 'Alice Smith', reason: 'no_compatible_opponent' }],
      });
      expect(screen.getByText(/1 wrestler unmatched/i)).toBeInTheDocument();
    });

    it('plural "wrestlers" when 2+ unmatched', () => {
      renderSheet({
        matchesCreated: 4,
        wrestlersWithZeroMatches: [
          { id: 'w1', name: 'Alice Smith', reason: 'no_compatible_opponent' },
          { id: 'w2', name: 'Bob Jones', reason: 'rest_gap_conflict' },
        ],
      });
      expect(screen.getByText(/2 wrestlers unmatched/i)).toBeInTheDocument();
    });
  });
});

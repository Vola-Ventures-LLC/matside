interface Wrestler {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  weight: number;
  experience: number;
  skill: number;
}

interface MatchResult {
  wrestler: Wrestler;
  score: number;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function levenshteinSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  
  if (aLower === bLower) return 100;
  if (aLower.length === 0 || bLower.length === 0) return 0;

  const matrix: number[][] = [];

  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[bLower.length][aLower.length];
  const maxLength = Math.max(aLower.length, bLower.length);
  return Math.round((1 - distance / maxLength) * 100);
}

/**
 * Calculate match score between a new wrestler and an existing one
 */
export function calculateWrestlerMatchScore(
  newWrestler: { first_name: string; last_name: string; date_of_birth: string },
  existing: Wrestler
): number {
  // DOB exact match is weighted heavily (50%)
  const dobMatch = newWrestler.date_of_birth === existing.date_of_birth ? 50 : 0;
  
  // First name similarity (25%)
  const firstNameScore = levenshteinSimilarity(newWrestler.first_name, existing.first_name) * 0.25;
  
  // Last name similarity (25%)
  const lastNameScore = levenshteinSimilarity(newWrestler.last_name, existing.last_name) * 0.25;
  
  return Math.round(dobMatch + firstNameScore + lastNameScore);
}

/**
 * Find potential matches for a wrestler in a list
 * Returns matches sorted by score (highest first)
 */
export function findPotentialMatches(
  newWrestler: { first_name: string; last_name: string; date_of_birth: string },
  existingWrestlers: Wrestler[],
  threshold: number = 70 // Minimum score to be considered a potential match
): MatchResult[] {
  const matches: MatchResult[] = [];

  for (const existing of existingWrestlers) {
    const score = calculateWrestlerMatchScore(newWrestler, existing);
    if (score >= threshold) {
      matches.push({ wrestler: existing, score });
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Check if a wrestler exactly matches (same name + DOB)
 */
export function isExactMatch(
  newWrestler: { first_name: string; last_name: string; date_of_birth: string },
  existing: Wrestler
): boolean {
  return (
    newWrestler.first_name.toLowerCase().trim() === existing.first_name.toLowerCase().trim() &&
    newWrestler.last_name.toLowerCase().trim() === existing.last_name.toLowerCase().trim() &&
    newWrestler.date_of_birth === existing.date_of_birth
  );
}

/**
 * Find an exact match in a list
 */
export function findExactMatch(
  newWrestler: { first_name: string; last_name: string; date_of_birth: string },
  existingWrestlers: Wrestler[]
): Wrestler | null {
  return existingWrestlers.find(w => isExactMatch(newWrestler, w)) || null;
}

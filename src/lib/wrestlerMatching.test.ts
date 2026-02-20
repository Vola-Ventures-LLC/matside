import { describe, it, expect } from "vitest";
import {
  calculateWrestlerMatchScore,
  findPotentialMatches,
  isExactMatch,
  findExactMatch,
} from "./wrestlerMatching";

const baseWrestler = {
  id: "1",
  first_name: "John",
  last_name: "Smith",
  date_of_birth: "2015-06-15",
  weight: 65,
  experience: 2,
  skill: 3,
};

describe("calculateWrestlerMatchScore", () => {
  it("returns 100 for a perfect name + DOB match", () => {
    const score = calculateWrestlerMatchScore(
      { first_name: "John", last_name: "Smith", date_of_birth: "2015-06-15" },
      baseWrestler
    );
    expect(score).toBe(100);
  });

  it("returns 50 when DOB matches but names are completely different", () => {
    const score = calculateWrestlerMatchScore(
      { first_name: "Xyz", last_name: "Abc", date_of_birth: "2015-06-15" },
      baseWrestler
    );
    // DOB = 50, names ≈ 0
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(60);
  });

  it("returns 0 when DOB and names are all different", () => {
    const score = calculateWrestlerMatchScore(
      { first_name: "Xyz", last_name: "Abc", date_of_birth: "2000-01-01" },
      baseWrestler
    );
    expect(score).toBeLessThan(30);
  });

  it("returns high score for same DOB and close names (typo)", () => {
    const score = calculateWrestlerMatchScore(
      { first_name: "Jon", last_name: "Smith", date_of_birth: "2015-06-15" },
      baseWrestler
    );
    // DOB (50) + near-perfect names (~25) = ~90+
    expect(score).toBeGreaterThan(85);
  });

  it("is case-insensitive for name comparison", () => {
    const lower = calculateWrestlerMatchScore(
      { first_name: "john", last_name: "smith", date_of_birth: "2015-06-15" },
      baseWrestler
    );
    const upper = calculateWrestlerMatchScore(
      { first_name: "JOHN", last_name: "SMITH", date_of_birth: "2015-06-15" },
      baseWrestler
    );
    expect(lower).toBe(100);
    expect(upper).toBe(100);
  });

  it("returns 100 when names and DOB are all identical empty strings", () => {
    const score = calculateWrestlerMatchScore(
      { first_name: "", last_name: "", date_of_birth: "" },
      { ...baseWrestler, first_name: "", last_name: "", date_of_birth: "" }
    );
    // DOB "" === "" → 50; levenshteinSimilarity("","") returns 100 (equal)
    // 50 + (100 * 0.25) + (100 * 0.25) = 100
    expect(score).toBe(100);
  });
});

describe("findPotentialMatches", () => {
  const wrestlers = [
    { ...baseWrestler, id: "1", first_name: "John", last_name: "Smith" },
    { ...baseWrestler, id: "2", first_name: "Jane", last_name: "Doe", date_of_birth: "2016-03-20" },
    { ...baseWrestler, id: "3", first_name: "Mike", last_name: "Johnson", date_of_birth: "2014-11-05" },
  ];

  it("returns matches above threshold sorted by score descending", () => {
    const results = findPotentialMatches(
      { first_name: "John", last_name: "Smith", date_of_birth: "2015-06-15" },
      wrestlers,
      70
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].wrestler.id).toBe("1");
    expect(results[0].score).toBe(100);
  });

  it("returns empty array when no matches meet threshold", () => {
    const results = findPotentialMatches(
      { first_name: "Zzz", last_name: "Qqq", date_of_birth: "1900-01-01" },
      wrestlers,
      70
    );
    expect(results).toEqual([]);
  });

  it("uses default threshold of 70", () => {
    const results = findPotentialMatches(
      { first_name: "John", last_name: "Smith", date_of_birth: "2015-06-15" },
      wrestlers
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBe(100);
  });

  it("returns multiple matches when several score above threshold", () => {
    const sameAgeWrestlers = wrestlers.map(w => ({
      ...w,
      date_of_birth: "2015-06-15",
    }));
    // All share same DOB → all get at least 50; names vary
    const results = findPotentialMatches(
      { first_name: "John", last_name: "Smith", date_of_birth: "2015-06-15" },
      sameAgeWrestlers,
      50
    );
    expect(results.length).toBe(3);
    // Sorted descending
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  });

  it("returns empty array for empty wrestler list", () => {
    const results = findPotentialMatches(
      { first_name: "John", last_name: "Smith", date_of_birth: "2015-06-15" },
      []
    );
    expect(results).toEqual([]);
  });
});

describe("isExactMatch", () => {
  it("returns true for identical names and DOB", () => {
    expect(
      isExactMatch(
        { first_name: "John", last_name: "Smith", date_of_birth: "2015-06-15" },
        baseWrestler
      )
    ).toBe(true);
  });

  it("returns false when DOB differs", () => {
    expect(
      isExactMatch(
        { first_name: "John", last_name: "Smith", date_of_birth: "2015-06-16" },
        baseWrestler
      )
    ).toBe(false);
  });

  it("returns false when first name differs", () => {
    expect(
      isExactMatch(
        { first_name: "Jon", last_name: "Smith", date_of_birth: "2015-06-15" },
        baseWrestler
      )
    ).toBe(false);
  });

  it("returns false when last name differs", () => {
    expect(
      isExactMatch(
        { first_name: "John", last_name: "Smyth", date_of_birth: "2015-06-15" },
        baseWrestler
      )
    ).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(
      isExactMatch(
        { first_name: "JOHN", last_name: "SMITH", date_of_birth: "2015-06-15" },
        baseWrestler
      )
    ).toBe(true);
  });

  it("trims whitespace from names", () => {
    expect(
      isExactMatch(
        { first_name: "  John  ", last_name: "  Smith  ", date_of_birth: "2015-06-15" },
        baseWrestler
      )
    ).toBe(true);
  });
});

describe("findExactMatch", () => {
  const wrestlers = [
    { ...baseWrestler, id: "1", first_name: "John", last_name: "Smith" },
    { ...baseWrestler, id: "2", first_name: "Jane", last_name: "Doe", date_of_birth: "2016-03-20" },
  ];

  it("finds the correct wrestler when exact match exists", () => {
    const result = findExactMatch(
      { first_name: "John", last_name: "Smith", date_of_birth: "2015-06-15" },
      wrestlers
    );
    expect(result).not.toBeNull();
    expect(result?.id).toBe("1");
  });

  it("returns null when no exact match", () => {
    const result = findExactMatch(
      { first_name: "John", last_name: "Smith", date_of_birth: "2016-03-20" },
      wrestlers
    );
    expect(result).toBeNull();
  });

  it("returns null for empty wrestler list", () => {
    const result = findExactMatch(
      { first_name: "John", last_name: "Smith", date_of_birth: "2015-06-15" },
      []
    );
    expect(result).toBeNull();
  });
});
